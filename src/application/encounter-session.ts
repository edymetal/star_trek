import { ENERGY_PRESETS, PLAYER_ENERGY_DEFINITION } from '../content/energy-content';
import {
  COMBAT_LINE_OF_SIGHT_OBSTACLES,
  ENEMY_AI_DEFINITION,
  ENEMY_CONTENT,
  ENEMY_DAMAGE_DEFINITION,
  EQUIPMENT_DEFINITIONS,
  PLAYER_DAMAGE_DEFINITION,
  SENSOR_DEFINITION,
} from '../content/combat-content';
import {
  applyImpact,
  createInitialDamageState,
  stepDamageState,
  totalHullIntegrity,
  totalShieldCharge,
  type DamageDefinition,
  type DamageState,
} from '../domain/combat/damage';
import {
  createInitialEnemyAiState,
  stepEnemyAi,
  type EnemyAiState,
} from '../domain/combat/enemy-ai';
import { hasLineOfSight, type SphericalLineOfSightObstacle } from '../domain/combat/line-of-sight';
import {
  createUnknownContact,
  selectNextContact,
  stepSensorContact,
  toPublicContact,
  validateSelectedContact,
  type PublicContact,
} from '../domain/combat/sensors';
import {
  createInitialWeaponSystemState,
  stepWeaponSystemState,
  tryUseEquipment,
  type EquipmentFailureReason,
  type EquipmentId,
  type WeaponSystemState,
} from '../domain/combat/weapons';
import {
  createInitialEnergyState,
  setEnergyAllocation,
  stepEnergySystems,
  type EnergyEffects,
  type EnergyFlow,
  type EnergySystemState,
} from '../domain/energy/energy-system';
import type { ShipState, Vector3Value } from '../domain/flight/ship-flight';

export type EncounterPhase = 'active' | 'victory' | 'defeat';
export type CombatEffectKind = 'beam' | 'enemy-beam' | 'torpedo' | 'tractor';

export type EncounterCommand =
  | { readonly type: 'select-next-target' }
  | { readonly type: 'clear-target' }
  | { readonly type: 'toggle-scan' }
  | { readonly equipmentId: EquipmentId; readonly type: 'use-equipment' };

export interface CombatEffectSnapshot {
  readonly kind: CombatEffectKind;
  readonly remainingSeconds: number;
  readonly serial: number;
  readonly targetPosition: Vector3Value;
}

export interface EncounterEnemySnapshot {
  readonly aiMode: EnemyAiState['mode'];
  readonly damage: DamageState;
  readonly energyProfile: 'attack' | 'balanced' | 'defense' | 'escape';
  readonly hullPercent: number;
  readonly orientationDegrees: Vector3Value;
  readonly position: Vector3Value;
  readonly shieldPercent: number;
}

export interface EncounterSnapshot {
  readonly activeScan: boolean;
  readonly contact: PublicContact;
  readonly effect?: CombatEffectSnapshot;
  readonly enemy: EncounterEnemySnapshot;
  readonly feedback: string;
  readonly phase: EncounterPhase;
  readonly playerDamage: DamageState;
  readonly playerHullPercent: number;
  readonly playerShieldPercent: number;
  readonly projectileCount: number;
  readonly projectilePosition?: Vector3Value;
  readonly selectedContactId?: string;
  readonly torpedoAmmo: number;
  readonly tractorActive: boolean;
  readonly weaponCooldownSeconds: WeaponSystemState['cooldownSeconds'];
}

export interface EncounterStepContext {
  readonly deltaSeconds: number;
  readonly playerEnergyEffects: EnergyEffects;
  readonly playerEnergyFlow: EnergyFlow;
  readonly playerEnergyState: EnergySystemState;
  readonly playerShip: ShipState;
}

export interface EncounterStepResult {
  readonly playerEnergyState: EnergySystemState;
  readonly snapshot: EncounterSnapshot;
}

export interface EncounterSession {
  applyCommand(command: EncounterCommand, context: EncounterStepContext): EncounterStepResult;
  getSnapshot(): EncounterSnapshot;
  restart(): void;
  step(context: EncounterStepContext): EncounterStepResult;
}

