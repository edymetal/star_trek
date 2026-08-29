import type { GraphicsPreset } from '../content/graphics-presets';
import type { ArenaPresentationDto } from '../application/arena-presentation';
import type { ShieldSectorState, SubsystemIntegrity } from '../domain/combat/damage';
import type { EnemyAiMode } from '../domain/combat/enemy-ai';
import type { ContactAwareness } from '../domain/combat/sensors';
import {
  ENERGY_CHANNELS,
  type EnergyAllocation,
  type EnergyChannelId,
  type EnergyPresetId,
} from '../domain/energy/energy-system';
import type { GraphicsCapability, GraphicsReadiness } from '../domain/graphics-readiness';
import type { Vector3Value } from '../domain/flight/ship-flight';
import type { ExplorationMissionPhase } from '../domain/missions/exploration-mission';
import { conditionLabel } from './condition-label';

export interface CompatibilityNotice {
  readonly actions: readonly string[];
  readonly detail?: string;
  readonly message: string;
  readonly title: string;
}

export interface AppShell {
  readonly canvas: HTMLCanvasElement;
  readonly fullscreenTarget: HTMLElement;
  bindEnergyControls(handlers: EnergyControlHandlers): () => void;
  bindFlightControls(handlers: FlightControlHandlers): () => void;
  bindCombatControls(handlers: CombatControlHandlers): () => void;
  bindMissionControls(handlers: MissionControlHandlers): () => void;
  bindSaveControls(handlers: SaveControlHandlers): () => void;
  setBackend(label: string): void;
  setBenchmarkTelemetry(telemetry: BenchmarkHudTelemetry): void;
  setArenaPresentation(presentation: ArenaPresentationDto): void;
  setControlFeedback(message: string): void;
  setEnergyTelemetry(telemetry: EnergyHudTelemetry): void;
  setCombatTelemetry(telemetry: CombatHudTelemetry): void;
  setFps(fps: number): void;
  setGraphicsCapability(capability: GraphicsCapability): void;
  setFlightTelemetry(telemetry: FlightHudTelemetry): void;
  setMissionTelemetry(telemetry: MissionHudTelemetry): void;
  setSaveStatus(telemetry: SaveHudTelemetry): void;
  setFullscreenActive(active: boolean): void;
  setPointerCaptured(active: boolean): void;
  setPreset(preset: GraphicsPreset): void;
  showBlocked(notice: CompatibilityNotice): void;
  showReady(readiness: GraphicsReadiness): void;
  showWarning(notice: CompatibilityNotice): void;
}

export interface BenchmarkHudTelemetry {
  readonly asteroidCount: number;
  readonly averageFps?: number;
  readonly elapsedSeconds: number;
  readonly fleetShipCount: number;
  readonly p50FrameTimeMs?: number;
  readonly p95FrameTimeMs?: number;
  readonly p99FrameTimeMs?: number;
  readonly presetId: GraphicsPreset['id'];
  readonly starCount: number;
  readonly state: 'complete' | 'sampling' | 'warmup';
  readonly targetDurationSeconds: number;
}

export interface FlightControlHandlers {
  readonly onFullscreen: () => void;
  readonly onPause: () => void;
  readonly onPointerCapture: () => void;
}

export interface EnergyControlHandlers {
  readonly onAdjust: (channel: EnergyChannelId, deltaUnits: number) => void;
  readonly onPreset: (presetId: EnergyPresetId) => void;
}

export interface CombatControlHandlers {
  readonly onClearTarget: () => void;
  readonly onRestartEncounter: () => void;
  readonly onSelectTarget: () => void;
  readonly onToggleScan: () => void;
  readonly onUseBeam: () => void;
  readonly onUseTorpedo: () => void;
  readonly onUseTractor: () => void;
}

export interface MissionControlHandlers {
  readonly onPrimaryAction: () => void;
}

export interface SaveControlHandlers {
  readonly onRecover: () => void;
}

export interface SaveHudTelemetry {
  readonly detail?: string;
  readonly state:
    | 'created'
    | 'disabled'
    | 'error'
    | 'inactive'
    | 'invalid'
    | 'loaded'
    | 'loading'
    | 'migrated'
    | 'saved';
}

export interface MissionHudTelemetry {
  readonly actionEnabled: boolean;
  readonly actionLabel: string;
  readonly identifiedTarget: boolean;
  readonly objective: string;
  readonly phase: ExplorationMissionPhase;
  readonly phaseLabel: string;
  readonly title: string;
  readonly transitionProgress: number;
}

export interface CombatHudTelemetry {
  readonly activeScan: boolean;
  readonly awareness: ContactAwareness;
  readonly contactLabel: string;
  readonly distanceUnits?: number;
  readonly enemyAiMode?: EnemyAiMode;
  readonly enemyHullPercent?: number;
  readonly enemyShieldPercent?: number;
  readonly feedback: string;
  readonly observedNow: boolean;
  readonly phase: 'active' | 'victory' | 'defeat';
  readonly playerShieldSectorsPercent: ShieldSectorState;
  readonly playerSubsystems: SubsystemIntegrity;
  readonly projectileCount: number;
  readonly scanProgress: number;
  readonly selected: boolean;
  readonly torpedoAmmo: number;
  readonly tractorActive: boolean;
  readonly weaponCooldownSeconds: Readonly<Record<'beam' | 'torpedo' | 'tractor', number>>;
}

