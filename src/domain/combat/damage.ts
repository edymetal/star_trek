import type { Vector3Value } from '../flight/ship-flight';

export const SHIELD_SECTORS = ['front', 'rear', 'port', 'starboard'] as const;
export const HULL_SECTIONS = ['bow', 'stern', 'port', 'starboard'] as const;
export const SUBSYSTEMS = ['engines', 'weapons', 'shields', 'sensors'] as const;

export type ShieldSectorId = (typeof SHIELD_SECTORS)[number];
export type HullSectionId = (typeof HULL_SECTIONS)[number];
export type SubsystemId = (typeof SUBSYSTEMS)[number];

export type ShieldSectorState = Readonly<Record<ShieldSectorId, number>>;
export type HullSectionState = Readonly<Record<HullSectionId, number>>;
export type SubsystemIntegrity = Readonly<Record<SubsystemId, number>>;

export interface DamageDefinition {
  readonly hullCapacityPerSection: number;
  readonly shieldCapacityPerSector: number;
  readonly shieldRegenerationDelaySeconds: number;
}

export interface DamageState {
  readonly destroyed: boolean;
  readonly hull: HullSectionState;
  readonly secondsSinceShieldImpact: number;
  readonly shields: ShieldSectorState;
  readonly subsystems: SubsystemIntegrity;
}

export interface ImpactContext {
  readonly amount: number;
  readonly orientationDegrees: Vector3Value;
  readonly overflowToHull: boolean;
  readonly sourceDirectionWorld: Vector3Value;
}

export interface ImpactResult {
  readonly absorbedByShield: number;
  readonly appliedToHull: number;
  readonly hullSection: HullSectionId;
  readonly overflowDamage: number;
  readonly shieldSector: ShieldSectorId;
  readonly state: DamageState;
}

const DEGREES_TO_RADIANS = Math.PI / 180;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function assertDefinition(definition: DamageDefinition): void {
  if (
    !(definition.hullCapacityPerSection > 0) ||
    !(definition.shieldCapacityPerSector > 0) ||
    !(definition.shieldRegenerationDelaySeconds >= 0)
  ) {
    throw new Error('Definição de dano inválida.');
  }
}

function sectionForSector(sector: ShieldSectorId): HullSectionId {
  return sector === 'front' ? 'bow' : sector === 'rear' ? 'stern' : sector;
}

function subsystemForSection(section: HullSectionId): SubsystemId {
  return section === 'bow'
    ? 'sensors'
    : section === 'stern'
      ? 'engines'
      : section === 'port'
        ? 'shields'
        : 'weapons';
}

export function createInitialDamageState(definition: DamageDefinition): DamageState {
  assertDefinition(definition);
  return {
    destroyed: false,
    hull: {
      bow: definition.hullCapacityPerSection,
      port: definition.hullCapacityPerSection,
      starboard: definition.hullCapacityPerSection,
      stern: definition.hullCapacityPerSection,
    },
    secondsSinceShieldImpact: definition.shieldRegenerationDelaySeconds,
    shields: {
      front: definition.shieldCapacityPerSector,
      port: definition.shieldCapacityPerSector,
      rear: definition.shieldCapacityPerSector,
      starboard: definition.shieldCapacityPerSector,
    },
    subsystems: { engines: 1, sensors: 1, shields: 1, weapons: 1 },
  };
}

export function resolveShieldSector(
  orientationDegrees: Vector3Value,
  sourceDirectionWorld: Vector3Value,
): ShieldSectorId {
  const yaw = finiteOrZero(orientationDegrees.y) * DEGREES_TO_RADIANS;
  const sourceLength = Math.hypot(
    sourceDirectionWorld.x,
    sourceDirectionWorld.y,
    sourceDirectionWorld.z,
  );
  if (sourceLength <= Number.EPSILON) {
    return 'front';
  }
  const sourceX = sourceDirectionWorld.x / sourceLength;
  const sourceZ = sourceDirectionWorld.z / sourceLength;
  const forwardDot = sourceX * -Math.sin(yaw) + sourceZ * -Math.cos(yaw);
  const rightDot = sourceX * Math.cos(yaw) + sourceZ * -Math.sin(yaw);
  if (Math.abs(forwardDot) >= Math.abs(rightDot)) {
    return forwardDot >= 0 ? 'front' : 'rear';
  }
  return rightDot >= 0 ? 'starboard' : 'port';
}