export interface EncounterSessionOptions {
  readonly enemyInitialPosition: Vector3Value;
  readonly lineOfSightObstacles?: readonly SphericalLineOfSightObstacle[];
  readonly playerInitialShieldChargeUnits: number;
}

interface TorpedoProjectile {
  readonly damageUnits: number;
  readonly overflowToHull: boolean;
  readonly speedUnitsPerSecond: number;
  readonly sourcePosition: Vector3Value;
  readonly initialDistanceUnits: number;
  remainingDistanceUnits: number;
  targetPosition: Vector3Value;
}

interface MutableEffect {
  kind: CombatEffectKind;
  remainingSeconds: number;
  serial: number;
  targetPosition: Vector3Value;
}

const RADIANS_TO_DEGREES = 180 / Math.PI;
const DEGREES_TO_RADIANS = Math.PI / 180;

function add(left: Vector3Value, right: Vector3Value): Vector3Value {
  return { x: left.x + right.x, y: left.y + right.y, z: left.z + right.z };
}

function subtract(left: Vector3Value, right: Vector3Value): Vector3Value {
  return { x: left.x - right.x, y: left.y - right.y, z: left.z - right.z };
}

function scale(value: Vector3Value, multiplier: number): Vector3Value {
  return { x: value.x * multiplier, y: value.y * multiplier, z: value.z * multiplier };
}

function length(value: Vector3Value): number {
  return Math.hypot(value.x, value.y, value.z);
}