export interface FlightHudTelemetry {
  readonly activeVfxCount: number;
  readonly boundaryDistanceUnits: number;
  readonly drawCalls: number;
  readonly enginePerformanceMultiplier: number;
  readonly frameTimeMs: number;
  readonly hullPercent: number;
  readonly instancedObjects: number;
  readonly lodLabel: string;
  readonly pauseReason:
    'focus-lost' | 'manual' | 'mission-complete' | 'mission-transition' | undefined;
  readonly paused: boolean;
  readonly position: Vector3Value;
  readonly sensorRangeUnits: number;
  readonly shieldPercent: number;
  readonly shieldRegenerationUnitsPerSecond: number;
  readonly speedUnitsPerSecond: number;
  readonly targetLabel: string;
  readonly weaponCapacitorPercent: number;
  readonly weaponHeatPercent: number;
  readonly weaponRechargeUnitsPerSecond: number;
}

export interface EnergyHudTelemetry {
  readonly allocation: EnergyAllocation;
  readonly allocationCapacityUnits: number;
  readonly channelEffectivePower: EnergyAllocation;
  readonly deliveredUnitsPerSecond: number;
  readonly profileId: EnergyPresetId | 'custom';
  readonly reactorGeneratedUnitsPerSecond: number;
  readonly reservePercent: number;
}

function isEnergyChannelId(value: string | undefined): value is EnergyChannelId {
  return value !== undefined && ENERGY_CHANNELS.some((channel) => channel === value);
}

function isEnergyPresetId(value: string | undefined): value is EnergyPresetId {
  return value === 'balanced' || value === 'attack' || value === 'defense' || value === 'escape';
}

function requireElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`Elemento obrigatório não encontrado: ${selector}`);
  }

  return element;
}

function setTextIfChanged(element: Node, value: string): void {
  if (element.textContent !== value) {
    element.textContent = value;
  }
}

function setAttributeIfChanged(element: Element, name: string, value: string): void {
  if (element.getAttribute(name) !== value) {
    element.setAttribute(name, value);
  }
}

function setHiddenIfChanged(element: HTMLElement, hidden: boolean): void {
  if (element.hidden !== hidden) {
    element.hidden = hidden;
  }
}

function setStylePropertyIfChanged(element: HTMLElement, name: string, value: string): void {
  if (element.style.getPropertyValue(name) !== value) {
    element.style.setProperty(name, value);
  }
}

function roundAllocationForDisplay(
  allocation: EnergyAllocation,
  capacityUnits: number,
): EnergyAllocation {
  const rounded: Record<EnergyChannelId, number> = {
    auxiliary: Math.round(allocation.auxiliary * 10) / 10,
    engines: Math.round(allocation.engines * 10) / 10,
    shields: Math.round(allocation.shields * 10) / 10,
    weapons: Math.round(allocation.weapons * 10) / 10,
  };
  const displayedTotal = ENERGY_CHANNELS.reduce((sum, channel) => sum + rounded[channel], 0);
  const correction = Math.round((capacityUnits - displayedTotal) * 10) / 10;
  const largestChannel = ENERGY_CHANNELS.reduce((largest, channel) =>
    allocation[channel] > allocation[largest] ? channel : largest,
  );
  rounded[largestChannel] = Math.max(0, rounded[largestChannel] + correction);
  return rounded;
}

