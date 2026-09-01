import { getGraphicsPreset } from '../content/graphics-presets';
import { PLAYER_SHIP_DEFINITION, TRAINING_ARENA } from '../content/arena-content';
import { ENERGY_PRESETS, PLAYER_ENERGY_DEFINITION } from '../content/energy-content';
import { PLAYER_DAMAGE_DEFINITION } from '../content/combat-content';
import {
  FIRST_TUTORIAL_MISSION,
  getTutorialMissionContent,
  INITIAL_TUTORIAL_MISSIONS,
} from '../content/mission-content';
import { getTrainingSystemNode, TRAINING_SYSTEM } from '../content/system-content';
import { resolveShieldSector, type ShieldSectorId } from '../domain/combat/damage';
import { createInitialEnergyState, type EnergyAllocation } from '../domain/energy/energy-system';
import { createInitialShipState } from '../domain/flight/ship-flight';
import { evaluateGraphicsReadiness } from '../domain/graphics-readiness';
import { createMissionJournal } from '../domain/missions/mission-journal';
import {
  createTutorialCampaign,
  type TutorialCampaignSnapshot,
  type TutorialObjectiveEvent,
} from '../domain/missions/tutorial-campaign';
import {
  createSystemNavigation,
  type NavigationCommandResult,
  type SystemNavigationSnapshot,
} from '../domain/navigation/system-navigation';
import type {
  ArenaPresentationPreferences,
  ArenaScene,
  EngineTelemetry,
} from '../engine/create-arena-scene';
import { createFlightInputController, type FlightInputPreferences } from '../platform/flight-input';
import { inspectWebGl2Capability } from '../platform/graphics-diagnostics';
import { createIndexedDbSaveRepository } from '../platform/indexeddb-save-repository';
import { createLocalStorageSettingsRepository } from '../platform/local-storage-settings-repository';
import type {
  AppShell,
  BaseHudTelemetry,
  CombatHudTelemetry,
  CompatibilityNotice,
  EnergyHudTelemetry,
  FlightHudTelemetry,
  MainMenuHudTelemetry,
  MissionHudTelemetry,
  MissionJournalHudTelemetry,
  NavigationHudTelemetry,
  SaveHudTelemetry,
  SettingsHudTelemetry,
} from '../ui/app-shell';
import { createFlightSession, type FlightSessionSnapshot } from './flight-session';
import { createEncounterSession } from './encounter-session';
import {
  combinePresentationEffects,
  createPresentationEffectRetainer,
  didPlayerEquipmentActivate,
  type PlayerEffectResultView,
  type PlayerPresentationEquipmentId,
} from './presentation-effect-retainer';
import { selectInitialPreset } from './select-initial-preset';
import { createGameSavePayload, type GameSavePayload } from './game-save';
import { createSaveController, type SaveControllerStatus } from './save-controller';
import { createDefaultGameSettings, formatControlHints, type GameSettings } from './game-settings';
import { createSettingsController, type SettingsControllerResult } from './settings-controller';
import { createSessionMenu, type SessionMenuSnapshot } from './session-menu';
import { createThrottledPublisher } from './throttled-publisher';
import { parseStartupOptions } from './startup-options';

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
    'Mantenha a aceleração gráfica ativada nas configurações do navegador.',
    'Atualize o navegador e o driver gráfico disponível no sistema.',
    'Consulte chrome://gpu ou edge://gpu e confirme que WebGL 2 usa aceleração por hardware.',
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

function toFlightInputPreferences(settings: GameSettings): FlightInputPreferences {
  return {
    controlBindings: settings.controlBindings,
    invertVerticalLook: settings.invertVerticalLook,
    mouseSensitivity: settings.mouseSensitivity,
  };
}

function toArenaPresentationPreferences(settings: GameSettings): ArenaPresentationPreferences {
  return {
    particleDensity: settings.particleDensity,
    reduceCameraShake: settings.reduceCameraShake,
    reduceFlashes: settings.reduceFlashes,
  };
}

interface PublishedHudTelemetry {
  readonly base: BaseHudTelemetry;
  readonly combat: CombatHudTelemetry;
  readonly energy: EnergyHudTelemetry;
  readonly flight: FlightHudTelemetry;
  readonly journal: MissionJournalHudTelemetry;
  readonly mission: MissionHudTelemetry;
}

