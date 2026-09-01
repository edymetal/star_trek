import type { GraphicsPreset } from '../content/graphics-presets';
import type { ArenaPresentationDto } from '../application/arena-presentation';
import {
  controlBindingLabel,
  REMAPPABLE_CONTROL_IDS,
  REMAPPABLE_KEY_OPTIONS,
  type GameSettings,
  type RemappableControlId,
} from '../application/game-settings';
import type { SettingsControllerStatus } from '../application/settings-controller';
import type { SessionMenuView } from '../application/session-menu';
import type { ShieldSectorState, SubsystemIntegrity } from '../domain/combat/damage';
import type { EnemyAiMode } from '../domain/combat/enemy-ai';
import type { ContactAwareness } from '../domain/combat/sensors';
import type { EquipmentId } from '../domain/combat/weapons';
import {
  ENERGY_CHANNELS,
  type EnergyAllocation,
  type EnergyChannelId,
  type EnergyPresetId,
} from '../domain/energy/energy-system';
import type { GraphicsCapability, GraphicsReadiness } from '../domain/graphics-readiness';
import type { Vector3Value } from '../domain/flight/ship-flight';
import type { TutorialMissionPhase } from '../domain/missions/tutorial-campaign';
import type { NavigationMode, NavigationNodeKind } from '../domain/navigation/system-navigation';
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
  bindNavigationControls(handlers: NavigationControlHandlers): () => void;
  bindBaseControls(handlers: BaseControlHandlers): () => void;
  bindMainMenuControls(handlers: MainMenuControlHandlers): () => void;
  bindSettingsControls(handlers: SettingsControlHandlers): () => void;
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
  setNavigationTelemetry(telemetry: NavigationHudTelemetry): void;
  setBaseTelemetry(telemetry: BaseHudTelemetry): void;
  setMainMenuTelemetry(telemetry: MainMenuHudTelemetry): void;
  setNewTrainingConfirmation(open: boolean): void;
  setSaveStatus(telemetry: SaveHudTelemetry): void;
  setSettingsTelemetry(telemetry: SettingsHudTelemetry): void;
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

export interface NavigationControlHandlers {
  readonly onCloseMap: () => void;
  readonly onConfirmTravel: () => void;
  readonly onOpenMap: () => void;
  readonly onSelectDestination: (nodeId: string) => void;
}

export interface BaseControlHandlers {
  readonly onOpenMenu: () => void;
  readonly onPrepareMission: () => void;
}

export interface MainMenuControlHandlers {
  readonly onBack: () => void;
  readonly onClose: () => void;
  readonly onConfirmNewTraining: () => void;
  readonly onContinue: () => void;
  readonly onNewTraining: () => void;
  readonly onOpenView: (view: Exclude<SessionMenuView, 'home'>) => void;
}

export interface SettingsControlHandlers {
  readonly onChange: (settings: GameSettings) => void;
  readonly onReset: () => void;
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
  readonly campaignCompleted: boolean;
  readonly missionCount: number;
  readonly missionId: string;
  readonly missionNumber: number;
  readonly objective: string;
  readonly objectiveCompleted: boolean;
  readonly phase: TutorialMissionPhase;
  readonly phaseLabel: string;
  readonly title: string;
  readonly transitionProgress: number;
}

export interface NavigationMapNodeTelemetry {
  readonly id: string;
  readonly isCurrentLocation: boolean;
  readonly isMissionDestination: boolean;
  readonly isSelected: boolean;
  readonly kind: NavigationNodeKind;
  readonly label: string;
  readonly summary: string;
}

export interface NavigationHudTelemetry {
  readonly canConfirmTravel: boolean;
  readonly currentLocationLabel: string;
  readonly guidance: string;
  readonly mapNodes: readonly NavigationMapNodeTelemetry[];
  readonly mode: NavigationMode;
  readonly routeDetail: string;
  readonly routeLabel: string;
  readonly systemLabel: string;
  readonly travelProgress: number;
}

export interface BaseMissionHudTelemetry {
  readonly id: string;
  readonly status: 'completed' | 'current' | 'locked';
  readonly title: string;
}

export interface BaseHudTelemetry {
  readonly energyLabel: string;
  readonly integrityLabel: string;
  readonly missions: readonly BaseMissionHudTelemetry[];
  readonly nextMissionTitle: string;
  readonly nextObjective: string;
  readonly prepareLabel: string;
  readonly serviceLabel: string;
  readonly torpedoLabel: string;
  readonly visible: boolean;
}

export interface MainMenuHudTelemetry {
  readonly canClose: boolean;
  readonly canContinue: boolean;
  readonly progressLabel: string;
  readonly saveDetail: string;
  readonly statusLabel: string;
  readonly view: 'closed' | 'loading' | SessionMenuView;
}

export interface SettingsHudTelemetry {
  readonly activePresetId: GraphicsPreset['id'];
  readonly settings: GameSettings;
  readonly status: SettingsControllerStatus | { readonly state: 'disabled' };
}