function normalize(value: Vector3Value): Vector3Value {
  const magnitude = length(value);
  return magnitude <= Number.EPSILON ? { x: 0, y: 0, z: 0 } : scale(value, 1 / magnitude);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function forwardFromOrientation(orientation: Vector3Value): Vector3Value {
  const yaw = orientation.y * DEGREES_TO_RADIANS;
  const pitch = orientation.x * DEGREES_TO_RADIANS;
  const pitchCosine = Math.cos(pitch);
  return {
    x: -Math.sin(yaw) * pitchCosine,
    y: Math.sin(pitch),
    z: -Math.cos(yaw) * pitchCosine,
  };
}

function firingSolution(
  origin: Vector3Value,
  orientation: Vector3Value,
  target: Vector3Value,
): number {
  const direction = normalize(subtract(target, origin));
  const forward = forwardFromOrientation(orientation);
  return clamp(forward.x * direction.x + forward.y * direction.y + forward.z * direction.z, -1, 1);
}

function desiredYaw(origin: Vector3Value, target: Vector3Value): number {
  const direction = subtract(target, origin);
  return Math.atan2(-direction.x, -direction.z) * RADIANS_TO_DEGREES;
}

function approachAngle(current: number, target: number, maximumDelta: number): number {
  const difference = ((target - current + 540) % 360) - 180;
  return current + clamp(difference, -maximumDelta, maximumDelta);
}

function sourceDirection(attacker: Vector3Value, target: Vector3Value): Vector3Value {
  return normalize(subtract(attacker, target));
}

function sensorSnapshot(
  observerPosition: Vector3Value,
  observerOrientation: Vector3Value,
  targetPosition: Vector3Value,
) {
  const offset = subtract(targetPosition, observerPosition);
  return {
    bearingDegrees: desiredYaw(observerPosition, targetPosition),
    directionFromObserver: normalize(offset),
    distanceUnits: length(offset),
    firingSolution: firingSolution(observerPosition, observerOrientation, targetPosition),
    position: { ...targetPosition },
  };
}

function withShieldFraction(
  definition: DamageDefinition,
  state: DamageState,
  fraction: number,
): DamageState {
  const charge = definition.shieldCapacityPerSector * clamp(fraction, 0, 1);
  return {
    ...state,
    shields: { front: charge, port: charge, rear: charge, starboard: charge },
  };
}

function syncEnergyIntegrity(
  energyState: EnergySystemState,
  damageState: DamageState,
): EnergySystemState {
  return {
    ...energyState,
    integrity: {
      ...energyState.integrity,
      auxiliary: damageState.subsystems.sensors,
      engines: damageState.subsystems.engines,
      shields: damageState.subsystems.shields,
      weapons: damageState.subsystems.weapons,
    },
  };
}

const FAILURE_MESSAGES: Readonly<Record<EquipmentFailureReason, string>> = {
  cooldown: 'Equipamento em recarga.',
  'firing-solution': 'Sem solução de tiro suficiente.',
  'insufficient-capacitor': 'Capacitor de armas insuficiente.',
  'insufficient-power': 'Energia do sistema insuficiente.',
  'line-of-sight': 'Linha de visão obstruída.',
  'mass-limit': 'Alvo excede a força do raio trator.',
  'no-ammunition': 'Sem torpedos disponíveis.',
  'no-target': 'Selecione um contato detectado.',
  'out-of-range': 'Alvo fora do alcance do equipamento.',
  'subsystem-disabled': 'Subsistema de armas desativado.',
  'target-unidentified': 'Identifique o contato antes de usar este equipamento.',
};

export function createEncounterSession(options: EncounterSessionOptions): EncounterSession {
  const lineOfSightObstacles = options.lineOfSightObstacles ?? COMBAT_LINE_OF_SIGHT_OBSTACLES;
  let activeScan = false;
  let aiState = createInitialEnemyAiState();
  let contact = createUnknownContact(ENEMY_CONTENT.id);
  let effect: MutableEffect | undefined;
  let effectSerial = 0;
  let enemyContact = createUnknownContact('player-aurora');
  let enemyDamage = createInitialDamageState(ENEMY_DAMAGE_DEFINITION);
  let enemyEnergyProfile: EncounterEnemySnapshot['energyProfile'] = 'balanced';
  let enemyEnergyState = createInitialEnergyState(PLAYER_ENERGY_DEFINITION, {
    allocation: ENERGY_PRESETS.balanced.allocation,
    shieldChargeUnits: ENEMY_DAMAGE_DEFINITION.shieldCapacityPerSector * 4,
    weaponCapacitorUnits: 100,
    weaponHeatUnits: 0,
  });
  let enemyOrientation: Vector3Value = { x: 0, y: -166, z: 0 };
  let enemyPosition = { ...options.enemyInitialPosition };
  let enemyWeaponState = createInitialWeaponSystemState(0);
  let feedback = 'Detecte um contato e pressione Selecionar alvo.';
  let feedbackHoldSeconds = 0;
  let phase: EncounterPhase = 'active';
  let playerDamage = withShieldFraction(
    PLAYER_DAMAGE_DEFINITION,
    createInitialDamageState(PLAYER_DAMAGE_DEFINITION),
    options.playerInitialShieldChargeUnits / (PLAYER_DAMAGE_DEFINITION.shieldCapacityPerSector * 4),
  );
  let playerWeaponState = createInitialWeaponSystemState(6);
  let projectiles: TorpedoProjectile[] = [];
  let selectedContactId: string | undefined;
  let tractorSeconds = 0;

  function reset(): void {
    activeScan = false;
    aiState = createInitialEnemyAiState();
    contact = createUnknownContact(ENEMY_CONTENT.id);
    effect = undefined;
    enemyContact = createUnknownContact('player-aurora');
    enemyDamage = createInitialDamageState(ENEMY_DAMAGE_DEFINITION);
    enemyEnergyProfile = 'balanced';
    enemyEnergyState = createInitialEnergyState(PLAYER_ENERGY_DEFINITION, {
      allocation: ENERGY_PRESETS.balanced.allocation,
      shieldChargeUnits: ENEMY_DAMAGE_DEFINITION.shieldCapacityPerSector * 4,
      weaponCapacitorUnits: 100,
      weaponHeatUnits: 0,
    });
    enemyOrientation = { x: 0, y: -166, z: 0 };
    enemyPosition = { ...options.enemyInitialPosition };
    enemyWeaponState = createInitialWeaponSystemState(0);
    feedback = 'Encontro reiniciado. Detecte e selecione o contato.';
    feedbackHoldSeconds = 0;
    phase = 'active';
    playerDamage = withShieldFraction(
      PLAYER_DAMAGE_DEFINITION,
      createInitialDamageState(PLAYER_DAMAGE_DEFINITION),
      options.playerInitialShieldChargeUnits /
        (PLAYER_DAMAGE_DEFINITION.shieldCapacityPerSector * 4),
    );
    playerWeaponState = createInitialWeaponSystemState(6);
    projectiles = [];
    selectedContactId = undefined;
    tractorSeconds = 0;
  }

  function setEffect(kind: CombatEffectKind, targetPosition: Vector3Value): void {
    effectSerial += 1;
    effect = { kind, remainingSeconds: 0.22, serial: effectSerial, targetPosition };
  }

  function snapshot(): EncounterSnapshot {
    const publicContact = toPublicContact(SENSOR_DEFINITION, contact, ENEMY_CONTENT.displayName);
    const firstProjectile = projectiles[0];
    const projectilePosition =
      firstProjectile === undefined
        ? undefined
        : add(
            firstProjectile.sourcePosition,
            scale(
              subtract(firstProjectile.targetPosition, firstProjectile.sourcePosition),
              clamp(
                1 - firstProjectile.remainingDistanceUnits / firstProjectile.initialDistanceUnits,
                0,
                1,
              ),
            ),
          );
    return {
      activeScan,
      contact: publicContact,
      ...(effect === undefined
        ? {}
        : {
            effect: {
              kind: effect.kind,
              remainingSeconds: effect.remainingSeconds,
              serial: effect.serial,
              targetPosition: effect.targetPosition,
            },
          }),
      enemy: {
        aiMode: aiState.mode,
        damage: enemyDamage,
        energyProfile: enemyEnergyProfile,
        hullPercent: totalHullIntegrity(ENEMY_DAMAGE_DEFINITION, enemyDamage) * 100,
        orientationDegrees: enemyOrientation,
        position: enemyPosition,
        shieldPercent:
          (totalShieldCharge(enemyDamage) / (ENEMY_DAMAGE_DEFINITION.shieldCapacityPerSector * 4)) *
          100,
      },
      feedback,
      phase,
      playerDamage,
      playerHullPercent: totalHullIntegrity(PLAYER_DAMAGE_DEFINITION, playerDamage) * 100,
      playerShieldPercent:
        (totalShieldCharge(playerDamage) / (PLAYER_DAMAGE_DEFINITION.shieldCapacityPerSector * 4)) *
        100,
      projectileCount: projectiles.length,
      ...(projectilePosition === undefined ? {} : { projectilePosition }),
      ...(selectedContactId === undefined ? {} : { selectedContactId }),
      torpedoAmmo: playerWeaponState.torpedoAmmo,
      tractorActive: tractorSeconds > 0,
      weaponCooldownSeconds: playerWeaponState.cooldownSeconds,
    };
  }

  function result(playerEnergyState: EnergySystemState): EncounterStepResult {
    return { playerEnergyState, snapshot: snapshot() };
  }

  function applyPlayerEquipment(
    equipmentId: EquipmentId,
    context: EncounterStepContext,
  ): EnergySystemState {
    const targetObservation = contact.observedNow ? contact.lastObservation : undefined;
    const distanceUnits = targetObservation?.distanceUnits ?? 0;
    const targetPosition = targetObservation?.position ?? context.playerShip.position;
    const use = tryUseEquipment(EQUIPMENT_DEFINITIONS, playerWeaponState, equipmentId, {
      auxiliaryPowerUnitsPerSecond:
        context.playerEnergyFlow.channels.auxiliary.effectiveUnitsPerSecond,
      capacitorUnits: context.playerEnergyState.weaponCapacitorUnits,
      distanceUnits,
      firingSolution: targetObservation?.firingSolution ?? 0,
      lineOfSight:
        targetObservation !== undefined &&
        hasLineOfSight(context.playerShip.position, targetPosition, lineOfSightObstacles),
      ...(selectedContactId === contact.contactId && targetObservation !== undefined
        ? { selectedTargetAwareness: contact.awareness }
        : {}),
      subsystemIntegrity: playerDamage.subsystems.weapons,
      targetMassRatio: ENEMY_CONTENT.massRatioToPlayer,
      weaponPowerUnitsPerSecond: context.playerEnergyFlow.channels.weapons.effectiveUnitsPerSecond,
    });
    if (!use.success) {
      feedback = FAILURE_MESSAGES[use.reason];
      feedbackHoldSeconds = 0.8;
      return context.playerEnergyState;
    }

    playerWeaponState = use.state;
    const energyState = {
      ...context.playerEnergyState,
      weaponCapacitorUnits: Math.max(
        0,
        context.playerEnergyState.weaponCapacitorUnits - use.outcome.capacitorSpentUnits,
      ),
    };
    if (equipmentId === 'beam') {
      const impact = applyImpact(ENEMY_DAMAGE_DEFINITION, enemyDamage, {
        amount: use.outcome.damageUnits,
        orientationDegrees: enemyOrientation,
        overflowToHull: use.outcome.overflowToHull,
        sourceDirectionWorld: sourceDirection(context.playerShip.position, targetPosition),
      });
      enemyDamage = impact.state;
      feedback = `Feixe atingiu escudo ${impact.shieldSector}; ${impact.appliedToHull.toFixed(0)} de dano no casco.`;
      feedbackHoldSeconds = 0.8;
      setEffect('beam', targetPosition);
    } else if (equipmentId === 'torpedo') {
      projectiles.push({
        damageUnits: use.outcome.damageUnits,
        initialDistanceUnits: distanceUnits,
        overflowToHull: use.outcome.overflowToHull,
        remainingDistanceUnits: distanceUnits,
        sourcePosition: { ...context.playerShip.position },
        speedUnitsPerSecond: use.outcome.projectileSpeedUnitsPerSecond ?? 1,
        targetPosition: { ...targetPosition },
      });
      feedback = 'Torpedo lançado e rastreando o alvo.';
      feedbackHoldSeconds = 0.8;
    } else {
      tractorSeconds = 0.8;
      feedback = 'Raio trator ativo: movimento do alvo reduzido.';
      feedbackHoldSeconds = 0.8;
      setEffect('tractor', targetPosition);
    }
    return energyState;
  }

  function applyCommand(
    command: EncounterCommand,
    context: EncounterStepContext,
  ): EncounterStepResult {
    if (phase !== 'active') {
      feedback = 'O encontro terminou. Use Reiniciar encontro.';
      return result(context.playerEnergyState);
    }
    if (command.type === 'select-next-target') {
      selectedContactId = selectNextContact(selectedContactId, [contact]);
      activeScan = false;
      feedback =
        selectedContactId === undefined
          ? 'Nenhum contato detectado para selecionar.'
          : 'Contato selecionado. Inicie o scan para identificar.';
      return result(context.playerEnergyState);
    }
    if (command.type === 'clear-target') {
      selectedContactId = undefined;
      activeScan = false;
      feedback = 'Seleção de alvo limpa.';
      return result(context.playerEnergyState);
    }
    if (command.type === 'toggle-scan') {
      if (selectedContactId === undefined) {
        feedback = 'Selecione um contato antes de iniciar o scan.';
      } else {
        activeScan = !activeScan;
        feedback = activeScan ? 'Scan ativo em andamento.' : 'Scan ativo interrompido.';
      }
      return result(context.playerEnergyState);
    }
    return result(applyPlayerEquipment(command.equipmentId, context));
  }

  function step(context: EncounterStepContext): EncounterStepResult {
    const deltaSeconds = Math.max(0, context.deltaSeconds);
    feedbackHoldSeconds = Math.max(0, feedbackHoldSeconds - deltaSeconds);
    if (effect !== undefined) {
      effect.remainingSeconds = Math.max(0, effect.remainingSeconds - deltaSeconds);
      if (effect.remainingSeconds === 0) effect = undefined;
    }
    if (phase !== 'active') {
      return result(context.playerEnergyState);
    }

    playerWeaponState = stepWeaponSystemState(playerWeaponState, deltaSeconds);
    enemyWeaponState = stepWeaponSystemState(enemyWeaponState, deltaSeconds);
    tractorSeconds = Math.max(0, tractorSeconds - deltaSeconds);

    let playerEnergyState = syncEnergyIntegrity(context.playerEnergyState, playerDamage);
    playerDamage = stepDamageState(
      PLAYER_DAMAGE_DEFINITION,
      playerDamage,
      deltaSeconds,
      context.playerEnergyEffects.shieldRegenerationUnitsPerSecond,
    );
    playerEnergyState = {
      ...playerEnergyState,
      shieldChargeUnits: totalShieldCharge(playerDamage),
    };

    enemyEnergyState = syncEnergyIntegrity(enemyEnergyState, enemyDamage);
    let enemyEnergyStep = stepEnergySystems(
      PLAYER_ENERGY_DEFINITION,
      enemyEnergyState,
      deltaSeconds,
    );
    enemyEnergyState = enemyEnergyStep.state;
    enemyDamage = stepDamageState(
      ENEMY_DAMAGE_DEFINITION,
      enemyDamage,
      deltaSeconds,
      enemyEnergyStep.effects.shieldRegenerationUnitsPerSecond,
    );
    enemyEnergyState = { ...enemyEnergyState, shieldChargeUnits: totalShieldCharge(enemyDamage) };

    const auxiliaryBalancedPower = PLAYER_ENERGY_DEFINITION.nominalReactorOutputUnitsPerSecond / 4;
    contact = stepSensorContact(SENSOR_DEFINITION, contact, {
      activeScan: activeScan && selectedContactId === contact.contactId,
      deltaSeconds,
      snapshot: sensorSnapshot(
        context.playerShip.position,
        context.playerShip.orientationDegrees,
        enemyPosition,
      ),
      sensorIntegrity: 1,
      sensorPowerMultiplier:
        context.playerEnergyFlow.channels.auxiliary.effectiveUnitsPerSecond /
        auxiliaryBalancedPower,
      sensorRangeUnits: context.playerEnergyEffects.sensorRangeUnits,
    });
    selectedContactId = validateSelectedContact(selectedContactId, [contact]);
    if (selectedContactId === undefined) activeScan = false;

    enemyContact = stepSensorContact(SENSOR_DEFINITION, enemyContact, {
      activeScan: false,
      deltaSeconds,
      snapshot: sensorSnapshot(enemyPosition, enemyOrientation, context.playerShip.position),
      sensorIntegrity: 1,
      sensorPowerMultiplier:
        enemyEnergyStep.flow.channels.auxiliary.effectiveUnitsPerSecond / auxiliaryBalancedPower,
      sensorRangeUnits: enemyEnergyStep.effects.sensorRangeUnits,
    });
    const perceivedPlayer = enemyContact.lastObservation;
    const aiStep = stepEnemyAi(ENEMY_AI_DEFINITION, aiState, {
      deltaSeconds,
      hullFraction: totalHullIntegrity(ENEMY_DAMAGE_DEFINITION, enemyDamage),
      ...(enemyContact.awareness === 'unknown' || perceivedPlayer === undefined
        ? {}
        : {
            perceivedTarget: {
              distanceUnits: perceivedPlayer.distanceUnits,
              firingSolution: perceivedPlayer.firingSolution,
              observedNow: enemyContact.observedNow,
            },
          }),
      shieldFraction:
        totalShieldCharge(enemyDamage) / (ENEMY_DAMAGE_DEFINITION.shieldCapacityPerSector * 4),
    });
    aiState = aiStep.state;
    if (aiStep.action.requestedEnergyPreset !== undefined) {
      enemyEnergyProfile = aiStep.action.requestedEnergyPreset;
      enemyEnergyState = setEnergyAllocation(
        PLAYER_ENERGY_DEFINITION,
        enemyEnergyState,
        ENERGY_PRESETS[enemyEnergyProfile].allocation,
      );
      enemyEnergyStep = stepEnergySystems(PLAYER_ENERGY_DEFINITION, enemyEnergyState, 0);
    }

    if (aiStep.action.turnTowardTarget && perceivedPlayer !== undefined) {
      enemyOrientation = {
        ...enemyOrientation,
        y: approachAngle(
          enemyOrientation.y,
          desiredYaw(enemyPosition, perceivedPlayer.position),
          58 * deltaSeconds,
        ),
      };
    }
    if (perceivedPlayer !== undefined) {
      const towardPlayer = normalize(subtract(perceivedPlayer.position, enemyPosition));
      const movementDirection =
        aiStep.action.movement === 'approach'
          ? towardPlayer
          : aiStep.action.movement === 'retreat'
            ? scale(towardPlayer, -1)
            : { x: 0, y: 0, z: 0 };
      const movementSpeed =
        10 * enemyEnergyStep.effects.enginePerformanceMultiplier * (tractorSeconds > 0 ? 0.18 : 1);
      enemyPosition = add(enemyPosition, scale(movementDirection, movementSpeed * deltaSeconds));
    }

    if (aiStep.action.fireBeam && enemyContact.observedNow && perceivedPlayer !== undefined) {
      const enemyUse = tryUseEquipment(EQUIPMENT_DEFINITIONS, enemyWeaponState, 'beam', {
        auxiliaryPowerUnitsPerSecond:
          enemyEnergyStep.flow.channels.auxiliary.effectiveUnitsPerSecond,
        capacitorUnits: enemyEnergyState.weaponCapacitorUnits,
        distanceUnits: perceivedPlayer.distanceUnits,
        firingSolution: perceivedPlayer.firingSolution,
        lineOfSight: hasLineOfSight(enemyPosition, perceivedPlayer.position, lineOfSightObstacles),
        selectedTargetAwareness: enemyContact.awareness,
        subsystemIntegrity: enemyDamage.subsystems.weapons,
        targetMassRatio: 1 / ENEMY_CONTENT.massRatioToPlayer,
        weaponPowerUnitsPerSecond: enemyEnergyStep.flow.channels.weapons.effectiveUnitsPerSecond,
      });
      if (enemyUse.success) {
        enemyWeaponState = enemyUse.state;
        enemyEnergyState = {
          ...enemyEnergyState,
          weaponCapacitorUnits: Math.max(
            0,
            enemyEnergyState.weaponCapacitorUnits -
              enemyUse.outcome.capacitorSpentUnits * ENEMY_CONTENT.beamCapacitorCostMultiplier,
          ),
        };
        const impact = applyImpact(PLAYER_DAMAGE_DEFINITION, playerDamage, {
          amount: enemyUse.outcome.damageUnits * 0.22,
          orientationDegrees: context.playerShip.orientationDegrees,
          overflowToHull: enemyUse.outcome.overflowToHull,
          sourceDirectionWorld: sourceDirection(enemyPosition, perceivedPlayer.position),
        });
        playerDamage = impact.state;
        playerEnergyState = {
          ...syncEnergyIntegrity(playerEnergyState, playerDamage),
          shieldChargeUnits: totalShieldCharge(playerDamage),
        };
        if (feedbackHoldSeconds === 0) {
          feedback = `Ataque inimigo no escudo ${impact.shieldSector}.`;
        }
        setEffect('enemy-beam', perceivedPlayer.position);
      }
    }

    const remainingProjectiles: TorpedoProjectile[] = [];
    for (const projectile of projectiles) {
      if (contact.observedNow && contact.lastObservation !== undefined) {
        projectile.targetPosition = { ...contact.lastObservation.position };
      }
      projectile.remainingDistanceUnits -= projectile.speedUnitsPerSecond * deltaSeconds;
      if (projectile.remainingDistanceUnits > 0) {
        remainingProjectiles.push(projectile);
        continue;
      }
      if (!contact.observedNow || contact.lastObservation === undefined) {
        feedback = 'Torpedo perdeu o contato antes do impacto.';
        feedbackHoldSeconds = 0.8;
        continue;
      }
      const impact = applyImpact(ENEMY_DAMAGE_DEFINITION, enemyDamage, {
        amount: projectile.damageUnits,
        orientationDegrees: enemyOrientation,
        overflowToHull: projectile.overflowToHull,
        sourceDirectionWorld: sourceDirection(projectile.sourcePosition, projectile.targetPosition),
      });
      enemyDamage = impact.state;
      feedback = `Torpedo impactou escudo ${impact.shieldSector}; ${impact.appliedToHull.toFixed(0)} de dano no casco.`;
      feedbackHoldSeconds = 0.8;
      setEffect('torpedo', projectile.targetPosition);
    }
    projectiles = remainingProjectiles;

    if (enemyDamage.destroyed) {
      phase = 'victory';
      activeScan = false;
      selectedContactId = undefined;
      projectiles = [];
      effect = undefined;
      tractorSeconds = 0;
      feedback = 'Vitória: a interceptadora inimiga foi neutralizada.';
    } else if (playerDamage.destroyed) {
      phase = 'defeat';
      activeScan = false;
      projectiles = [];
      effect = undefined;
      tractorSeconds = 0;
      feedback = 'Derrota: a Exploradora Aurora perdeu integridade estrutural.';
    }
    return result(playerEnergyState);
  }

  return { applyCommand, getSnapshot: snapshot, restart: reset, step };
}