function createBaseHudTelemetry(
  mission: TutorialCampaignSnapshot,
  snapshot: FlightSessionSnapshot,
  visible: boolean,
): BaseHudTelemetry {
  const currentIndex = mission.missionNumber - 1;
  const currentContent = getTutorialMissionContent(mission.missionId);
  const campaignFinished = mission.campaignCompleted;
  const nextContent =
    mission.phase === 'completed' && !campaignFinished
      ? INITIAL_TUTORIAL_MISSIONS[currentIndex + 1]
      : currentContent;
  const energyTotal = Object.values(snapshot.energy.state.allocation).reduce(
    (total, value) => total + value,
    0,
  );
  return {
    energyLabel: `${energyTotal.toFixed(0)} / ${PLAYER_ENERGY_DEFINITION.allocationCapacityUnits.toFixed(0)} · reserva ${(snapshot.energy.state.reserveUnits / PLAYER_ENERGY_DEFINITION.reserveCapacityUnits) * 100}%`,
    integrityLabel: `Casco ${snapshot.encounter.playerHullPercent.toFixed(0)}% · sistemas íntegros`,
    missions: INITIAL_TUTORIAL_MISSIONS.map((content, index) => ({
      id: content.id,
      status:
        campaignFinished ||
        index < currentIndex ||
        (index === currentIndex && mission.phase === 'completed')
          ? 'completed'
          : index === currentIndex
            ? 'current'
            : 'locked',
      title: content.title,
    })),
    nextMissionTitle: campaignFinished
      ? 'Treinamento inicial concluído'
      : (nextContent?.title ?? currentContent.title),
    nextObjective: campaignFinished
      ? 'As três missões foram concluídas. Reinicie quando desejar repetir a certificação.'
      : (nextContent?.briefing ?? currentContent.briefing),
    prepareLabel: campaignFinished
      ? 'Reiniciar treinamento pelo mapa'
      : mission.phase === 'completed'
        ? `Preparar missão ${mission.missionNumber + 1}`
        : 'Abrir mapa e preparar partida',
    serviceLabel: 'Reparo e suprimentos concluídos',
    torpedoLabel: `${snapshot.encounter.torpedoAmmo} / 6 disponíveis`,
    visible,
  };
}

function createMissionHudTelemetry(
  snapshot: TutorialCampaignSnapshot,
  settings: GameSettings,
): MissionHudTelemetry {
  const mission = getTutorialMissionContent(snapshot.missionId);
  const withControlHints = (value: string): string =>
    formatControlHints(value, settings.controlBindings);
  const shared = {
    campaignCompleted: snapshot.campaignCompleted,
    missionCount: snapshot.missionCount,
    missionId: snapshot.missionId,
    missionNumber: snapshot.missionNumber,
    objectiveCompleted: snapshot.objectiveCompleted,
    phase: snapshot.phase,
    title: mission.title,
    transitionProgress: snapshot.transitionProgress,
  } as const;
  switch (snapshot.phase) {
    case 'briefing':
      return {
        ...shared,
        actionEnabled: true,
        actionLabel: 'Abrir mapa do sistema',
        objective: withControlHints(mission.briefing),
        phaseLabel: `${snapshot.missionNumber}/${snapshot.missionCount} · Na base`,
      };
    case 'outbound':
      return {
        ...shared,
        actionEnabled: false,
        actionLabel: `Em trânsito · ${(snapshot.transitionProgress * 100).toFixed(0)}%`,
        objective: withControlHints(mission.outboundObjective),
        phaseLabel: `${snapshot.missionNumber}/${snapshot.missionCount} · Partida`,
      };
    case 'objective':
      return {
        ...shared,
        actionEnabled: snapshot.objectiveCompleted,
        actionLabel: snapshot.objectiveCompleted ? 'Retornar à base' : 'Conclua o objetivo',
        objective: withControlHints(
          snapshot.objectiveCompleted
            ? mission.objectiveCompleteText
            : mission.objectiveInstruction,
        ),
        phaseLabel: `${snapshot.missionNumber}/${snapshot.missionCount} · ${mission.objectiveLabel}`,
      };
    case 'returning':
      return {
        ...shared,
        actionEnabled: false,
        actionLabel: `Retornando · ${(snapshot.transitionProgress * 100).toFixed(0)}%`,
        objective: withControlHints(mission.returningObjective),
        phaseLabel: `${snapshot.missionNumber}/${snapshot.missionCount} · Retorno`,
      };
    case 'completed':
      return {
        ...shared,
        actionEnabled: true,
        actionLabel: snapshot.campaignCompleted
          ? 'Reiniciar treinamento pelo mapa'
          : `Preparar missão ${snapshot.missionNumber + 1}`,
        objective: withControlHints(mission.completedObjective),
        phaseLabel: `${snapshot.missionNumber}/${snapshot.missionCount} · Concluída`,
      };
  }
}

function navigationFailureMessage(result: NavigationCommandResult): string | undefined {
  if (result.accepted) return undefined;
  const messages = {
    'destination-required': 'Selecione um destino conectado antes de iniciar a viagem.',
    'invalid-state': 'Este comando de navegação não está disponível no estado atual.',
    'route-unavailable': 'Não existe uma rota segura entre estes pontos. Selecione outro destino.',
    'unknown-destination': 'O destino selecionado não existe no conteúdo carregado.',
  } as const;
  return messages[result.reason];
}

