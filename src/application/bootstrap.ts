import { getGraphicsPreset } from '../content/graphics-presets';
import { PLAYER_SHIP_DEFINITION, TRAINING_ARENA } from '../content/arena-content';
import { ENERGY_PRESETS, PLAYER_ENERGY_DEFINITION } from '../content/energy-content';
import { PLAYER_DAMAGE_DEFINITION } from '../content/combat-content';
import { createInitialEnergyState, type EnergyAllocation } from '../domain/energy/energy-system';
import { createInitialShipState } from '../domain/flight/ship-flight';
import { evaluateGraphicsReadiness } from '../domain/graphics-readiness';
import type { ArenaScene, EngineTelemetry } from '../engine/create-arena-scene';
import { createFlightInputController } from '../platform/flight-input';
import { inspectWebGl2Capability } from '../platform/graphics-diagnostics';
import type {
  AppShell,
  CombatHudTelemetry,
  CompatibilityNotice,
  EnergyHudTelemetry,
  FlightHudTelemetry,
} from '../ui/app-shell';
import { createFlightSession } from './flight-session';
import { createEncounterSession } from './encounter-session';
import {
  combinePresentationEffects,
  createPresentationEffectRetainer,
  didPlayerEquipmentActivate,
  type PlayerEffectResultView,
  type PlayerPresentationEquipmentId,
} from './presentation-effect-retainer';
import { selectInitialPreset } from './select-initial-preset';
import { createThrottledPublisher } from './throttled-publisher';

const WEBGL_UNAVAILABLE_NOTICE: CompatibilityNotice = {
  actions: [
    'Ative a aceleração gráfica nas configurações do Chrome ou Edge.',
    'Atualize o navegador e os drivers de vídeo Intel/NVIDIA.',
    'Feche todas as janelas do navegador e abra-o novamente.',
    'Consulte chrome://gpu ou edge://gpu e confirme que WebGL 2 está acelerado.',
  ],
  message: 'Este navegador não disponibilizou WebGL 2, requisito mínimo do protótipo.',
  title: 'WebGL 2 indisponível',
};

const SOFTWARE_RENDERER_NOTICE: CompatibilityNotice = {
  actions: [
    'No Windows, configure o navegador para usar a opção de GPU de alto desempenho.',
    'Confirme no Gerenciador de Tarefas se a NVIDIA GeForce MX130 está em uso.',
    'Consulte chrome://gpu ou edge://gpu para verificar o renderizador ativo.',
  ],
  message:
    'A renderização está sendo feita por software. A cena foi aberta, mas o desempenho será limitado.',
  title: 'Aceleração gráfica não confirmada',
};

const RENDERER_UNCONFIRMED_NOTICE: CompatibilityNotice = {
  actions: [
    'Consulte chrome://gpu ou edge://gpu para identificar a GPU e confirmar WebGL 2 acelerado.',
    'Mantenha a aceleração gráfica ativada nas configurações do navegador.',
    'Use o Gerenciador de Tarefas do Windows para conferir qual GPU atende o navegador.',
  ],
  message:
    'WebGL 2 está disponível, mas o navegador não expôs um nome confiável para a GPU. Isso não significa renderização por software.',
  title: 'Renderizador não confirmado',
};

function describeUnknownError(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'Falha sem detalhe técnico disponível.';
}

interface PublishedHudTelemetry {
  readonly combat: CombatHudTelemetry;
  readonly energy: EnergyHudTelemetry;
  readonly flight: FlightHudTelemetry;
}