export interface CombatHudTelemetry {
  readonly activeScan: boolean;
  readonly allowedPlayerEquipment: readonly EquipmentId[];
  readonly awareness: ContactAwareness;
  readonly contactLabel: string;
  readonly distanceUnits?: number;
  readonly disposition: 'hostile' | 'passive';
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
    | 'focus-lost'
    | 'manual'
    | 'mission-base'
    | 'mission-complete'
    | 'mission-transition'
    | undefined;
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

function isMainMenuDetailView(
  value: string | undefined,
): value is Exclude<SessionMenuView, 'home'> {
  return value === 'credits' || value === 'diagnostics' || value === 'settings';
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

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      element.closest('[hidden], [inert]') === null && element.getClientRects().length > 0,
  );
}

function trapFocus(event: KeyboardEvent, container: HTMLElement): void {
  if (event.code !== 'Tab') return;
  const elements = focusableElements(container);
  const first = elements[0];
  const last = elements.at(-1);
  if (first === undefined || last === undefined) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
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
  const politeAnnouncement = requireElement<HTMLElement>(root, '[data-live-polite]');
  const urgentAnnouncement = requireElement<HTMLElement>(root, '[data-live-urgent]');
  const mainMenu = requireElement<HTMLElement>(root, '[data-main-menu]');
  const mainMenuViews = new Map<string, HTMLElement>(
    Array.from(mainMenu.querySelectorAll<HTMLElement>('[data-main-menu-view]')).map((element) => [
      element.dataset.mainMenuView ?? '',
      element,
    ]),
  );
  const mainMenuStatusChip = requireElement<HTMLElement>(mainMenu, '[data-main-menu-status-chip]');
  const mainMenuProgress = requireElement<HTMLElement>(mainMenu, '[data-main-menu-progress]');
  const mainMenuSaveDetail = requireElement<HTMLElement>(mainMenu, '[data-main-menu-save-detail]');
  const mainMenuContinue = requireElement<HTMLButtonElement>(mainMenu, '[data-main-menu-continue]');
  const mainMenuNew = requireElement<HTMLButtonElement>(mainMenu, '[data-main-menu-new]');
  const mainMenuClose = requireElement<HTMLButtonElement>(mainMenu, '[data-main-menu-close]');
  const mainMenuViewButtons = Array.from(
    mainMenu.querySelectorAll<HTMLButtonElement>('[data-main-menu-open]'),
  );
  const mainMenuBackButtons = Array.from(
    mainMenu.querySelectorAll<HTMLButtonElement>('[data-main-menu-back]'),
  );
  const mainMenuBackend = requireElement<HTMLElement>(mainMenu, '[data-main-menu-backend]');
  const mainMenuRenderer = requireElement<HTMLElement>(mainMenu, '[data-main-menu-renderer]');
  const mainMenuDiagnosticPreset = requireElement<HTMLElement>(
    mainMenu,
    '[data-main-menu-diagnostic-preset]',
  );
  const mainMenuFps = requireElement<HTMLElement>(mainMenu, '[data-main-menu-fps]');
  const settingsForm = requireElement<HTMLFormElement>(mainMenu, '[data-settings-form]');
  const settingsStatus = requireElement<HTMLElement>(mainMenu, '[data-settings-status]');
  const settingsReset = requireElement<HTMLButtonElement>(mainMenu, '[data-settings-reset]');
  const graphicsPresetSetting = requireElement<HTMLSelectElement>(
    settingsForm,
    '[data-setting="graphicsPresetId"]',
  );
  const hudScaleSetting = requireElement<HTMLSelectElement>(
    settingsForm,
    '[data-setting="hudScalePercent"]',
  );
  const masterVolumeSetting = requireElement<HTMLInputElement>(
    settingsForm,
    '[data-setting="masterVolumePercent"]',
  );
  const effectsVolumeSetting = requireElement<HTMLInputElement>(
    settingsForm,
    '[data-setting="effectsVolumePercent"]',
  );
  const ambienceVolumeSetting = requireElement<HTMLInputElement>(
    settingsForm,
    '[data-setting="ambienceVolumePercent"]',
  );
  const reduceFlashesSetting = requireElement<HTMLInputElement>(
    settingsForm,
    '[data-setting="reduceFlashes"]',
  );
  const reduceCameraShakeSetting = requireElement<HTMLInputElement>(
    settingsForm,
    '[data-setting="reduceCameraShake"]',
  );
  const particleDensitySetting = requireElement<HTMLSelectElement>(
    settingsForm,
    '[data-setting="particleDensity"]',
  );
  const mouseSensitivitySetting = requireElement<HTMLInputElement>(
    settingsForm,
    '[data-setting="mouseSensitivity"]',
  );
  const invertVerticalLookSetting = requireElement<HTMLInputElement>(
    settingsForm,
    '[data-setting="invertVerticalLook"]',
  );
  const masterVolumeOutput = requireElement<HTMLOutputElement>(
    settingsForm,
    '[data-setting-output="masterVolumePercent"]',
  );
  const effectsVolumeOutput = requireElement<HTMLOutputElement>(
    settingsForm,
    '[data-setting-output="effectsVolumePercent"]',
  );
  const ambienceVolumeOutput = requireElement<HTMLOutputElement>(
    settingsForm,
    '[data-setting-output="ambienceVolumePercent"]',
  );
  const mouseSensitivityOutput = requireElement<HTMLOutputElement>(
    settingsForm,
    '[data-setting-output="mouseSensitivity"]',
  );
  const bindingSettings = Object.fromEntries(
    REMAPPABLE_CONTROL_IDS.map((id) => [
      id,
      requireElement<HTMLSelectElement>(settingsForm, `[data-setting-binding="${id}"]`),
    ]),
  ) as Readonly<Record<RemappableControlId, HTMLSelectElement>>;
  for (const select of Object.values(bindingSettings)) {
    select.replaceChildren(
      ...REMAPPABLE_KEY_OPTIONS.map(({ code, label }) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = label;
        return option;
      }),
    );
  }
  const newTrainingDialog = requireElement<HTMLDialogElement>(root, '[data-new-training-dialog]');
  const newTrainingCancel = requireElement<HTMLButtonElement>(
    newTrainingDialog,
    '[data-new-training-cancel]',
  );
  const newTrainingConfirm = requireElement<HTMLButtonElement>(
    newTrainingDialog,
    '[data-new-training-confirm]',
  );
  const objectiveCard = requireElement<HTMLElement>(root, '.objective-card');
  const centerReticle = requireElement<HTMLElement>(root, '[data-center-reticle]');
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
  const baseDashboard = requireElement<HTMLElement>(root, '[data-base-dashboard]');
  const baseService = requireElement<HTMLElement>(baseDashboard, '[data-base-service]');
  const baseIntegrity = requireElement<HTMLElement>(baseDashboard, '[data-base-integrity]');
  const baseEnergy = requireElement<HTMLElement>(baseDashboard, '[data-base-energy]');
  const baseTorpedoes = requireElement<HTMLElement>(baseDashboard, '[data-base-torpedoes]');
  const baseNextMission = requireElement<HTMLElement>(baseDashboard, '[data-base-next-mission]');
  const baseNextObjective = requireElement<HTMLElement>(
    baseDashboard,
    '[data-base-next-objective]',
  );
  const baseMissions = requireElement<HTMLOListElement>(baseDashboard, '[data-base-missions]');
  const basePrepare = requireElement<HTMLButtonElement>(baseDashboard, '[data-base-prepare]');
  const baseMenu = requireElement<HTMLButtonElement>(baseDashboard, '[data-base-menu]');
  const systemMap = requireElement<HTMLElement>(root, '[data-system-map]');
  const systemMapTitle = requireElement<HTMLElement>(systemMap, '[data-system-map-title]');
  const navigationDestinations = requireElement<HTMLElement>(
    systemMap,
    '[data-navigation-destinations]',
  );
  const navigationRoute = requireElement<HTMLElement>(systemMap, '[data-navigation-route]');
  const navigationRouteDetail = requireElement<HTMLElement>(
    systemMap,
    '[data-navigation-route-detail]',
  );
  const navigationGuidance = requireElement<HTMLElement>(systemMap, '[data-navigation-guidance]');
  const navigationClose = requireElement<HTMLButtonElement>(systemMap, '[data-navigation-close]');
  const navigationConfirm = requireElement<HTMLButtonElement>(
    systemMap,
    '[data-navigation-confirm]',
  );
  const travelPresentation = requireElement<HTMLElement>(root, '[data-travel-presentation]');
  const travelTitle = requireElement<HTMLElement>(travelPresentation, '[data-travel-title]');
  const travelRoute = requireElement<HTMLElement>(travelPresentation, '[data-travel-route]');
  const travelProgress = requireElement<HTMLProgressElement>(
    travelPresentation,
    '[data-travel-progress]',
  );
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
  const navigationOpen = requireElement<HTMLButtonElement>(flightHud, '[data-navigation-open]');
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
  let lastBaseMissionsKey = '';
  let lastNavigationNodesKey = '';
  let lastMainMenuView = 'loading';
  let lastNavigationMode: NavigationMode | undefined;
  let lastMissionTelemetry: MissionHudTelemetry | undefined;
  let lastMissionAnnouncementKey = '';
  let lastPoliteAnnouncementKey = '';
  let lastUrgentAnnouncementKey = '';
  let lastCombatFeedback = '';
  let lastCombatPhase: CombatHudTelemetry['phase'] | undefined;
  let mainMenuWasOpen = true;
  let mapWasOpen = false;
  let activeControlBindings: GameSettings['controlBindings'] = {
    beam: 'Digit1',
    'select-target': 'KeyT',
    'toggle-scan': 'KeyR',
    torpedo: 'Digit2',
    tractor: 'Digit3',
  };
  let latestCombatTelemetry: CombatHudTelemetry | undefined;
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

  const announce = (priority: 'polite' | 'urgent', key: string, message: string): void => {
    if (message.length === 0) return;
    if (priority === 'polite') {
      if (key === lastPoliteAnnouncementKey) return;
      lastPoliteAnnouncementKey = key;
      setTextIfChanged(politeAnnouncement, message);
    } else {
      if (key === lastUrgentAnnouncementKey) return;
      lastUrgentAnnouncementKey = key;
      setTextIfChanged(urgentAnnouncement, message);
    }
    setAttributeIfChanged(root, 'data-last-announcement', priority);
    setAttributeIfChanged(root, 'data-last-announcement-key', key);
  };

  const announceMissionIfVisible = (): void => {
    const telemetry = lastMissionTelemetry;
    if (telemetry === undefined || !mainMenu.hidden) return;
    const key = `${telemetry.missionId}|${telemetry.phase}|${telemetry.objectiveCompleted}`;
    if (key === lastMissionAnnouncementKey) return;
    lastMissionAnnouncementKey = key;
    announce(
      'polite',
      `mission|${key}`,
      `${telemetry.title}. ${telemetry.phaseLabel}. Objetivo: ${telemetry.objective}`,
    );
  };

  const tacticalKey = (controlId: RemappableControlId): string =>
    controlBindingLabel(activeControlBindings[controlId]);
  const setTacticalShortcut = (button: HTMLButtonElement, controlId: RemappableControlId): void =>
    setAttributeIfChanged(button, 'aria-keyshortcuts', tacticalKey(controlId));
  const renderTacticalButtonLabels = (): void => {
    const telemetry = latestCombatTelemetry;
    setTextIfChanged(selectTargetButton, `Selecionar (${tacticalKey('select-target')})`);
    setTextIfChanged(scanButton, `Scan (${tacticalKey('toggle-scan')})`);
    setTextIfChanged(
      beamButton,
      telemetry !== undefined && telemetry.weaponCooldownSeconds.beam > 0
        ? `Feixe ${telemetry.weaponCooldownSeconds.beam.toFixed(1)}s`
        : `Feixe (${tacticalKey('beam')})`,
    );
    setTextIfChanged(
      torpedoButton,
      telemetry !== undefined && telemetry.weaponCooldownSeconds.torpedo > 0
        ? `Torpedo ${telemetry.weaponCooldownSeconds.torpedo.toFixed(1)}s · ${telemetry.torpedoAmmo}`
        : `Torpedo (${tacticalKey('torpedo')})${telemetry === undefined ? '' : ` · ${telemetry.torpedoAmmo}`}`,
    );
    setTextIfChanged(
      tractorButton,
      telemetry !== undefined && telemetry.weaponCooldownSeconds.tractor > 0
        ? `Trator ${telemetry.weaponCooldownSeconds.tractor.toFixed(1)}s`
        : `Raio trator (${tacticalKey('tractor')})`,
    );
    for (const [button, controlId] of [
      [selectTargetButton, 'select-target'],
      [scanButton, 'toggle-scan'],
      [beamButton, 'beam'],
      [torpedoButton, 'torpedo'],
      [tractorButton, 'tractor'],
    ] as const) {
      setTacticalShortcut(button, controlId);
    }
  };

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

  function syncSettingsOutputs(): void {
    masterVolumeOutput.value = `${masterVolumeSetting.value}%`;
    effectsVolumeOutput.value = `${effectsVolumeSetting.value}%`;
    ambienceVolumeOutput.value = `${ambienceVolumeSetting.value}%`;
    mouseSensitivityOutput.value = `${Number(mouseSensitivitySetting.value).toLocaleString(
      'pt-BR',
      {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      },
    )}×`;
  }

  function readSettingsForm(): GameSettings {
    return {
      ambienceVolumePercent: Number(ambienceVolumeSetting.value),
      controlBindings: Object.fromEntries(
        REMAPPABLE_CONTROL_IDS.map((id) => [id, bindingSettings[id].value]),
      ) as Readonly<Record<RemappableControlId, string>>,
      effectsVolumePercent: Number(effectsVolumeSetting.value),
      graphicsPresetId: graphicsPresetSetting.value as GameSettings['graphicsPresetId'],
      hudScalePercent: Number(hudScaleSetting.value),
      invertVerticalLook: invertVerticalLookSetting.checked,
      masterVolumePercent: Number(masterVolumeSetting.value),
      mouseSensitivity: Number(mouseSensitivitySetting.value),
      particleDensity: particleDensitySetting.value as GameSettings['particleDensity'],
      reduceCameraShake: reduceCameraShakeSetting.checked,
      reduceFlashes: reduceFlashesSetting.checked,
    };
  }

  return {
    canvas,
    fullscreenTarget: root,
    bindBaseControls(handlers) {
      const prepareListener = (): void => handlers.onPrepareMission();
      const menuListener = (): void => handlers.onOpenMenu();
      basePrepare.addEventListener('click', prepareListener);
      baseMenu.addEventListener('click', menuListener);
      return () => {
        basePrepare.removeEventListener('click', prepareListener);
        baseMenu.removeEventListener('click', menuListener);
      };
    },
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
    bindMainMenuControls(handlers) {
      const continueListener = (): void => handlers.onContinue();
      const newListener = (): void => handlers.onNewTraining();
      const closeListener = (): void => handlers.onClose();
      const confirmListener = (): void => handlers.onConfirmNewTraining();
      const backListener = (): void => handlers.onBack();
      const viewListeners = mainMenuViewButtons.map((button) => {
        const listener = (): void => {
          const view = button.dataset.mainMenuOpen;
          if (isMainMenuDetailView(view)) handlers.onOpenView(view);
        };
        button.addEventListener('click', listener);
        return { button, listener };
      });
      const keyboardListener = (event: KeyboardEvent): void => {
        if (mainMenu.hidden || newTrainingDialog.open) return;
        if (event.code === 'Escape') {
          event.preventDefault();
          handlers.onBack();
          return;
        }
        trapFocus(event, mainMenu);
      };
      mainMenuContinue.addEventListener('click', continueListener);
      mainMenuNew.addEventListener('click', newListener);
      mainMenuClose.addEventListener('click', closeListener);
      newTrainingConfirm.addEventListener('click', confirmListener);
      for (const button of mainMenuBackButtons) button.addEventListener('click', backListener);
      window.addEventListener('keydown', keyboardListener);
      return () => {
        mainMenuContinue.removeEventListener('click', continueListener);
        mainMenuNew.removeEventListener('click', newListener);
        mainMenuClose.removeEventListener('click', closeListener);
        newTrainingConfirm.removeEventListener('click', confirmListener);
        for (const button of mainMenuBackButtons) button.removeEventListener('click', backListener);
        for (const { button, listener } of viewListeners) {
          button.removeEventListener('click', listener);
        }
        window.removeEventListener('keydown', keyboardListener);
      };
    },
    bindSettingsControls(handlers) {
      const changeListener = (): void => handlers.onChange(readSettingsForm());
      const inputListener = (): void => syncSettingsOutputs();
      const resetListener = (): void => handlers.onReset();
      settingsForm.addEventListener('change', changeListener);
      settingsForm.addEventListener('input', inputListener);
      settingsReset.addEventListener('click', resetListener);
      return () => {
        settingsForm.removeEventListener('change', changeListener);
        settingsForm.removeEventListener('input', inputListener);
        settingsReset.removeEventListener('click', resetListener);
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
    bindNavigationControls(handlers) {
      const openListener = (): void => handlers.onOpenMap();
      const closeListener = (): void => handlers.onCloseMap();
      const confirmListener = (): void => handlers.onConfirmTravel();
      const destinationListener = (event: MouseEvent): void => {
        if (!(event.target instanceof Element)) return;
        const button = event.target.closest<HTMLButtonElement>('[data-navigation-destination]');
        const nodeId = button?.dataset.navigationDestination;
        if (nodeId !== undefined) handlers.onSelectDestination(nodeId);
      };
      const keyboardListener = (event: KeyboardEvent): void => {
        if (systemMap.hidden) return;
        if (event.code === 'Escape') {
          event.preventDefault();
          handlers.onCloseMap();
          return;
        }
        trapFocus(event, systemMap);
      };
      navigationOpen.addEventListener('click', openListener);
      navigationClose.addEventListener('click', closeListener);
      navigationConfirm.addEventListener('click', confirmListener);
      navigationDestinations.addEventListener('click', destinationListener);
      window.addEventListener('keydown', keyboardListener);
      return () => {
        navigationOpen.removeEventListener('click', openListener);
        navigationClose.removeEventListener('click', closeListener);
        navigationConfirm.removeEventListener('click', confirmListener);
        navigationDestinations.removeEventListener('click', destinationListener);
        window.removeEventListener('keydown', keyboardListener);
      };
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
    setBaseTelemetry(telemetry) {
      setHiddenIfChanged(baseDashboard, !telemetry.visible);
      setTextIfChanged(baseService, telemetry.serviceLabel);
      setTextIfChanged(baseIntegrity, telemetry.integrityLabel);
      setTextIfChanged(baseEnergy, telemetry.energyLabel);
      setTextIfChanged(baseTorpedoes, telemetry.torpedoLabel);
      setTextIfChanged(baseNextMission, telemetry.nextMissionTitle);
      setTextIfChanged(baseNextObjective, telemetry.nextObjective);
      setTextIfChanged(basePrepare, telemetry.prepareLabel);
      const missionsKey = telemetry.missions
        .map(({ id, status, title }) => `${id}|${status}|${title}`)
        .join('||');
      if (missionsKey !== lastBaseMissionsKey) {
        baseMissions.replaceChildren(
          ...telemetry.missions.map((mission) => {
            const item = document.createElement('li');
            item.dataset.baseMissionId = mission.id;
            item.dataset.baseMissionStatus = mission.status;
            const title = document.createElement('strong');
            title.textContent = mission.title;
            const status = document.createElement('span');
            status.textContent =
              mission.status === 'completed'
                ? 'Concluída'
                : mission.status === 'current'
                  ? 'Missão atual'
                  : 'Bloqueada';
            item.append(title, status);
            return item;
          }),
        );
        lastBaseMissionsKey = missionsKey;
      }
      setAttributeIfChanged(
        root,
        'data-base-dashboard-state',
        telemetry.visible ? 'visible' : 'hidden',
      );
    },
    setBackend(label) {
      setTextIfChanged(backendValue, label);
      setTextIfChanged(mainMenuBackend, label);
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
      announce('polite', `feedback|${message}`, message);
    },
    setCombatTelemetry(telemetry) {
      latestCombatTelemetry = telemetry;
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
        telemetry.enemyAiMode === undefined
          ? 'Não identificada'
          : telemetry.disposition === 'passive'
            ? 'Não hostil · cooperando'
            : aiLabels[telemetry.enemyAiMode],
      );
      const shields = telemetry.playerShieldSectorsPercent;
      for (const [sector, value] of shieldSectorValues) {
        setTextIfChanged(value, shields[sector].toFixed(0));
        const sectorLabel = {
          front: 'frontal',
          port: 'de bombordo',
          rear: 'traseiro',
          starboard: 'de estibordo',
        }[sector];
        setAttributeIfChanged(
          value,
          'aria-label',
          `Escudo ${sectorLabel}: ${shields[sector].toFixed(0)} por cento`,
        );
      }
      const systems = telemetry.playerSubsystems;
      setTextIfChanged(
        combatSubsystems,
        `MOT ${(systems.engines * 100).toFixed(0)} · ARM ${(systems.weapons * 100).toFixed(0)} · ESC ${(systems.shields * 100).toFixed(0)} · SEN ${(systems.sensors * 100).toFixed(0)}`,
      );
      setAttributeIfChanged(
        combatSubsystems,
        'aria-label',
        `Motores ${(systems.engines * 100).toFixed(0)} por cento; armas ${(systems.weapons * 100).toFixed(0)} por cento; escudos ${(systems.shields * 100).toFixed(0)} por cento; sensores ${(systems.sensors * 100).toFixed(0)} por cento`,
      );
      setTextIfChanged(combatFeedback, telemetry.feedback);
      renderTacticalButtonLabels();
      if (telemetry.feedback !== lastCombatFeedback) {
        lastCombatFeedback = telemetry.feedback;
        if (!combatPanel.hidden && mainMenu.hidden) {
          announce('polite', `combat-feedback|${telemetry.feedback}`, telemetry.feedback);
        }
      }
      setAttributeIfChanged(scanButton, 'aria-pressed', telemetry.activeScan ? 'true' : 'false');
      const encounterEnded = telemetry.phase !== 'active';
      for (const button of combatActionButtons) {
        if (button === restartEncounterButton) continue;
        if (button.disabled !== encounterEnded) button.disabled = encounterEnded;
      }
      for (const [equipmentId, button] of [
        ['beam', beamButton],
        ['torpedo', torpedoButton],
        ['tractor', tractorButton],
      ] as const) {
        const disabled = encounterEnded || !telemetry.allowedPlayerEquipment.includes(equipmentId);
        if (button.disabled !== disabled) button.disabled = disabled;
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
      setAttributeIfChanged(root, 'data-encounter-disposition', telemetry.disposition);
      setAttributeIfChanged(
        root,
        'data-allowed-equipment',
        telemetry.allowedPlayerEquipment.join(','),
      );
      const terminal = telemetry.phase !== 'active';
      setHiddenIfChanged(terminalBanner, !terminal);
      if (terminal) {
        setTextIfChanged(terminalTitle, telemetry.phase === 'victory' ? 'Vitória' : 'Derrota');
        setTextIfChanged(terminalMessage, telemetry.feedback);
      }
      if (
        lastCombatPhase !== undefined &&
        telemetry.phase !== lastCombatPhase &&
        terminal &&
        !combatPanel.hidden &&
        mainMenu.hidden
      ) {
        announce(
          telemetry.phase === 'defeat' ? 'urgent' : 'polite',
          `combat-phase|${telemetry.phase}`,
          `${phaseLabel}. ${telemetry.feedback}`,
        );
      }
      lastCombatPhase = telemetry.phase;
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
          const channelLabel = {
            auxiliary: 'auxiliares e sensores',
            engines: 'motores',
            shields: 'escudos',
            weapons: 'armas',
          }[channel];
          setAttributeIfChanged(
            value,
            'title',
            `Potência efetiva: ${telemetry.channelEffectivePower[channel].toFixed(1)} unidades por segundo`,
          );
          setAttributeIfChanged(
            value,
            'aria-label',
            `Energia de ${channelLabel}: ${displayedAllocation[channel].toFixed(1)} por cento; potência efetiva ${telemetry.channelEffectivePower[channel].toFixed(1)} unidades por segundo`,
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
      setTextIfChanged(mainMenuFps, String(fps));
    },
    setGraphicsCapability(capability) {
      setTextIfChanged(rendererValue, capability.rendererName);
      setTextIfChanged(mainMenuRenderer, capability.rendererName);
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
              : telemetry.pauseReason === 'mission-base'
                ? 'Atracada na Base Aurora'
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
        telemetry.pauseReason === 'mission-complete' ||
        telemetry.pauseReason === 'mission-base';
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
      lastMissionTelemetry = telemetry;
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
        'data-mission-objective-completed',
        telemetry.objectiveCompleted ? 'true' : 'false',
      );
      setAttributeIfChanged(root, 'data-mission-id', telemetry.missionId);
      setAttributeIfChanged(root, 'data-mission-number', String(telemetry.missionNumber));
      setAttributeIfChanged(root, 'data-mission-count', String(telemetry.missionCount));
      setAttributeIfChanged(
        root,
        'data-tutorial-completed',
        telemetry.campaignCompleted ? 'true' : 'false',
      );
      setAttributeIfChanged(root, 'data-mission-progress', telemetry.transitionProgress.toFixed(3));
      announceMissionIfVisible();
    },
    setMainMenuTelemetry(telemetry) {
      const menuOpen = telemetry.view !== 'closed';
      setHiddenIfChanged(mainMenu, !menuOpen);
      if (menuOpen) {
        for (const [view, element] of mainMenuViews) {
          setHiddenIfChanged(element, view !== telemetry.view);
        }
      }
      setTextIfChanged(mainMenuStatusChip, telemetry.statusLabel);
      setTextIfChanged(mainMenuProgress, telemetry.progressLabel);
      setTextIfChanged(mainMenuSaveDetail, telemetry.saveDetail);
      mainMenuContinue.disabled = !telemetry.canContinue;
      setTextIfChanged(
        mainMenuContinue,
        telemetry.canClose ? 'Voltar à Base Aurora' : 'Continuar treinamento',
      );
      setHiddenIfChanged(mainMenuClose, !telemetry.canClose);

      const gameplaySurfaces = [
        canvas,
        travelPresentation,
        systemMap,
        objectiveCard,
        baseDashboard,
        flightHud,
        combatPanel,
        energyPanel,
        diagnosticsDrawer,
        terminalBanner,
      ];
      for (const surface of gameplaySurfaces) surface.inert = menuOpen;
      setAttributeIfChanged(root, 'data-menu-state', menuOpen ? telemetry.view : 'closed');

      if (menuOpen && (!mainMenuWasOpen || lastMainMenuView !== telemetry.view)) {
        if (telemetry.view === 'home') {
          (telemetry.canContinue ? mainMenuContinue : mainMenuNew).focus();
        } else if (telemetry.view !== 'loading') {
          const view = mainMenuViews.get(telemetry.view);
          view
            ?.querySelector<HTMLElement>(
              telemetry.view === 'settings' ? '[data-setting]' : '[data-main-menu-back]',
            )
            ?.focus();
        }
      } else if (!menuOpen && mainMenuWasOpen) {
        basePrepare.focus();
      }
      lastMainMenuView = telemetry.view;
      mainMenuWasOpen = menuOpen;
      if (!menuOpen) announceMissionIfVisible();
    },
    setNavigationTelemetry(telemetry) {
      const mapOpen = telemetry.mode === 'map';
      const travelling = telemetry.mode === 'travel';
      const encounterActive = telemetry.mode === 'encounter';
      setHiddenIfChanged(systemMap, !mapOpen);
      setHiddenIfChanged(travelPresentation, !travelling);
      setHiddenIfChanged(combatPanel, !encounterActive);
      setHiddenIfChanged(centerReticle, !encounterActive);
      if (!encounterActive) {
        setHiddenIfChanged(targetTracker, true);
        setHiddenIfChanged(targetLine, true);
      }

      setTextIfChanged(systemMapTitle, telemetry.systemLabel);
      setTextIfChanged(navigationRoute, telemetry.routeLabel);
      setTextIfChanged(navigationRouteDetail, telemetry.routeDetail);
      setTextIfChanged(navigationGuidance, telemetry.guidance);
      setTextIfChanged(travelTitle, telemetry.routeLabel);
      setTextIfChanged(travelRoute, telemetry.routeDetail);
      if (travelProgress.value !== telemetry.travelProgress) {
        travelProgress.value = telemetry.travelProgress;
      }
      if (navigationConfirm.disabled === telemetry.canConfirmTravel) {
        navigationConfirm.disabled = !telemetry.canConfirmTravel;
      }

      const nodesKey = telemetry.mapNodes
        .map(
          (node) =>
            `${node.id}|${node.label}|${node.summary}|${node.kind}|${node.isCurrentLocation}|${node.isMissionDestination}|${node.isSelected}`,
        )
        .join('||');
      if (nodesKey !== lastNavigationNodesKey) {
        navigationDestinations.replaceChildren(
          ...telemetry.mapNodes.map((node) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'system-map-node';
            button.dataset.navigationDestination = node.id;
            button.dataset.navigationKind = node.kind;
            button.dataset.missionDestination = node.isMissionDestination ? 'true' : 'false';
            button.setAttribute('aria-pressed', node.isSelected ? 'true' : 'false');
            if (node.isCurrentLocation) button.disabled = true;
            const heading = document.createElement('strong');
            heading.textContent = node.label;
            const summary = document.createElement('span');
            summary.textContent = node.summary;
            const status = document.createElement('small');
            status.textContent = node.isCurrentLocation
              ? 'LOCAL ATUAL'
              : node.isMissionDestination
                ? 'DESTINO DA MISSÃO'
                : node.kind === 'point-of-interest'
                  ? 'PONTO DE INTERESSE'
                  : 'SETOR DE MISSÃO';
            button.append(heading, summary, status);
            return button;
          }),
        );
        lastNavigationNodesKey = nodesKey;
      }

      setHiddenIfChanged(navigationOpen, telemetry.mode !== 'base');
      captureButton.disabled = !encounterActive;
      const backgroundPanels = [
        canvas,
        objectiveCard,
        baseDashboard,
        flightHud,
        combatPanel,
        energyPanel,
        diagnosticsDrawer,
        terminalBanner,
      ];
      const menuOpen = root.dataset.menuState !== undefined && root.dataset.menuState !== 'closed';
      for (const panel of backgroundPanels) panel.inert = mapOpen || menuOpen;

      setAttributeIfChanged(root, 'data-navigation-state', telemetry.mode);
      setAttributeIfChanged(root, 'data-current-location', telemetry.currentLocationLabel);
      setAttributeIfChanged(root, 'data-travel-progress', telemetry.travelProgress.toFixed(3));

      if (mapOpen && !mapWasOpen) {
        const preferred = navigationDestinations.querySelector<HTMLButtonElement>(
          '[data-mission-destination="true"]',
        );
        (preferred ?? navigationClose).focus();
      } else if (!mapOpen && mapWasOpen && telemetry.mode === 'base') {
        navigationOpen.focus();
      } else if (!menuOpen && telemetry.mode !== lastNavigationMode) {
        if (travelling) travelPresentation.focus();
        else if (encounterActive) canvas.focus();
        else if (telemetry.mode === 'base') basePrepare.focus();
      }
      mapWasOpen = mapOpen;
      lastNavigationMode = telemetry.mode;
    },
    setNewTrainingConfirmation(open) {
      if (open && !newTrainingDialog.open) {
        newTrainingDialog.showModal();
        newTrainingCancel.focus();
      } else if (!open && newTrainingDialog.open) {
        newTrainingDialog.close();
        mainMenuNew.focus();
      }
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
    setSettingsTelemetry(telemetry) {
      const { settings } = telemetry;
      graphicsPresetSetting.value = settings.graphicsPresetId;
      hudScaleSetting.value = String(settings.hudScalePercent);
      masterVolumeSetting.value = String(settings.masterVolumePercent);
      effectsVolumeSetting.value = String(settings.effectsVolumePercent);
      ambienceVolumeSetting.value = String(settings.ambienceVolumePercent);
      reduceFlashesSetting.checked = settings.reduceFlashes;
      reduceCameraShakeSetting.checked = settings.reduceCameraShake;
      particleDensitySetting.value = settings.particleDensity;
      mouseSensitivitySetting.value = String(settings.mouseSensitivity);
      invertVerticalLookSetting.checked = settings.invertVerticalLook;
      for (const id of REMAPPABLE_CONTROL_IDS) {
        bindingSettings[id].value = settings.controlBindings[id];
      }
      activeControlBindings = settings.controlBindings;
      renderTacticalButtonLabels();
      syncSettingsOutputs();

      const requiresReload = settings.graphicsPresetId !== telemetry.activePresetId;
      const statusLabels: Readonly<Record<SettingsHudTelemetry['status']['state'], string>> = {
        defaulted: 'Padrões seguros ativos. A primeira alteração será salva neste dispositivo.',
        disabled: 'Preferências locais desativadas durante o benchmark.',
        error:
          'Não foi possível gravar as preferências. Os últimos valores válidos continuam ativos.',
        invalid:
          'Configuração inválida detectada. Padrões seguros foram aplicados; restaure ou altere uma opção para substituir o registro.',
        loaded: 'Preferências locais carregadas.',
        reset: 'Padrões restaurados e salvos.',
        saved: 'Preferências salvas e aplicadas.',
      };
      setTextIfChanged(
        settingsStatus,
        requiresReload
          ? `${statusLabels[telemetry.status.state]} Recarregue para aplicar o preset gráfico.`
          : statusLabels[telemetry.status.state],
      );
      settingsStatus.dataset.settingsStatus = telemetry.status.state;
      settingsStatus.dataset.requiresReload = String(requiresReload);
      root.style.setProperty('--hud-scale', String(settings.hudScalePercent / 100));
      setAttributeIfChanged(root, 'data-hud-scale', String(settings.hudScalePercent));
      setAttributeIfChanged(root, 'data-particle-density', settings.particleDensity);
      setAttributeIfChanged(root, 'data-reduce-camera-shake', String(settings.reduceCameraShake));
      setAttributeIfChanged(root, 'data-reduce-flashes', String(settings.reduceFlashes));
      setAttributeIfChanged(root, 'data-settings-state', telemetry.status.state);
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
      setTextIfChanged(mainMenuDiagnosticPreset, preset.label);
      setAttributeIfChanged(root, 'data-graphics-preset', preset.id);
    },
    showBlocked(value) {
      renderNotice(value, true);
      setHiddenIfChanged(mainMenu, true);
      if (newTrainingDialog.open) newTrainingDialog.close();
      diagnosticsDrawer.open = true;
      root.dataset.appState = 'blocked';
      root.dataset.graphicsState = 'blocked';
      root.dataset.menuState = 'blocked';
      root.setAttribute('aria-busy', 'false');
      statusText.textContent = 'A cena 3D não pôde ser iniciada.';
      canvas.hidden = true;
      retryButton.focus();
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
      setHiddenIfChanged(combatPanel, root.dataset.navigationState !== 'encounter');
    },
    showWarning(value) {
      renderNotice(value, false);
    },
  };
}