function createNavigationHudTelemetry(
  navigation: SystemNavigationSnapshot,
  mission: TutorialCampaignSnapshot,
): NavigationHudTelemetry {
  const missionContent = getTutorialMissionContent(mission.missionId);
  const currentNode = getTrainingSystemNode(navigation.currentNodeId);
  const route = navigation.activeRoute ?? navigation.selectedRoute;
  const destinationNode =
    route === undefined ? undefined : getTrainingSystemNode(route.destinationNodeId);
  const originNode = route === undefined ? undefined : getTrainingSystemNode(route.originNodeId);
  const correctDestination =
    navigation.selectedRoute?.destinationNodeId === missionContent.destinationNodeId;
  const routeLabel =
    route === undefined || destinationNode === undefined || originNode === undefined
      ? `${currentNode.label} · nenhuma rota ativa`
      : `${originNode.label} → ${destinationNode.label}`;
  const routeDetail =
    route === undefined
      ? 'Abra o mapa e escolha o destino indicado pelo objetivo atual.'
      : `${route.distanceUnits.toFixed(0)} unidades setoriais · ${route.durationSeconds.toFixed(1)} s de transição configurada`;
  const guidance =
    navigation.mode === 'map'
      ? navigation.selectedRoute === undefined
        ? `Selecione ${getTrainingSystemNode(missionContent.destinationNodeId).label}, marcado como destino da missão.`
        : correctDestination
          ? 'Rota validada. Confirme para desacoplar da base e iniciar a viagem.'
          : 'Este ponto pode ser consultado, mas não é o destino da missão atual.'
      : navigation.mode === 'travel'
        ? 'Controles de voo e combate permanecem bloqueados durante a transição.'
        : navigation.mode === 'encounter'
          ? 'Bolha tática ativa. O retorno usará a rota segura de origem.'
          : 'Base segura: nave reparada, energia restaurada e torpedos reabastecidos.';
  return {
    canConfirmTravel: navigation.mode === 'map' && correctDestination,
    currentLocationLabel: currentNode.label,
    guidance,
    mapNodes: TRAINING_SYSTEM.nodes.map((node) => ({
      id: node.id,
      isCurrentLocation: node.id === navigation.currentNodeId,
      isMissionDestination: node.id === missionContent.destinationNodeId,
      isSelected: node.id === navigation.selectedRoute?.destinationNodeId,
      kind: node.kind,
      label: node.label,
      summary: node.summary,
    })),
    mode: navigation.mode,
    routeDetail,
    routeLabel,
    systemLabel: TRAINING_SYSTEM.label,
    travelProgress: navigation.mode === 'travel' ? mission.transitionProgress : 0,
  };
}

function toSaveHudTelemetry(status: SaveControllerStatus): SaveHudTelemetry {
  return { ...(status.detail === undefined ? {} : { detail: status.detail }), state: status.state };
}

function createMainMenuHudTelemetry(
  menu: SessionMenuSnapshot,
  save: SaveHudTelemetry,
  mission: TutorialCampaignSnapshot,
): MainMenuHudTelemetry {
  const content = getTutorialMissionContent(mission.missionId);
  const saveReady = save.state === 'loaded' || save.state === 'migrated' || save.state === 'saved';
  const saveUnavailable = save.state === 'error' || save.state === 'invalid';
  return {
    canClose: menu.canClose,
    canContinue: menu.canClose || saveReady,
    progressLabel: saveUnavailable
      ? 'Continuar indisponível'
      : save.state === 'created'
        ? 'Novo treinamento pronto'
        : `${content.title} · missão ${mission.missionNumber} de ${mission.missionCount}`,
    saveDetail: saveUnavailable
      ? save.state === 'invalid'
        ? 'O registro inválido foi preservado. Iniciar um novo treinamento exige confirmação explícita.'
        : 'O armazenamento não respondeu. Ainda é possível abrir uma sessão segura sem tela preta.'
      : save.state === 'created'
        ? 'Nenhum progresso anterior foi encontrado. A primeira missão está pronta para começar.'
        : mission.phase === 'completed'
          ? 'Checkpoint seguro após a conclusão da missão.'
          : 'Checkpoint seguro no briefing da base.',
    statusLabel: saveUnavailable
      ? 'Atenção ao save'
      : menu.canClose
        ? 'Sessão segura'
        : 'Sistemas prontos',
    view: menu.isOpen ? menu.view : 'closed',
  };
}