export function createAppShell(root: HTMLElement): AppShell {
  const canvas = requireElement<HTMLCanvasElement>(root, '#game-canvas');
  const statusText = requireElement<HTMLElement>(root, '[data-status-text]');
  const backendValue = requireElement<HTMLElement>(root, '[data-diagnostic="backend"]');
  const rendererValue = requireElement<HTMLElement>(root, '[data-diagnostic="renderer"]');
  const presetValue = requireElement<HTMLElement>(root, '[data-diagnostic="preset"]');
  const fpsValue = requireElement<HTMLElement>(root, '[data-diagnostic="fps"]');
  const benchmarkPanel = requireElement<HTMLElement>(root, '[data-benchmark-panel]');
  const benchmarkState = requireElement<HTMLElement>(root, '[data-benchmark-state]');
  const benchmarkProgress = requireElement<HTMLElement>(root, '[data-benchmark-progress]');
  const benchmarkLoad = requireElement<HTMLElement>(root, '[data-benchmark-load]');
  const benchmarkResult = requireElement<HTMLElement>(root, '[data-benchmark-result]');
  const notice = requireElement<HTMLElement>(root, '[data-compatibility-notice]');
  const diagnosticsDrawer = requireElement<HTMLDetailsElement>(root, '.diagnostics-drawer');
  const noticeTitle = requireElement<HTMLElement>(notice, '[data-notice-title]');
  const noticeMessage = requireElement<HTMLElement>(notice, '[data-notice-message]');
  const noticeActions = requireElement<HTMLOListElement>(notice, '[data-notice-actions]');
  const noticeDetail = requireElement<HTMLElement>(notice, '[data-notice-detail]');
  const retryButton = requireElement<HTMLButtonElement>(notice, '[data-retry-button]');
  const flightHud = requireElement<HTMLElement>(root, '[data-flight-hud]');
  const objectiveText = requireElement<HTMLElement>(root, '[data-objective-text]');
  const missionTitle = requireElement<HTMLElement>(root, '[data-mission-title]');
  const missionPhase = requireElement<HTMLElement>(root, '[data-mission-phase]');
  const missionAction = requireElement<HTMLButtonElement>(root, '[data-mission-action]');
  const saveStatus = requireElement<HTMLElement>(root, '[data-save-status]');
  const saveRecovery = requireElement<HTMLButtonElement>(root, '[data-save-recovery]');
  const speedValue = requireElement<HTMLElement>(flightHud, '[data-flight-speed]');
  const positionValue = requireElement<HTMLElement>(flightHud, '[data-flight-position]');
  const boundaryValue = requireElement<HTMLElement>(flightHud, '[data-flight-boundary]');
  const simulationValue = requireElement<HTMLElement>(flightHud, '[data-flight-simulation]');
  const frameTimeValue = requireElement<HTMLElement>(flightHud, '[data-flight-frame-time]');
  const drawCallsValue = requireElement<HTMLElement>(flightHud, '[data-flight-draw-calls]');
  const lodValue = requireElement<HTMLElement>(flightHud, '[data-flight-lod]');
  const targetValue = requireElement<HTMLElement>(flightHud, '[data-flight-target]');
  const hullValue = requireElement<HTMLElement>(flightHud, '[data-flight-hull]');
  const shieldValue = requireElement<HTMLElement>(flightHud, '[data-flight-shields]');
  const weaponValue = requireElement<HTMLElement>(flightHud, '[data-flight-weapon]');
  const heatValue = requireElement<HTMLElement>(flightHud, '[data-flight-heat]');
  const sensorValue = requireElement<HTMLElement>(flightHud, '[data-flight-sensor-range]');
  const pauseButton = requireElement<HTMLButtonElement>(flightHud, '[data-flight-pause]');
  const captureButton = requireElement<HTMLButtonElement>(flightHud, '[data-flight-capture]');
  const fullscreenButton = requireElement<HTMLButtonElement>(flightHud, '[data-flight-fullscreen]');
  const controlFeedback = requireElement<HTMLElement>(flightHud, '[data-control-feedback]');
  const energyPanel = requireElement<HTMLElement>(root, '[data-energy-panel]');
  const combatPanel = requireElement<HTMLElement>(root, '[data-combat-panel]');
  // Keep keyboard navigation aligned with the tactical decision flow, independent of visual positioning.
  root.insertBefore(combatPanel, flightHud);
  root.insertBefore(energyPanel, flightHud);
  const combatPhase = requireElement<HTMLElement>(combatPanel, '[data-combat-phase]');
  const combatContact = requireElement<HTMLElement>(combatPanel, '[data-combat-contact]');
  const combatDistance = requireElement<HTMLElement>(combatPanel, '[data-combat-distance]');
  const combatScan = requireElement<HTMLElement>(combatPanel, '[data-combat-scan]');
  const combatEnemyState = requireElement<HTMLElement>(combatPanel, '[data-combat-enemy-state]');
  const combatAi = requireElement<HTMLElement>(combatPanel, '[data-combat-ai]');
  const combatShieldSectors = requireElement<HTMLElement>(root, '[data-combat-shield-sectors]');
  const shieldSectorValues = new Map<keyof ShieldSectorState, HTMLElement>(
    (['front', 'rear', 'port', 'starboard'] as const).map((sector) => [
      sector,
      requireElement<HTMLElement>(combatShieldSectors, `[data-shield-sector="${sector}"]`),
    ]),
  );
  const combatSubsystems = requireElement<HTMLElement>(flightHud, '[data-combat-subsystems]');
  const combatScanProgress = requireElement<HTMLProgressElement>(
    combatPanel,
    '[data-combat-scan-progress]',
  );
  const combatFeedback = requireElement<HTMLElement>(combatPanel, '[data-combat-feedback]');
  const terminalBanner = requireElement<HTMLElement>(root, '[data-terminal-banner]');
  const terminalTitle = requireElement<HTMLElement>(terminalBanner, '[data-terminal-title]');
  const terminalMessage = requireElement<HTMLElement>(terminalBanner, '[data-terminal-message]');
  const targetTracker = requireElement<HTMLElement>(root, '[data-target-tracker]');
  const targetLine = requireElement<HTMLElement>(root, '[data-target-line]');
  const targetMarkerCaption = requireElement<HTMLElement>(
    targetTracker,
    '[data-target-marker-caption]',
  );
  let lastPresentationKey = '';
  const combatActionButtons = Array.from(
    combatPanel.querySelectorAll<HTMLButtonElement>('[data-combat-action]'),
  );
  const combatButton = (action: string): HTMLButtonElement =>
    requireElement<HTMLButtonElement>(combatPanel, `[data-combat-action="${action}"]`);
  const selectTargetButton = combatButton('select');
  const clearTargetButton = combatButton('clear');
  const scanButton = combatButton('scan');
  const beamButton = combatButton('beam');
  const torpedoButton = combatButton('torpedo');
  const tractorButton = combatButton('tractor');
  const restartEncounterButton = combatButton('restart');
  const energyTotal = requireElement<HTMLElement>(energyPanel, '[data-energy-total]');
  const reactorValue = requireElement<HTMLElement>(energyPanel, '[data-energy-reactor]');
  const reserveValue = requireElement<HTMLElement>(energyPanel, '[data-energy-reserve]');
  const energyFeedback = requireElement<HTMLElement>(energyPanel, '[data-energy-feedback]');
  const presetButtons = Array.from(
    energyPanel.querySelectorAll<HTMLButtonElement>('[data-energy-preset]'),
  );
  const adjustmentButtons = Array.from(
    energyPanel.querySelectorAll<HTMLButtonElement>('[data-energy-adjust]'),
  );
  const allocationValues = new Map<EnergyChannelId, HTMLElement>(
    ENERGY_CHANNELS.map((channel) => [
      channel,
      requireElement<HTMLElement>(energyPanel, `[data-energy-allocation="${channel}"]`),
    ]),
  );

  retryButton.addEventListener('click', () => window.location.reload());

  function renderNotice(value: CompatibilityNotice, isBlocking: boolean): void {
    noticeTitle.textContent = value.title;
    noticeMessage.textContent = value.message;
    noticeActions.replaceChildren(
      ...value.actions.map((action) => {
        const item = document.createElement('li');
        item.textContent = action;
        return item;
      }),
    );
    noticeDetail.textContent = value.detail ?? '';
    noticeDetail.hidden = value.detail === undefined;
    retryButton.hidden = !isBlocking;
    notice.dataset.noticeKind = isBlocking ? 'error' : 'warning';
    notice.hidden = false;
    diagnosticsDrawer.open = true;
  }

  return {
    canvas,
    fullscreenTarget: root,
    bindCombatControls(handlers) {
      const bindings = [
        [selectTargetButton, handlers.onSelectTarget],
        [clearTargetButton, handlers.onClearTarget],
        [scanButton, handlers.onToggleScan],
        [beamButton, handlers.onUseBeam],
        [torpedoButton, handlers.onUseTorpedo],
        [tractorButton, handlers.onUseTractor],
        [restartEncounterButton, handlers.onRestartEncounter],
      ] as const;
      for (const [button, listener] of bindings) button.addEventListener('click', listener);
      return () => {
        for (const [button, listener] of bindings) button.removeEventListener('click', listener);
      };
    },
    bindEnergyControls(handlers) {
      const presetListeners = presetButtons.map((button) => {
        const listener = (): void => {
          if (isEnergyPresetId(button.dataset.energyPreset)) {
            handlers.onPreset(button.dataset.energyPreset);
          }
        };
        button.addEventListener('click', listener);
        return { button, listener };
      });
      const adjustmentListeners = adjustmentButtons.map((button) => {
        const listener = (): void => {
          const channel = button.dataset.energyChannel;
          const delta = Number(button.dataset.energyAdjust);
          if (isEnergyChannelId(channel) && Number.isFinite(delta)) {
            handlers.onAdjust(channel, delta);
          }
        };
        button.addEventListener('click', listener);
        return { button, listener };
      });
      return () => {
        presetListeners.forEach(({ button, listener }) =>
          button.removeEventListener('click', listener),
        );
        adjustmentListeners.forEach(({ button, listener }) =>
          button.removeEventListener('click', listener),
        );
      };
    },
    bindMissionControls(handlers) {
      const listener = (): void => handlers.onPrimaryAction();
      missionAction.addEventListener('click', listener);
      return () => missionAction.removeEventListener('click', listener);
    },
    bindSaveControls(handlers) {
      const listener = (): void => handlers.onRecover();
      saveRecovery.addEventListener('click', listener);
      return () => saveRecovery.removeEventListener('click', listener);
    },
    bindFlightControls(handlers) {
      const handlePause = (): void => handlers.onPause();
      const handleCapture = (): void => handlers.onPointerCapture();
      const handleFullscreen = (): void => handlers.onFullscreen();
      pauseButton.addEventListener('click', handlePause);
      captureButton.addEventListener('click', handleCapture);
      fullscreenButton.addEventListener('click', handleFullscreen);
      return () => {
        pauseButton.removeEventListener('click', handlePause);
        captureButton.removeEventListener('click', handleCapture);
        fullscreenButton.removeEventListener('click', handleFullscreen);
      };
    },
    setBackend(label) {
      setTextIfChanged(backendValue, label);
    },
    setBenchmarkTelemetry(telemetry) {
      setHiddenIfChanged(benchmarkPanel, false);
      const stateLabel =
        telemetry.state === 'warmup'
          ? 'Aquecendo shaders e cena'
          : telemetry.state === 'sampling'
            ? 'Coletando frametimes'
            : 'Medição concluída';
      setTextIfChanged(benchmarkState, stateLabel);
      setTextIfChanged(
        benchmarkProgress,
        `${telemetry.elapsedSeconds.toFixed(1)} / ${telemetry.targetDurationSeconds.toFixed(1)} s`,
      );
      setTextIfChanged(
        benchmarkLoad,
        `${telemetry.fleetShipCount} naves · ${telemetry.asteroidCount} asteroides · ${telemetry.starCount} estrelas`,
      );
      setTextIfChanged(
        benchmarkResult,
        telemetry.averageFps === undefined
          ? 'Aguardando amostras válidas…'
          : `${telemetry.averageFps.toFixed(1)} FPS médios · p50 ${telemetry.p50FrameTimeMs?.toFixed(1)} ms · p95 ${telemetry.p95FrameTimeMs?.toFixed(1)} ms · p99 ${telemetry.p99FrameTimeMs?.toFixed(1)} ms`,
      );
      setAttributeIfChanged(root, 'data-benchmark-mode', 'active');
      setAttributeIfChanged(root, 'data-benchmark-state', telemetry.state);
      setAttributeIfChanged(root, 'data-benchmark-preset', telemetry.presetId);
      setAttributeIfChanged(
        root,
        'data-benchmark-average-fps',
        telemetry.averageFps?.toFixed(3) ?? '',
      );
      setAttributeIfChanged(
        root,
        'data-benchmark-p50-ms',
        telemetry.p50FrameTimeMs?.toFixed(3) ?? '',
      );
      setAttributeIfChanged(
        root,
        'data-benchmark-p95-ms',
        telemetry.p95FrameTimeMs?.toFixed(3) ?? '',
      );
      setAttributeIfChanged(
        root,
        'data-benchmark-p99-ms',
        telemetry.p99FrameTimeMs?.toFixed(3) ?? '',
      );
      if (telemetry.state === 'complete') diagnosticsDrawer.open = true;
    },
    setArenaPresentation(presentation) {
      const visuals = presentation.combatVisuals;
      setAttributeIfChanged(root, 'data-player-visual-damage', visuals.playerHullState);
      setAttributeIfChanged(root, 'data-remote-visual-damage', visuals.remoteHullState);
      for (const section of ['bow', 'stern', 'port', 'starboard'] as const) {
        setAttributeIfChanged(
          root,
          `data-player-section-${section}`,
          visuals.playerHullSections[section],
        );
        setAttributeIfChanged(
          root,
          `data-remote-section-${section}`,
          visuals.remoteHullSections === 'hidden' ? 'hidden' : visuals.remoteHullSections[section],
        );
      }
      setAttributeIfChanged(
        root,
        'data-player-disabled-subsystems',
        visuals.playerDisabledSubsystems.join(','),
      );
      setAttributeIfChanged(
        root,
        'data-remote-disabled-subsystems',
        visuals.remoteDisabledSubsystems.join(','),
      );
      setAttributeIfChanged(root, 'data-vfx-kind', visuals.effectKind);
      setAttributeIfChanged(root, 'data-impact-sector', visuals.impactSector);
      setAttributeIfChanged(root, 'data-shield-impact-target', visuals.shieldImpactTarget);
      const marker = presentation.targetMarker;
      const presentationKey = marker.visible
        ? `${marker.mode}|${marker.screenX.toFixed(1)}|${marker.screenY.toFixed(1)}|${root.clientWidth}|${root.clientHeight}`
        : 'hidden';
      if (presentationKey === lastPresentationKey) return;
      lastPresentationKey = presentationKey;
      setHiddenIfChanged(targetTracker, !marker.visible);
      setHiddenIfChanged(targetLine, !marker.visible);
      if (!marker.visible) return;
      setAttributeIfChanged(targetTracker, 'data-marker-mode', marker.mode);
      setAttributeIfChanged(targetLine, 'data-marker-mode', marker.mode);
      setTextIfChanged(
        targetMarkerCaption,
        marker.mode === 'remembered' ? 'MEMÓRIA · ÚLTIMA POSIÇÃO' : 'ALVO',
      );
      setStylePropertyIfChanged(
        targetTracker,
        'transform',
        `translate3d(${(marker.screenX - 27).toFixed(1)}px, ${(marker.screenY - 27).toFixed(1)}px, 0)`,
      );
      const centerX = root.clientWidth / 2;
      const centerY = root.clientHeight / 2;
      const deltaX = marker.screenX - centerX;
      const deltaY = marker.screenY - centerY;
      setStylePropertyIfChanged(targetLine, 'width', `${Math.hypot(deltaX, deltaY).toFixed(1)}px`);
      setStylePropertyIfChanged(
        targetLine,
        'transform',
        `rotate(${Math.atan2(deltaY, deltaX).toFixed(5)}rad)`,
      );
    },
    setControlFeedback(message) {
      setTextIfChanged(controlFeedback, message);
      setHiddenIfChanged(controlFeedback, message.length === 0);
    },
    setCombatTelemetry(telemetry) {
      const phaseLabel =
        telemetry.phase === 'active'
          ? 'Encontro ativo'
          : telemetry.phase === 'victory'
            ? 'Vitória'
            : 'Derrota';
      setTextIfChanged(combatPhase, phaseLabel);
      setTextIfChanged(combatContact, telemetry.contactLabel);
      setTextIfChanged(
        combatDistance,
        telemetry.distanceUnits === undefined ? '—' : `${telemetry.distanceUnits.toFixed(1)} u`,
      );
      setTextIfChanged(combatScan, `${(telemetry.scanProgress * 100).toFixed(0)}%`);
      if (combatScanProgress.value !== telemetry.scanProgress) {
        combatScanProgress.value = telemetry.scanProgress;
      }
      setTextIfChanged(
        combatEnemyState,
        telemetry.enemyHullPercent === undefined || telemetry.enemyShieldPercent === undefined
          ? 'Dados indisponíveis'
          : `Casco ${telemetry.enemyHullPercent.toFixed(0)}% · ${conditionLabel(telemetry.enemyHullPercent)} · Escudos ${telemetry.enemyShieldPercent.toFixed(0)}%`,
      );
      const aiLabels: Readonly<Record<EnemyAiMode, string>> = {
        attacking: 'Atacando',
        detecting: 'Procurando alvo',
        orienting: 'Orientando armas',
        pursuing: 'Perseguindo',
        redistributing: 'Redistribuindo energia',
        retreating: 'Recuando',
      };
      setTextIfChanged(
        combatAi,
        telemetry.enemyAiMode === undefined ? 'Não identificada' : aiLabels[telemetry.enemyAiMode],
      );
      const shields = telemetry.playerShieldSectorsPercent;
      for (const [sector, value] of shieldSectorValues) {
        setTextIfChanged(value, shields[sector].toFixed(0));
      }
      const systems = telemetry.playerSubsystems;
      setTextIfChanged(
        combatSubsystems,
        `MOT ${(systems.engines * 100).toFixed(0)} · ARM ${(systems.weapons * 100).toFixed(0)} · ESC ${(systems.shields * 100).toFixed(0)} · SEN ${(systems.sensors * 100).toFixed(0)}`,
      );
      setTextIfChanged(combatFeedback, telemetry.feedback);
      setTextIfChanged(
        beamButton,
        telemetry.weaponCooldownSeconds.beam > 0
          ? `Feixe ${telemetry.weaponCooldownSeconds.beam.toFixed(1)}s`
          : 'Feixe (1)',
      );
      setTextIfChanged(
        torpedoButton,
        telemetry.weaponCooldownSeconds.torpedo > 0
          ? `Torpedo ${telemetry.weaponCooldownSeconds.torpedo.toFixed(1)}s · ${telemetry.torpedoAmmo}`
          : `Torpedo (2) · ${telemetry.torpedoAmmo}`,
      );
      setTextIfChanged(
        tractorButton,
        telemetry.weaponCooldownSeconds.tractor > 0
          ? `Trator ${telemetry.weaponCooldownSeconds.tractor.toFixed(1)}s`
          : 'Raio trator (3)',
      );
      setAttributeIfChanged(scanButton, 'aria-pressed', telemetry.activeScan ? 'true' : 'false');
      const encounterEnded = telemetry.phase !== 'active';
      for (const button of combatActionButtons) {
        if (button === restartEncounterButton) continue;
        if (button.disabled !== encounterEnded) button.disabled = encounterEnded;
      }
      setHiddenIfChanged(restartEncounterButton, !encounterEnded);
      setAttributeIfChanged(root, 'data-combat-phase', telemetry.phase);
      setAttributeIfChanged(root, 'data-contact-awareness', telemetry.awareness);
      setAttributeIfChanged(
        root,
        'data-contact-observed',
        telemetry.observedNow ? 'true' : 'false',
      );
      setAttributeIfChanged(root, 'data-target-selected', telemetry.selected ? 'true' : 'false');
      setAttributeIfChanged(root, 'data-scan-active', telemetry.activeScan ? 'true' : 'false');
      setAttributeIfChanged(root, 'data-scan-progress', telemetry.scanProgress.toFixed(3));
      setAttributeIfChanged(
        root,
        'data-contact-distance',
        telemetry.distanceUnits?.toFixed(3) ?? 'unknown',
      );
      setAttributeIfChanged(root, 'data-torpedo-ammo', String(telemetry.torpedoAmmo));
      setAttributeIfChanged(root, 'data-projectile-count', String(telemetry.projectileCount));
      setAttributeIfChanged(
        root,
        'data-tractor-active',
        telemetry.tractorActive ? 'true' : 'false',
      );
      setAttributeIfChanged(
        root,
        'data-enemy-hull',
        telemetry.enemyHullPercent?.toFixed(3) ?? 'unknown',
      );
      setAttributeIfChanged(
        root,
        'data-enemy-condition',
        telemetry.enemyHullPercent === undefined
          ? 'unknown'
          : conditionLabel(telemetry.enemyHullPercent),
      );
      setAttributeIfChanged(
        root,
        'data-enemy-shields',
        telemetry.enemyShieldPercent?.toFixed(3) ?? 'unknown',
      );
      setAttributeIfChanged(root, 'data-enemy-ai', telemetry.enemyAiMode ?? 'unknown');
      const terminal = telemetry.phase !== 'active';
      setHiddenIfChanged(terminalBanner, !terminal);
      if (terminal) {
        setTextIfChanged(terminalTitle, telemetry.phase === 'victory' ? 'Vitória' : 'Derrota');
        setTextIfChanged(terminalMessage, telemetry.feedback);
      }
    },
    setEnergyTelemetry(telemetry) {
      const total = ENERGY_CHANNELS.reduce(
        (sum, channel) => sum + telemetry.allocation[channel],
        0,
      );
      const displayedAllocation = roundAllocationForDisplay(
        telemetry.allocation,
        telemetry.allocationCapacityUnits,
      );
      for (const channel of ENERGY_CHANNELS) {
        const value = allocationValues.get(channel);
        if (value !== undefined) {
          setTextIfChanged(value, `${displayedAllocation[channel].toFixed(1)}%`);
          setAttributeIfChanged(
            value,
            'title',
            `Potência efetiva: ${telemetry.channelEffectivePower[channel].toFixed(1)} unidades por segundo`,
          );
        }
        setAttributeIfChanged(
          root,
          `data-energy-${channel}`,
          telemetry.allocation[channel].toFixed(2),
        );
      }
      setTextIfChanged(
        energyTotal,
        `${total.toFixed(0)} / ${telemetry.allocationCapacityUnits.toFixed(0)}`,
      );
      setTextIfChanged(
        reactorValue,
        `${telemetry.reactorGeneratedUnitsPerSecond.toFixed(1)} u/s geradas · ${telemetry.deliveredUnitsPerSecond.toFixed(1)} u/s entregues`,
      );
      setTextIfChanged(reserveValue, `${telemetry.reservePercent.toFixed(0)}%`);
      const profileLabel =
        telemetry.profileId === 'custom'
          ? 'Personalizado'
          : {
              attack: 'Ataque',
              balanced: 'Equilibrado',
              defense: 'Defesa',
              escape: 'Fuga',
            }[telemetry.profileId];
      setTextIfChanged(
        energyFeedback,
        `Alocação conservada: ${total.toFixed(0)} de ${telemetry.allocationCapacityUnits.toFixed(0)}. Perfil ${profileLabel}.`,
      );
      for (const button of presetButtons) {
        setAttributeIfChanged(
          button,
          'aria-pressed',
          button.dataset.energyPreset === telemetry.profileId ? 'true' : 'false',
        );
      }
      setAttributeIfChanged(root, 'data-energy-profile', telemetry.profileId);
      setAttributeIfChanged(root, 'data-energy-total', total.toFixed(2));
    },
    setFps(fps) {
      setTextIfChanged(fpsValue, String(fps));
    },
    setGraphicsCapability(capability) {
      setTextIfChanged(rendererValue, capability.rendererName);
      setAttributeIfChanged(
        rendererValue,
        'title',
        `${capability.vendorName} · ${capability.rendererName}`,
      );
    },
    setFlightTelemetry(telemetry) {
      const { position } = telemetry;
      setTextIfChanged(speedValue, `${telemetry.speedUnitsPerSecond.toFixed(1)} u/s`);
      setTextIfChanged(
        positionValue,
        `${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}`,
      );
      setTextIfChanged(
        boundaryValue,
        `${Math.max(0, telemetry.boundaryDistanceUnits).toFixed(1)} u`,
      );
      setTextIfChanged(
        simulationValue,
        telemetry.paused
          ? telemetry.pauseReason === 'focus-lost'
            ? 'Pausada · foco perdido'
            : telemetry.pauseReason === 'mission-transition'
              ? 'Pausada · em trânsito'
              : telemetry.pauseReason === 'mission-complete'
                ? 'Atracada na base'
                : 'Pausada'
          : 'Em execução',
      );
      setTextIfChanged(frameTimeValue, `${telemetry.frameTimeMs.toFixed(1)} ms`);
      setTextIfChanged(
        drawCallsValue,
        `${telemetry.drawCalls} chamadas · ${telemetry.instancedObjects} inst. · ${telemetry.activeVfxCount} VFX`,
      );
      setTextIfChanged(lodValue, telemetry.lodLabel);
      setTextIfChanged(targetValue, telemetry.targetLabel);
      const hullCondition = conditionLabel(telemetry.hullPercent);
      setTextIfChanged(hullValue, `${telemetry.hullPercent.toFixed(0)}% · ${hullCondition}`);
      setAttributeIfChanged(root, 'data-player-condition', hullCondition);
      setTextIfChanged(
        shieldValue,
        `${telemetry.shieldPercent.toFixed(0)}% · +${telemetry.shieldRegenerationUnitsPerSecond.toFixed(1)}/s`,
      );
      setTextIfChanged(
        weaponValue,
        `${telemetry.weaponCapacitorPercent.toFixed(0)}% · +${telemetry.weaponRechargeUnitsPerSecond.toFixed(1)}/s`,
      );
      setTextIfChanged(heatValue, `${telemetry.weaponHeatPercent.toFixed(0)}%`);
      setTextIfChanged(sensorValue, `${telemetry.sensorRangeUnits.toFixed(0)} u`);
      const missionLocked =
        telemetry.pauseReason === 'mission-transition' ||
        telemetry.pauseReason === 'mission-complete';
      setTextIfChanged(
        pauseButton,
        missionLocked
          ? 'Controle de missão ativo'
          : telemetry.paused
            ? 'Retomar (P)'
            : 'Pausar (P)',
      );
      if (pauseButton.disabled !== missionLocked) pauseButton.disabled = missionLocked;
      setAttributeIfChanged(root, 'data-simulation-state', telemetry.paused ? 'paused' : 'running');
      setAttributeIfChanged(root, 'data-ship-x', position.x.toFixed(4));
      setAttributeIfChanged(root, 'data-ship-y', position.y.toFixed(4));
      setAttributeIfChanged(root, 'data-ship-z', position.z.toFixed(4));
      setAttributeIfChanged(root, 'data-ship-speed', telemetry.speedUnitsPerSecond.toFixed(4));
      setAttributeIfChanged(
        root,
        'data-engine-multiplier',
        telemetry.enginePerformanceMultiplier.toFixed(3),
      );
      setAttributeIfChanged(root, 'data-shield-charge', telemetry.shieldPercent.toFixed(3));
      setAttributeIfChanged(
        root,
        'data-weapon-charge',
        telemetry.weaponCapacitorPercent.toFixed(3),
      );
      setAttributeIfChanged(root, 'data-sensor-range', telemetry.sensorRangeUnits.toFixed(3));
      setAttributeIfChanged(root, 'data-active-vfx', String(telemetry.activeVfxCount));
      setAttributeIfChanged(root, 'data-draw-calls', String(telemetry.drawCalls));
    },
    setMissionTelemetry(telemetry) {
      setTextIfChanged(missionTitle, telemetry.title);
      setTextIfChanged(missionPhase, telemetry.phaseLabel);
      setTextIfChanged(objectiveText, telemetry.objective);
      setTextIfChanged(missionAction, telemetry.actionLabel);
      if (missionAction.disabled === telemetry.actionEnabled) {
        missionAction.disabled = !telemetry.actionEnabled;
      }
      setAttributeIfChanged(root, 'data-mission-phase', telemetry.phase);
      setAttributeIfChanged(
        root,
        'data-mission-target-identified',
        telemetry.identifiedTarget ? 'true' : 'false',
      );
      setAttributeIfChanged(root, 'data-mission-progress', telemetry.transitionProgress.toFixed(3));
    },
    setSaveStatus(telemetry) {
      const labels: Readonly<Record<SaveHudTelemetry['state'], string>> = {
        created: 'Save local criado.',
        disabled: 'Benchmark não altera o save.',
        error: 'Save indisponível; sessão segura ativa.',
        inactive: 'Save local não foi alterado.',
        invalid: 'Save inválido preservado; sessão segura ativa.',
        loaded: 'Progresso local retomado.',
        loading: 'Carregando save local…',
        migrated: 'Save atualizado para o formato atual.',
        saved: 'Progresso salvo neste dispositivo.',
      };
      setTextIfChanged(saveStatus, labels[telemetry.state]);
      setAttributeIfChanged(saveStatus, 'title', telemetry.detail ?? labels[telemetry.state]);
      const recoverable = telemetry.state === 'error' || telemetry.state === 'invalid';
      setHiddenIfChanged(saveRecovery, !recoverable);
      setTextIfChanged(
        saveRecovery,
        telemetry.state === 'invalid' ? 'Criar save seguro' : 'Tentar novamente',
      );
      setAttributeIfChanged(root, 'data-save-state', telemetry.state);
    },
    setFullscreenActive(active) {
      setAttributeIfChanged(root, 'data-fullscreen-state', active ? 'active' : 'inactive');
      setTextIfChanged(fullscreenButton, active ? 'Sair da tela cheia (F)' : 'Tela cheia (F)');
    },
    setPointerCaptured(active) {
      setAttributeIfChanged(root, 'data-pointer-state', active ? 'captured' : 'released');
      setTextIfChanged(captureButton, active ? 'Mouse capturado · Esc libera' : 'Capturar mouse');
      if (captureButton.disabled !== active) {
        captureButton.disabled = active;
      }
    },
    setPreset(preset) {
      setTextIfChanged(presetValue, preset.label);
    },
    showBlocked(value) {
      renderNotice(value, true);
      diagnosticsDrawer.open = true;
      root.dataset.appState = 'blocked';
      root.dataset.graphicsState = 'blocked';
      root.setAttribute('aria-busy', 'false');
      statusText.textContent = 'A cena 3D não pôde ser iniciada.';
      canvas.hidden = true;
    },
    showReady(readiness) {
      root.dataset.appState = 'ready';
      root.dataset.graphicsState = readiness.status;
      root.setAttribute('aria-busy', 'false');
      statusText.textContent =
        readiness.status === 'degraded'
          ? 'Arena pronta; confirme o renderizador para avaliar desempenho.'
          : 'Arena de voo pronta.';
      setHiddenIfChanged(flightHud, false);
      setHiddenIfChanged(energyPanel, false);
      setHiddenIfChanged(combatPanel, false);
    },
    showWarning(value) {
      renderNotice(value, false);
    },
  };
}