export function applyImpact(
  definition: DamageDefinition,
  state: DamageState,
  context: ImpactContext,
): ImpactResult {
  assertDefinition(definition);
  const damage = Math.max(0, finiteOrZero(context.amount));
  const shieldSector = resolveShieldSector(
    context.orientationDegrees,
    context.sourceDirectionWorld,
  );
  const hullSection = sectionForSector(shieldSector);
  const shieldCharge = state.shields[shieldSector];
  const absorbedByShield = Math.min(shieldCharge, damage);
  const overflowDamage = Math.max(0, damage - absorbedByShield);
  const requestedHullDamage = context.overflowToHull ? overflowDamage : 0;
  const subsystems: Record<SubsystemId, number> = { ...state.subsystems };
  const hull: Record<HullSectionId, number> = { ...state.hull };
  let remainingHullDamage = requestedHullDamage;
  const sectionOrder = [hullSection, ...HULL_SECTIONS.filter((section) => section !== hullSection)];
  for (const section of sectionOrder) {
    if (remainingHullDamage <= 0) break;
    const applied = Math.min(hull[section], remainingHullDamage);
    hull[section] -= applied;
    remainingHullDamage -= applied;
    const subsystem = subsystemForSection(section);
    const sectionIntegrity = hull[section] / definition.hullCapacityPerSection;
    subsystems[subsystem] = Math.min(subsystems[subsystem], clamp(sectionIntegrity, 0, 1));
  }
  const appliedToHull = requestedHullDamage - remainingHullDamage;
  const shields: Record<ShieldSectorId, number> = {
    ...state.shields,
    [shieldSector]: shieldCharge - absorbedByShield,
  };

  return {
    absorbedByShield,
    appliedToHull,
    hullSection,
    overflowDamage,
    shieldSector,
    state: {
      destroyed: HULL_SECTIONS.every((section) => hull[section] <= 0),
      hull,
      secondsSinceShieldImpact: damage > 0 ? 0 : state.secondsSinceShieldImpact,
      shields,
      subsystems,
    },
  };
}

export function stepDamageState(
  definition: DamageDefinition,
  state: DamageState,
  deltaSeconds: number,
  shieldRegenerationUnitsPerSecond: number,
): DamageState {
  assertDefinition(definition);
  const safeDelta = Math.max(0, finiteOrZero(deltaSeconds));
  const secondsSinceShieldImpact = state.secondsSinceShieldImpact + safeDelta;
  if (
    state.destroyed ||
    secondsSinceShieldImpact + Number.EPSILON < definition.shieldRegenerationDelaySeconds
  ) {
    return { ...state, secondsSinceShieldImpact };
  }
  let availableRegeneration =
    Math.max(0, finiteOrZero(shieldRegenerationUnitsPerSecond)) * safeDelta;
  const shields: Record<ShieldSectorId, number> = { ...state.shields };
  const depleted = SHIELD_SECTORS.filter(
    (sector) => shields[sector] < definition.shieldCapacityPerSector,
  );
  while (availableRegeneration > Number.EPSILON && depleted.length > 0) {
    const share = availableRegeneration / depleted.length;
    let applied = 0;
    for (const sector of depleted) {
      const restored = Math.min(share, definition.shieldCapacityPerSector - shields[sector]);
      shields[sector] += restored;
      applied += restored;
    }
    availableRegeneration -= applied;
    for (let index = depleted.length - 1; index >= 0; index -= 1) {
      const sector = depleted[index];
      if (
        sector === undefined ||
        shields[sector] + Number.EPSILON >= definition.shieldCapacityPerSector
      ) {
        depleted.splice(index, 1);
      }
    }
    if (applied <= Number.EPSILON) {
      break;
    }
  }
  return { ...state, secondsSinceShieldImpact, shields };
}

export function totalShieldCharge(state: DamageState): number {
  return SHIELD_SECTORS.reduce((total, sector) => total + state.shields[sector], 0);
}

export function totalHullIntegrity(definition: DamageDefinition, state: DamageState): number {
  return (
    HULL_SECTIONS.reduce((total, section) => total + state.hull[section], 0) /
    (definition.hullCapacityPerSection * HULL_SECTIONS.length)
  );
}