export async function bootstrapApplication(shell: AppShell): Promise<ArenaScene | undefined> {
  let disposeFailedBootstrap: (() => void) | undefined;
  const startupOptions = parseStartupOptions(window.location.search);
  const persistenceEnabled = startupOptions.benchmark === undefined;
  const capability = inspectWebGl2Capability();
  const readiness = evaluateGraphicsReadiness(capability);
  shell.setGraphicsCapability(capability);
  shell.setBackend(capability.webGl2Available ? 'WebGL 2 · detectado' : 'Indisponível');

  if (readiness.status === 'blocked') {
    shell.setSaveStatus({ state: 'inactive' });
    shell.showBlocked(WEBGL_UNAVAILABLE_NOTICE);
    return undefined;
  }

  const automaticPresetId = selectInitialPreset(capability, startupOptions.requestedPresetId);
  const defaultSettings = createDefaultGameSettings(automaticPresetId);
  const settingsController = persistenceEnabled
    ? createSettingsController(createLocalStorageSettingsRepository())
    : undefined;
  const settingsInitialization:
    | SettingsControllerResult
    | {
        readonly settings: GameSettings;
        readonly status: { readonly state: 'disabled' };
      } = settingsController?.initialize(defaultSettings) ?? {
    settings: defaultSettings,
    status: { state: 'disabled' },
  };
  let currentSettings = settingsInitialization.settings;
  let currentSettingsStatus: SettingsHudTelemetry['status'] = settingsInitialization.status;
  const preset = getGraphicsPreset(
    startupOptions.requestedPresetId ?? currentSettings.graphicsPresetId,
  );
  shell.setPreset(preset);
  shell.setSettingsTelemetry({
    activePresetId: preset.id,
    settings: currentSettings,
    status: currentSettingsStatus,
  });

  if (readiness.reason === 'software-renderer') {
    shell.showWarning(SOFTWARE_RENDERER_NOTICE);
  } else if (readiness.reason === 'renderer-unconfirmed') {
    shell.showWarning(RENDERER_UNCONFIRMED_NOTICE);
  }

  try {
    const menuSession = createSessionMenu(persistenceEnabled);
    const defaultSavePayload = createGameSavePayload(FIRST_TUTORIAL_MISSION.id, 'briefing');
    const saveController = createSaveController({
      clock: { nowIso: () => new Date().toISOString() },
      isPayloadSupported: (payload) =>
        INITIAL_TUTORIAL_MISSIONS.some(({ id }) => id === payload.mission.missionId),
      repository: createIndexedDbSaveRepository(),
    });
    let currentSaveTelemetry: SaveHudTelemetry = {
      state: persistenceEnabled ? 'loading' : 'disabled',
    };
    shell.setSaveStatus(currentSaveTelemetry);
    const saveInitialization = persistenceEnabled
      ? await saveController.initialize(defaultSavePayload)
      : { payload: defaultSavePayload, status: undefined };
    if (saveInitialization.status !== undefined) {
      currentSaveTelemetry = toSaveHudTelemetry(saveInitialization.status);
      shell.setSaveStatus(currentSaveTelemetry);
    }
    let lastSafePayload: GameSavePayload = saveInitialization.payload;
    const encounterSession = createEncounterSession({
      enemyInitialPosition: TRAINING_ARENA.enemyPosition,
      playerInitialShieldChargeUnits: 70,
    });
    const flightSession = createFlightSession({
      arenaRadiusUnits: TRAINING_ARENA.radiusUnits,
      definition: PLAYER_SHIP_DEFINITION,
      energyDefinition: PLAYER_ENERGY_DEFINITION,
      encounter: encounterSession,
      initialEnergyState: createInitialEnergyState(PLAYER_ENERGY_DEFINITION),
      initialState: createInitialShipState({ x: 0, y: 0, z: 16 }),
    });
    const missionSession = createTutorialCampaign(INITIAL_TUTORIAL_MISSIONS, {
      checkpoint: saveInitialization.payload.mission.checkpoint,
      missionId: saveInitialization.payload.mission.missionId,
    });
    const navigationSession = createSystemNavigation(TRAINING_SYSTEM);
    const initialMissionContent = getTutorialMissionContent(missionSession.getSnapshot().missionId);
    encounterSession.setProfile({
      allowedPlayerEquipment: initialMissionContent.allowedEquipment,
      contactDisplayName: initialMissionContent.contactDisplayName,
      contactId: initialMissionContent.targetContactId,
      contactInitialPosition: initialMissionContent.contactInitialPosition,
      disposition: initialMissionContent.encounterMode,
    });
    flightSession.restartEncounter();
    flightSession.pause('mission-base');
    const presentationEffectRetainer = createPresentationEffectRetainer();
    let pendingPresentationEffect:
      | {
          readonly before: PlayerEffectResultView;
          readonly equipmentId: PlayerPresentationEquipmentId;
          readonly impactSector?: ShieldSectorId;
          readonly targetPosition: { readonly x: number; readonly y: number; readonly z: number };
        }
      | undefined;
    let presentationEffectSerial = 0;
    const requestPlayerEffect = (equipmentId: PlayerPresentationEquipmentId): void => {
      if (
        menuSession.getSnapshot().isOpen ||
        navigationSession.getSnapshot().mode !== 'encounter'
      ) {
        shell.setControlFeedback('Equipamentos táticos estão indisponíveis fora do encontro.');
        return;
      }
      const beforeSnapshot = flightSession.getSnapshot();
      const before = beforeSnapshot.encounter;
      const ship = beforeSnapshot.ship;
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
              ...(equipmentId === 'beam'
                ? {
                    impactSector: resolveShieldSector(before.enemy.orientationDegrees, {
                      x: ship.position.x - publicObservation.position.x,
                      y: ship.position.y - publicObservation.position.y,
                      z: ship.position.z - publicObservation.position.z,
                    }),
                  }
                : {}),
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
      shell.setMissionJournalTelemetry(telemetry.journal);
      shell.setMissionTelemetry(telemetry.mission);
      shell.setNavigationTelemetry(
        createNavigationHudTelemetry(navigationSession.getSnapshot(), missionSession.getSnapshot()),
      );
      shell.setBaseTelemetry(telemetry.base);
    });
    const createHudTelemetry = (snapshot = flightSession.getSnapshot()): PublishedHudTelemetry => {
      const { effects, flow, profileId, state } = snapshot.energy;
      const { contact, enemy, playerDamage } = snapshot.encounter;
      const missionSnapshot = missionSession.getSnapshot();
      const missionTelemetry = createMissionHudTelemetry(missionSnapshot, currentSettings);
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
        base: createBaseHudTelemetry(
          missionSession.getSnapshot(),
          snapshot,
          navigationSession.getSnapshot().mode === 'base' &&
            !menuSession.getSnapshot().isOpen &&
            startupOptions.benchmark === undefined,
        ),
        combat: {
          activeScan: snapshot.encounter.activeScan,
          allowedPlayerEquipment: snapshot.encounter.allowedPlayerEquipment,
          awareness: contact.awareness,
          contactLabel,
          ...(contact.distanceUnits === undefined ? {} : { distanceUnits: contact.distanceUnits }),
          disposition: snapshot.encounter.disposition,
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
        journal: createMissionJournal(
          INITIAL_TUTORIAL_MISSIONS,
          missionSnapshot,
          missionTelemetry.objective,
        ),
        mission: missionTelemetry,
      };
    };
    const refreshHud = (): void => {
      hudPublisher.publishNow(createHudTelemetry());
    };
    const refreshMainMenu = (): void => {
      shell.setMainMenuTelemetry(
        createMainMenuHudTelemetry(
          menuSession.getSnapshot(),
          currentSaveTelemetry,
          missionSession.getSnapshot(),
        ),
      );
    };
    const publishSaveStatus = (status: SaveControllerStatus): void => {
      currentSaveTelemetry = toSaveHudTelemetry(status);
      shell.setSaveStatus(currentSaveTelemetry);
      if (menuSession.getSnapshot().isOpen) refreshMainMenu();
    };
    const persistCheckpoint = (payload: GameSavePayload, recover = false): void => {
      lastSafePayload = payload;
      if (!persistenceEnabled) return;
      const operation = recover ? saveController.recover(payload) : saveController.save(payload);
      void operation.then(publishSaveStatus);
    };
    const input = createFlightInputController({
      canvas: shell.canvas,
      fullscreenTarget: shell.fullscreenTarget,
      preferences: toFlightInputPreferences(currentSettings),
      onControlFeedback: (message) => shell.setControlFeedback(message),
      onFocusLost() {
        if (menuSession.getSnapshot().isOpen) return;
        if (navigationSession.getSnapshot().mode === 'encounter') {
          flightSession.pause('focus-lost');
        }
        refreshHud();
      },
      onFullscreenChange(active) {
        shell.setFullscreenActive(active);
        shell.setControlFeedback(active ? 'Tela cheia ativada.' : 'Tela cheia desativada.');
      },
      onPauseToggle() {
        if (menuSession.getSnapshot().isOpen) return;
        if (navigationSession.getSnapshot().mode !== 'encounter') {
          shell.setControlFeedback(
            'Pausa manual e controles de voo só ficam disponíveis dentro da bolha tática.',
          );
          return;
        }
        flightSession.toggleManualPause();
        refreshHud();
      },
      onTacticalAction(action) {
        if (menuSession.getSnapshot().isOpen) return;
        if (navigationSession.getSnapshot().mode !== 'encounter') {
          shell.setControlFeedback(
            'Controles táticos indisponíveis fora de um encontro. Abra o mapa para partir.',
          );
          return;
        }
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
    const sceneForSettings: { current?: ArenaScene } = {};
    const publishSettingsResult = (result: SettingsControllerResult): void => {
      currentSettings = result.settings;
      currentSettingsStatus = result.status;
      input.setPreferences(toFlightInputPreferences(currentSettings));
      sceneForSettings.current?.setPresentationPreferences(
        toArenaPresentationPreferences(currentSettings),
      );
      shell.setSettingsTelemetry({
        activePresetId: preset.id,
        settings: currentSettings,
        status: currentSettingsStatus,
      });
    };
    const unbindSettingsControls = shell.bindSettingsControls({
      onChange(settings) {
        if (settingsController === undefined) return;
        publishSettingsResult(settingsController.save(settings));
      },
      onReset() {
        if (settingsController === undefined) return;
        publishSettingsResult(settingsController.reset(defaultSettings));
      },
    });
    const unbindControls = shell.bindFlightControls({
      onFullscreen: () => void input.toggleFullscreen(),
      onPause() {
        input.releaseControls();
        if (menuSession.getSnapshot().isOpen) return;
        if (navigationSession.getSnapshot().mode !== 'encounter') {
          shell.setControlFeedback(
            'Pausa manual e controles de voo só ficam disponíveis dentro da bolha tática.',
          );
          return;
        }
        flightSession.toggleManualPause();
        refreshHud();
      },
      onPointerCapture: () => void input.requestPointerCapture(),
    });
    const unbindEnergyControls = shell.bindEnergyControls({
      onAdjust(channel, deltaUnits) {
        if (menuSession.getSnapshot().isOpen) return;
        flightSession.adjustEnergy(channel, deltaUnits);
        refreshHud();
      },
      onPreset(presetId) {
        if (menuSession.getSnapshot().isOpen) return;
        flightSession.setEnergyProfile(presetId, ENERGY_PRESETS[presetId].allocation);
        refreshHud();
      },
    });
    const unbindCombatControls = shell.bindCombatControls({
      onClearTarget: () => {
        if (
          !menuSession.getSnapshot().isOpen &&
          navigationSession.getSnapshot().mode === 'encounter'
        ) {
          flightSession.clearTarget();
        }
      },
      onRestartEncounter() {
        if (
          menuSession.getSnapshot().isOpen ||
          navigationSession.getSnapshot().mode !== 'encounter'
        ) {
          return;
        }
        flightSession.restartEncounter();
        presentationEffectRetainer.clear();
        pendingPresentationEffect = undefined;
        refreshHud();
      },
      onSelectTarget: () => {
        if (
          !menuSession.getSnapshot().isOpen &&
          navigationSession.getSnapshot().mode === 'encounter'
        ) {
          flightSession.selectNextTarget();
        }
      },
      onToggleScan: () => {
        if (
          !menuSession.getSnapshot().isOpen &&
          navigationSession.getSnapshot().mode === 'encounter'
        ) {
          flightSession.toggleActiveScan();
        }
      },
      onUseBeam: () => requestPlayerEffect('beam'),
      onUseTorpedo: () => requestPlayerEffect('torpedo'),
      onUseTractor: () => requestPlayerEffect('tractor'),
    });
    const resetPresentationEffects = (): void => {
      presentationEffectRetainer.clear();
      pendingPresentationEffect = undefined;
    };
    const openMapForCurrentMission = (): void => {
      if (menuSession.getSnapshot().isOpen) return;
      const before = missionSession.getSnapshot();
      if (before.phase === 'completed') {
        if (!missionSession.continueFromCompletion()) return;
        const nextMission = missionSession.getSnapshot();
        persistCheckpoint(createGameSavePayload(nextMission.missionId, 'briefing'));
      } else if (before.phase !== 'briefing') {
        shell.setControlFeedback(
          'O mapa de partida só pode ser aberto enquanto a nave está na base.',
        );
        return;
      }
      const result = navigationSession.openMap();
      const failure = navigationFailureMessage(result);
      shell.setControlFeedback(
        failure ?? 'Mapa aberto. Selecione o destino marcado para a missão atual.',
      );
      input.releaseControls();
      refreshHud();
    };
    const confirmMissionTravel = (): void => {
      const missionSnapshot = missionSession.getSnapshot();
      const mission = getTutorialMissionContent(missionSnapshot.missionId);
      const selectedDestination = navigationSession.getSnapshot().selectedRoute?.destinationNodeId;
      if (selectedDestination !== mission.destinationNodeId) {
        shell.setControlFeedback(
          `Selecione ${getTrainingSystemNode(mission.destinationNodeId).label}, o destino marcado para esta missão.`,
        );
        refreshHud();
        return;
      }
      const navigationResult = navigationSession.beginOutboundTravel();
      const failure = navigationFailureMessage(navigationResult);
      if (failure !== undefined) {
        shell.setControlFeedback(failure);
        refreshHud();
        return;
      }
      if (!missionSession.start()) {
        throw new Error('A campanha rejeitou uma rota já validada no briefing.');
      }
      persistCheckpoint(createGameSavePayload(mission.id, 'briefing'));
      encounterSession.setProfile({
        allowedPlayerEquipment: mission.allowedEquipment,
        contactId: mission.targetContactId,
        contactInitialPosition: mission.contactInitialPosition,
        contactDisplayName: mission.contactDisplayName,
        disposition: mission.encounterMode,
      });
      input.releaseControls();
      flightSession.restartEncounter();
      flightSession.pause('mission-transition');
      resetPresentationEffects();
      shell.setControlFeedback(mission.outboundObjective);
      refreshHud();
    };
    const enterSession = (feedback: string): void => {
      menuSession.enterSession();
      input.releaseControls();
      refreshHud();
      refreshMainMenu();
      shell.setControlFeedback(feedback);
    };
    const startNewTraining = async (): Promise<void> => {
      const shouldReplaceStoredProgress =
        persistenceEnabled && currentSaveTelemetry.state !== 'created';
      shell.setNewTrainingConfirmation(false);
      shell.setMainMenuTelemetry({
        canClose: false,
        canContinue: false,
        progressLabel: 'Restaurando a primeira missão…',
        saveDetail: 'O novo checkpoint seguro está sendo preparado neste dispositivo.',
        statusLabel: 'Preparando sessão',
        view: 'loading',
      });
      missionSession.reset();
      const firstMission = getTutorialMissionContent(FIRST_TUTORIAL_MISSION.id);
      encounterSession.setProfile({
        allowedPlayerEquipment: firstMission.allowedEquipment,
        contactDisplayName: firstMission.contactDisplayName,
        contactId: firstMission.targetContactId,
        contactInitialPosition: firstMission.contactInitialPosition,
        disposition: firstMission.encounterMode,
      });
      flightSession.restartEncounter();
      flightSession.pause('mission-base');
      resetPresentationEffects();
      lastSafePayload = defaultSavePayload;
      if (shouldReplaceStoredProgress) {
        publishSaveStatus(await saveController.recover(defaultSavePayload));
      }
      enterSession('Novo treinamento iniciado. A Base Aurora está pronta para a primeira missão.');
    };
    const unbindBaseControls = shell.bindBaseControls({
      onOpenJournal() {
        if (navigationSession.getSnapshot().mode !== 'base' || !menuSession.open()) return;
        if (!menuSession.show('journal')) return;
        input.releaseControls();
        refreshHud();
        refreshMainMenu();
      },
      onOpenMenu() {
        if (navigationSession.getSnapshot().mode !== 'base' || !menuSession.open()) return;
        input.releaseControls();
        refreshHud();
        refreshMainMenu();
      },
      onPrepareMission: openMapForCurrentMission,
    });
    const unbindMainMenuControls = shell.bindMainMenuControls({
      onBack() {
        if (!menuSession.back()) return;
        refreshHud();
        refreshMainMenu();
      },
      onClose() {
        if (!menuSession.back()) return;
        refreshHud();
        refreshMainMenu();
      },
      onConfirmNewTraining: () => void startNewTraining(),
      onContinue() {
        const menu = menuSession.getSnapshot();
        const canContinue =
          menu.canClose ||
          currentSaveTelemetry.state === 'loaded' ||
          currentSaveTelemetry.state === 'migrated' ||
          currentSaveTelemetry.state === 'saved';
        if (!canContinue) return;
        enterSession('Checkpoint seguro carregado. A nave permanece atracada na Base Aurora.');
      },
      onNewTraining() {
        const requiresConfirmation =
          currentSaveTelemetry.state !== 'created' && currentSaveTelemetry.state !== 'disabled';
        if (requiresConfirmation) {
          shell.setNewTrainingConfirmation(true);
        } else {
          void startNewTraining();
        }
      },
      onOpenView(view) {
        if (!menuSession.show(view)) return;
        refreshMainMenu();
      },
    });
    const unbindNavigationControls = shell.bindNavigationControls({
      onCloseMap() {
        const failure = navigationFailureMessage(navigationSession.closeMap());
        shell.setControlFeedback(failure ?? 'Mapa fechado. A nave permanece segura na base.');
        refreshHud();
      },
      onConfirmTravel: confirmMissionTravel,
      onOpenMap: openMapForCurrentMission,
      onSelectDestination(nodeId) {
        const result = navigationSession.selectDestination(nodeId);
        const failure = navigationFailureMessage(result);
        if (failure !== undefined) {
          shell.setControlFeedback(failure);
        } else {
          const mission = getTutorialMissionContent(missionSession.getSnapshot().missionId);
          shell.setControlFeedback(
            nodeId === mission.destinationNodeId
              ? 'Destino da missão selecionado. Confirme para iniciar a viagem.'
              : 'Ponto consultado. Selecione o destino marcado para iniciar a missão.',
          );
        }
        refreshHud();
      },
    });
    const unbindMissionControls = shell.bindMissionControls({
      onPrimaryAction() {
        const mission = missionSession.getSnapshot();
        if (mission.phase === 'briefing' || mission.phase === 'completed') {
          openMapForCurrentMission();
          return;
        }
        if (mission.phase === 'objective' && mission.objectiveCompleted) {
          const navigationFailure = navigationFailureMessage(navigationSession.beginReturnTravel());
          if (navigationFailure !== undefined) {
            shell.setControlFeedback(navigationFailure);
            refreshHud();
            return;
          }
          if (!missionSession.beginReturn()) {
            throw new Error('A campanha rejeitou um retorno já validado pela navegação.');
          }
          const content = getTutorialMissionContent(mission.missionId);
          input.releaseControls();
          flightSession.pause('mission-transition');
          resetPresentationEffects();
          shell.setControlFeedback(
            formatControlHints(content.returnFeedback, currentSettings.controlBindings),
          );
          refreshHud();
        }
      },
    });
    const unbindSaveControls = shell.bindSaveControls({
      onRecover() {
        persistCheckpoint(lastSafePayload, true);
      },
    });
    disposeFailedBootstrap = () => {
      unbindSettingsControls();
      unbindMainMenuControls();
      unbindBaseControls();
      unbindSaveControls();
      unbindMissionControls();
      unbindNavigationControls();
      unbindCombatControls();
      unbindEnergyControls();
      unbindControls();
      input.dispose();
    };
    const { createArenaScene } = await import('../engine/create-arena-scene');
    const engineScene = await createArenaScene(
      shell.canvas,
      preset,
      {
        onBenchmarkTelemetry(telemetry) {
          shell.setBenchmarkTelemetry({
            asteroidCount: telemetry.asteroidCount,
            elapsedSeconds: telemetry.elapsedSeconds,
            fleetShipCount: telemetry.fleetShipCount,
            ...(telemetry.frameTimeProfile === undefined
              ? {}
              : {
                  averageFps: telemetry.frameTimeProfile.averageFps,
                  p50FrameTimeMs: telemetry.frameTimeProfile.p50FrameTimeMs,
                  p95FrameTimeMs: telemetry.frameTimeProfile.p95FrameTimeMs,
                  p99FrameTimeMs: telemetry.frameTimeProfile.p99FrameTimeMs,
                }),
            presetId: telemetry.presetId,
            starCount: telemetry.starCount,
            state: telemetry.state,
            targetDurationSeconds: telemetry.targetDurationSeconds,
          });
        },
        onFpsSample: (fps) => shell.setFps(fps),
        onPresentationFrame: (presentation) => shell.setArenaPresentation(presentation),
        onUpdate(deltaSeconds, getTelemetry) {
          const missionBeforeAdvance = missionSession.getSnapshot();
          const missionAfterAdvance = missionSession.advance(deltaSeconds);
          if (missionBeforeAdvance.phase !== missionAfterAdvance.phase) {
            if (
              missionAfterAdvance.phase === 'objective' &&
              flightSession.getSnapshot().pauseReason === 'mission-transition'
            ) {
              const navigationFailure = navigationFailureMessage(navigationSession.arrive());
              if (navigationFailure !== undefined) {
                throw new Error(`A chegada ao encontro falhou: ${navigationFailure}`);
              }
              const mission = getTutorialMissionContent(missionAfterAdvance.missionId);
              flightSession.resume();
              shell.setControlFeedback(
                formatControlHints(mission.arrivalFeedback, currentSettings.controlBindings),
              );
            } else if (missionAfterAdvance.phase === 'completed') {
              const navigationFailure = navigationFailureMessage(navigationSession.arrive());
              if (navigationFailure !== undefined) {
                throw new Error(`A chegada à base falhou: ${navigationFailure}`);
              }
              const mission = getTutorialMissionContent(missionAfterAdvance.missionId);
              flightSession.restartEncounter();
              flightSession.pause('mission-base');
              resetPresentationEffects();
              persistCheckpoint(createGameSavePayload(mission.id, 'completed'));
              shell.setControlFeedback(
                formatControlHints(mission.completionFeedback, currentSettings.controlBindings),
              );
            }
          }
          const snapshot = flightSession.advance(deltaSeconds, input);
          const missionObjective = missionSession.getSnapshot();
          let objectiveEvent: TutorialObjectiveEvent | undefined;
          if (missionObjective.phase === 'objective') {
            if (
              missionObjective.objectiveType === 'identify-contact' &&
              snapshot.encounter.contact.awareness === 'identified'
            ) {
              objectiveEvent = {
                contactId: snapshot.encounter.contact.contactId,
                type: 'contact-identified',
              };
            } else if (
              missionObjective.objectiveType === 'tractor-lock' &&
              snapshot.encounter.contact.awareness === 'identified' &&
              snapshot.encounter.tractorActive
            ) {
              objectiveEvent = {
                contactId: snapshot.encounter.contact.contactId,
                type: 'tractor-activated',
              };
            } else if (
              missionObjective.objectiveType === 'combat-victory' &&
              snapshot.encounter.phase === 'victory'
            ) {
              objectiveEvent = {
                contactId: snapshot.encounter.contact.contactId,
                type: 'combat-won',
              };
            }
          }
          if (objectiveEvent !== undefined && missionSession.recordObjective(objectiveEvent)) {
            const mission = getTutorialMissionContent(missionObjective.missionId);
            shell.setControlFeedback(
              formatControlHints(mission.objectiveCompleteText, currentSettings.controlBindings),
            );
          }
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
              const matchingAuthoritativeEffect =
                encounter.effect?.kind === pendingPresentationEffect.equipmentId
                  ? encounter.effect
                  : undefined;
              presentationEffectRetainer.capture(pendingPresentationEffect.equipmentId, {
                ...(matchingAuthoritativeEffect?.impactSector === undefined
                  ? pendingPresentationEffect.impactSector === undefined
                    ? {}
                    : { impactSector: pendingPresentationEffect.impactSector }
                  : { impactSector: matchingAuthoritativeEffect.impactSector }),
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
          const renderSnapshot = {
            ...snapshot,
            navigationMode: navigationSession.getSnapshot().mode,
          } as const;
          if (presentationEffects.length === 0) return renderSnapshot;
          return {
            ...renderSnapshot,
            presentationEffects,
          };
        },
      },
      {
        ...(startupOptions.benchmark === undefined ? {} : { benchmark: startupOptions.benchmark }),
        presentationPreferences: toArenaPresentationPreferences(currentSettings),
        ...(startupOptions.requestedBackend === undefined
          ? {}
          : { preferredBackend: startupOptions.requestedBackend }),
      },
    );
    const scene: ArenaScene = {
      backendLabel: engineScene.backendLabel,
      dispose() {
        disposeFailedBootstrap?.();
        disposeFailedBootstrap = undefined;
        engineScene.dispose();
      },
      setPresentationPreferences(preferences) {
        engineScene.setPresentationPreferences(preferences);
      },
    };
    sceneForSettings.current = scene;
    shell.setBackend(scene.backendLabel);
    shell.setPointerCaptured(input.isPointerCaptured());
    shell.setFullscreenActive(false);
    refreshHud();
    shell.showReady(readiness);
    refreshMainMenu();
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