export async function bootstrapApplication(shell: AppShell): Promise<ArenaScene | undefined> {
  let disposeFailedBootstrap: (() => void) | undefined;
  const capability = inspectWebGl2Capability();
  const readiness = evaluateGraphicsReadiness(capability);
  shell.setGraphicsCapability(capability);
  shell.setBackend(capability.webGl2Available ? 'WebGL 2 · detectado' : 'Indisponível');

  if (readiness.status === 'blocked') {
    shell.showBlocked(WEBGL_UNAVAILABLE_NOTICE);
    return undefined;
  }

  const preset = getGraphicsPreset(selectInitialPreset(capability));
  shell.setPreset(preset);

  if (readiness.reason === 'software-renderer') {
    shell.showWarning(SOFTWARE_RENDERER_NOTICE);
  } else if (readiness.reason === 'renderer-unconfirmed') {
    shell.showWarning(RENDERER_UNCONFIRMED_NOTICE);
  }

  try {
    const flightSession = createFlightSession({
      arenaRadiusUnits: TRAINING_ARENA.radiusUnits,
      definition: PLAYER_SHIP_DEFINITION,
      energyDefinition: PLAYER_ENERGY_DEFINITION,
      encounter: createEncounterSession({
        enemyInitialPosition: TRAINING_ARENA.enemyPosition,
        playerInitialShieldChargeUnits: 70,
      }),
      initialEnergyState: createInitialEnergyState(PLAYER_ENERGY_DEFINITION),
      initialState: createInitialShipState({ x: 0, y: 0, z: 16 }),
    });
    const presentationEffectRetainer = createPresentationEffectRetainer();
    let pendingPresentationEffect:
      | {
          readonly before: PlayerEffectResultView;
          readonly equipmentId: PlayerPresentationEquipmentId;
          readonly targetPosition: { readonly x: number; readonly y: number; readonly z: number };
        }
      | undefined;
    let presentationEffectSerial = 0;
    const requestPlayerEffect = (equipmentId: PlayerPresentationEquipmentId): void => {
      const before = flightSession.getSnapshot().encounter;
      const publicObservation = before.contact.lastObservation;
      flightSession.useEquipment(equipmentId);
      pendingPresentationEffect =
        before.contact.observedNow && publicObservation !== undefined
          ? {
              before: {
                enemyHullPercent: before.enemy.hullPercent,
                enemyShieldPercent: before.enemy.shieldPercent,
                torpedoAmmo: before.torpedoAmmo,
                tractorActive: before.tractorActive,
              },
              equipmentId,
              targetPosition: { ...publicObservation.position },
            }
          : undefined;
    };
    let engineTelemetry: EngineTelemetry = {
      activeVfxCount: 0,
      drawCalls: 0,
      frameTimeMs: 0,
      instancedObjects: TRAINING_ARENA.asteroidCount,
      lodLabel: 'Atualizando…',
    };
    const hudPublisher = createThrottledPublisher<PublishedHudTelemetry>(1 / 8, (telemetry) => {
      shell.setCombatTelemetry(telemetry.combat);
      shell.setFlightTelemetry(telemetry.flight);
      shell.setEnergyTelemetry(telemetry.energy);
    });
    const createHudTelemetry = (snapshot = flightSession.getSnapshot()): PublishedHudTelemetry => {
      const { effects, flow, profileId, state } = snapshot.energy;
      const { contact, enemy, playerDamage } = snapshot.encounter;
      const baseContactLabel =
        contact.awareness === 'unknown'
          ? 'Nenhum contato'
          : contact.awareness === 'identified'
            ? (contact.displayName ?? 'Contato identificado')
            : 'Contato desconhecido';
      const contactLabel =
        contact.awareness !== 'unknown' && !contact.observedNow
          ? `${baseContactLabel} · última observação ${contact.memoryAgeSeconds?.toFixed(1) ?? '0.0'}s`
          : baseContactLabel;
      const channelEffectivePower: EnergyAllocation = {
        auxiliary: flow.channels.auxiliary.effectiveUnitsPerSecond,
        engines: flow.channels.engines.effectiveUnitsPerSecond,
        shields: flow.channels.shields.effectiveUnitsPerSecond,
        weapons: flow.channels.weapons.effectiveUnitsPerSecond,
      };
      return {
        combat: {
          activeScan: snapshot.encounter.activeScan,
          awareness: contact.awareness,
          contactLabel,
          ...(contact.distanceUnits === undefined ? {} : { distanceUnits: contact.distanceUnits }),
          ...(contact.awareness === 'identified'
            ? {
                enemyAiMode: enemy.aiMode,
                enemyHullPercent: enemy.hullPercent,
                enemyShieldPercent: enemy.shieldPercent,
              }
            : {}),
          feedback: snapshot.encounter.feedback,
          observedNow: contact.observedNow,
          phase: snapshot.encounter.phase,
          playerShieldSectorsPercent: {
            front:
              (playerDamage.shields.front / PLAYER_DAMAGE_DEFINITION.shieldCapacityPerSector) * 100,
            port:
              (playerDamage.shields.port / PLAYER_DAMAGE_DEFINITION.shieldCapacityPerSector) * 100,
            rear:
              (playerDamage.shields.rear / PLAYER_DAMAGE_DEFINITION.shieldCapacityPerSector) * 100,
            starboard:
              (playerDamage.shields.starboard / PLAYER_DAMAGE_DEFINITION.shieldCapacityPerSector) *
              100,
          },
          playerSubsystems: playerDamage.subsystems,
          projectileCount: snapshot.encounter.projectileCount,
          scanProgress: contact.scanProgress,
          selected: snapshot.encounter.selectedContactId === contact.contactId,
          torpedoAmmo: snapshot.encounter.torpedoAmmo,
          tractorActive: snapshot.encounter.tractorActive,
          weaponCooldownSeconds: snapshot.encounter.weaponCooldownSeconds,
        },
        energy: {
          allocation: state.allocation,
          allocationCapacityUnits: PLAYER_ENERGY_DEFINITION.allocationCapacityUnits,
          channelEffectivePower,
          deliveredUnitsPerSecond: flow.deliveredUnitsPerSecond,
          profileId,
          reactorGeneratedUnitsPerSecond: flow.reactorGeneratedUnitsPerSecond,
          reservePercent:
            (state.reserveUnits / PLAYER_ENERGY_DEFINITION.reserveCapacityUnits) * 100,
        },
        flight: {
          boundaryDistanceUnits: snapshot.boundaryDistanceUnits,
          ...engineTelemetry,
          enginePerformanceMultiplier: effects.enginePerformanceMultiplier,
          hullPercent: snapshot.encounter.playerHullPercent,
          pauseReason: snapshot.pauseReason,
          paused: snapshot.paused,
          position: snapshot.ship.position,
          sensorRangeUnits: effects.sensorRangeUnits,
          shieldPercent: snapshot.encounter.playerShieldPercent,
          shieldRegenerationUnitsPerSecond: effects.shieldRegenerationUnitsPerSecond,
          speedUnitsPerSecond: snapshot.speedUnitsPerSecond,
          targetLabel:
            snapshot.encounter.selectedContactId === undefined
              ? contactLabel
              : `${contactLabel} · selecionado`,
          weaponCapacitorPercent:
            (state.weaponCapacitorUnits / PLAYER_ENERGY_DEFINITION.weaponCapacitorCapacityUnits) *
            100,
          weaponHeatPercent: state.weaponHeatUnits,
          weaponRechargeUnitsPerSecond: effects.weaponRechargeUnitsPerSecond,
        },
      };
    };
    const refreshHud = (): void => {
      hudPublisher.publishNow(createHudTelemetry());
    };
    const input = createFlightInputController({
      canvas: shell.canvas,
      fullscreenTarget: shell.fullscreenTarget,
      onControlFeedback: (message) => shell.setControlFeedback(message),
      onFocusLost() {
        flightSession.pause('focus-lost');
        refreshHud();
      },
      onFullscreenChange(active) {
        shell.setFullscreenActive(active);
        shell.setControlFeedback(active ? 'Tela cheia ativada.' : 'Tela cheia desativada.');
      },
      onPauseToggle() {
        flightSession.toggleManualPause();
        refreshHud();
      },
      onTacticalAction(action) {
        if (action === 'select-target') flightSession.selectNextTarget();
        else if (action === 'clear-target') flightSession.clearTarget();
        else if (action === 'toggle-scan') flightSession.toggleActiveScan();
        else if (action === 'restart-encounter') {
          flightSession.restartEncounter();
          presentationEffectRetainer.clear();
          pendingPresentationEffect = undefined;
          refreshHud();
        } else requestPlayerEffect(action);
      },
      onPointerCaptureChange(active) {
        shell.setPointerCaptured(active);
        shell.setControlFeedback(
          active ? 'Mouse capturado. Pressione Esc para liberar.' : 'Mouse liberado.',
        );
      },
    });
    const unbindControls = shell.bindFlightControls({
      onFullscreen: () => void input.toggleFullscreen(),
      onPause() {
        input.releaseControls();
        flightSession.toggleManualPause();
        refreshHud();
      },
      onPointerCapture: () => void input.requestPointerCapture(),
    });
    const unbindEnergyControls = shell.bindEnergyControls({
      onAdjust(channel, deltaUnits) {
        flightSession.adjustEnergy(channel, deltaUnits);
        refreshHud();
      },
      onPreset(presetId) {
        flightSession.setEnergyProfile(presetId, ENERGY_PRESETS[presetId].allocation);
        refreshHud();
      },
    });
    const unbindCombatControls = shell.bindCombatControls({
      onClearTarget: () => flightSession.clearTarget(),
      onRestartEncounter() {
        flightSession.restartEncounter();
        presentationEffectRetainer.clear();
        pendingPresentationEffect = undefined;
        refreshHud();
      },
      onSelectTarget: () => flightSession.selectNextTarget(),
      onToggleScan: () => flightSession.toggleActiveScan(),
      onUseBeam: () => requestPlayerEffect('beam'),
      onUseTorpedo: () => requestPlayerEffect('torpedo'),
      onUseTractor: () => requestPlayerEffect('tractor'),
    });
    disposeFailedBootstrap = () => {
      unbindCombatControls();
      unbindEnergyControls();
      unbindControls();
      input.dispose();
    };
    const { createArenaScene } = await import('../engine/create-arena-scene');
    const engineScene = await createArenaScene(shell.canvas, preset, {
      onFpsSample: (fps) => shell.setFps(fps),
      onPresentationFrame: (presentation) => shell.setArenaPresentation(presentation),
      onUpdate(deltaSeconds, getTelemetry) {
        const snapshot = flightSession.advance(deltaSeconds, input);
        if (pendingPresentationEffect !== undefined && snapshot.simulationSteps > 0) {
          const { encounter } = snapshot;
          const after: PlayerEffectResultView = {
            enemyHullPercent: encounter.enemy.hullPercent,
            enemyShieldPercent: encounter.enemy.shieldPercent,
            torpedoAmmo: encounter.torpedoAmmo,
            tractorActive: encounter.tractorActive,
          };
          if (
            didPlayerEquipmentActivate(
              pendingPresentationEffect.equipmentId,
              pendingPresentationEffect.before,
              after,
            )
          ) {
            presentationEffectSerial += 1;
            presentationEffectRetainer.capture(pendingPresentationEffect.equipmentId, {
              kind: pendingPresentationEffect.equipmentId,
              remainingSeconds: 0,
              serial: -presentationEffectSerial,
              targetPosition: pendingPresentationEffect.targetPosition,
            });
          }
          pendingPresentationEffect = undefined;
        }
        hudPublisher.publishIfDue(deltaSeconds, () => {
          engineTelemetry = getTelemetry();
          return createHudTelemetry(snapshot);
        });
        const retainedPlayerEffects = presentationEffectRetainer.step(
          deltaSeconds,
          snapshot.paused,
          snapshot.encounter.phase,
        );
        const authoritativeEffect = snapshot.encounter.effect;
        const presentationEffects = combinePresentationEffects(
          authoritativeEffect,
          retainedPlayerEffects,
        );
        if (presentationEffects.length === 0) return snapshot;
        return {
          ...snapshot,
          presentationEffects,
        };
      },
    });
    const scene: ArenaScene = {
      backendLabel: engineScene.backendLabel,
      dispose() {
        disposeFailedBootstrap?.();
        disposeFailedBootstrap = undefined;
        engineScene.dispose();
      },
    };
    shell.setBackend(scene.backendLabel);
    shell.setPointerCaptured(input.isPointerCaptured());
    shell.setFullscreenActive(false);
    refreshHud();
    shell.showReady(readiness);
    return scene;
  } catch (cause: unknown) {
    disposeFailedBootstrap?.();
    disposeFailedBootstrap = undefined;
    shell.showBlocked({
      actions: [
        'Recarregue a página depois de fechar outras abas 3D.',
        'Confirme a aceleração gráfica em chrome://gpu ou edge://gpu.',
        'Atualize o navegador e o driver da GPU antes de tentar novamente.',
      ],
      detail: describeUnknownError(cause),
      message: 'WebGL 2 foi detectado, mas o motor 3D não conseguiu concluir a inicialização.',
      title: 'Falha ao iniciar a cena 3D',
    });
    return undefined;
  }
}
