import type { GraphicsPresetId } from '../content/graphics-presets';

export const GAME_SETTINGS_SCHEMA_VERSION = 2 as const;

export const REMAPPABLE_CONTROL_IDS = [
  'select-target',
  'toggle-scan',
  'beam',
  'torpedo',
  'tractor',
] as const;

export type RemappableControlId = (typeof REMAPPABLE_CONTROL_IDS)[number];
export type ParticleDensity = 'full' | 'minimal' | 'reduced';

export interface GameSettings {
  readonly audioMuted: boolean;
  readonly ambienceVolumePercent: number;
  readonly controlBindings: Readonly<Record<RemappableControlId, string>>;
  readonly effectsVolumePercent: number;
  readonly graphicsPresetId: GraphicsPresetId;
  readonly hudScalePercent: number;
  readonly invertVerticalLook: boolean;
  readonly masterVolumePercent: number;
  readonly mouseSensitivity: number;
  readonly particleDensity: ParticleDensity;
  readonly reduceCameraShake: boolean;
  readonly reduceFlashes: boolean;
}

export interface GameSettingsEnvelope {
  readonly schemaVersion: typeof GAME_SETTINGS_SCHEMA_VERSION;
  readonly settings: GameSettings;
}

export type DecodeGameSettingsResult =
  | { readonly envelope: GameSettingsEnvelope; readonly status: 'ready' }
  | { readonly envelope: GameSettingsEnvelope; readonly status: 'migrated' }
  | {
      readonly reason: 'invalid-envelope' | 'invalid-settings' | 'unsupported-version';
      readonly status: 'invalid';
    };

export const REMAPPABLE_KEY_OPTIONS = [
  { code: 'Digit1', label: '1' },
  { code: 'Digit2', label: '2' },
  { code: 'Digit3', label: '3' },
  { code: 'Digit4', label: '4' },
  { code: 'Digit5', label: '5' },
  { code: 'Digit6', label: '6' },
  { code: 'KeyG', label: 'G' },
  { code: 'KeyH', label: 'H' },
  { code: 'KeyI', label: 'I' },
  { code: 'KeyJ', label: 'J' },
  { code: 'KeyK', label: 'K' },
  { code: 'KeyL', label: 'L' },
  { code: 'KeyO', label: 'O' },
  { code: 'KeyR', label: 'R' },
  { code: 'KeyT', label: 'T' },
  { code: 'KeyU', label: 'U' },
  { code: 'KeyY', label: 'Y' },
] as const;

const REMAPPABLE_CODES = new Set<string>(REMAPPABLE_KEY_OPTIONS.map(({ code }) => code));
const REMAPPABLE_KEY_LABELS = new Map<string, string>(
  REMAPPABLE_KEY_OPTIONS.map(({ code, label }) => [code, label]),
);
const HUD_SCALES = new Set([90, 100, 110]);

export function controlBindingLabel(code: string): string {
  return REMAPPABLE_KEY_LABELS.get(code) ?? code;
}

export function formatControlHints(
  value: string,
  bindings: Readonly<Record<RemappableControlId, string>>,
): string {
  return REMAPPABLE_CONTROL_IDS.reduce(
    (formatted, controlId) =>
      formatted.replaceAll(`{${controlId}}`, controlBindingLabel(bindings[controlId])),
    value,
  );
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isGraphicsPresetId(value: unknown): value is GraphicsPresetId {
  return value === 'low' || value === 'medium' || value === 'high';
}

function isParticleDensity(value: unknown): value is ParticleDensity {
  return value === 'full' || value === 'minimal' || value === 'reduced';
}

function isVolume(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100;
}

function isMouseSensitivity(value: unknown): value is number {
  if (typeof value !== 'number' || value < 0.5 || value > 2) return false;
  return Math.abs(value * 10 - Math.round(value * 10)) < Number.EPSILON * 16;
}

function parseControlBindings(
  value: unknown,
): Readonly<Record<RemappableControlId, string>> | undefined {
  if (!isRecord(value)) return undefined;
  const entries = REMAPPABLE_CONTROL_IDS.map((id) => [id, value[id]] as const);
  if (entries.some(([, code]) => typeof code !== 'string' || !REMAPPABLE_CODES.has(code))) {
    return undefined;
  }
  const codes = entries.map(([, code]) => code as string);
  if (new Set(codes).size !== codes.length) return undefined;
  return Object.fromEntries(entries) as Readonly<Record<RemappableControlId, string>>;
}

type GameSettingsV1 = Omit<GameSettings, 'audioMuted'>;

function parseGameSettingsV1(value: unknown): GameSettingsV1 | undefined {
  if (!isRecord(value)) return undefined;
  const controlBindings = parseControlBindings(value.controlBindings);
  if (
    controlBindings === undefined ||
    !isGraphicsPresetId(value.graphicsPresetId) ||
    typeof value.hudScalePercent !== 'number' ||
    !HUD_SCALES.has(value.hudScalePercent) ||
    !isVolume(value.masterVolumePercent) ||
    !isVolume(value.effectsVolumePercent) ||
    !isVolume(value.ambienceVolumePercent) ||
    typeof value.reduceFlashes !== 'boolean' ||
    typeof value.reduceCameraShake !== 'boolean' ||
    !isParticleDensity(value.particleDensity) ||
    !isMouseSensitivity(value.mouseSensitivity) ||
    typeof value.invertVerticalLook !== 'boolean'
  ) {
    return undefined;
  }
  return {
    ambienceVolumePercent: value.ambienceVolumePercent,
    controlBindings,
    effectsVolumePercent: value.effectsVolumePercent,
    graphicsPresetId: value.graphicsPresetId,
    hudScalePercent: value.hudScalePercent,
    invertVerticalLook: value.invertVerticalLook,
    masterVolumePercent: value.masterVolumePercent,
    mouseSensitivity: value.mouseSensitivity,
    particleDensity: value.particleDensity,
    reduceCameraShake: value.reduceCameraShake,
    reduceFlashes: value.reduceFlashes,
  };
}

export function parseGameSettings(value: unknown): GameSettings | undefined {
  if (!isRecord(value) || typeof value.audioMuted !== 'boolean') return undefined;
  const legacySettings = parseGameSettingsV1(value);
  return legacySettings === undefined
    ? undefined
    : { ...legacySettings, audioMuted: value.audioMuted };
}

export function createDefaultGameSettings(graphicsPresetId: GraphicsPresetId): GameSettings {
  return {
    audioMuted: false,
    ambienceVolumePercent: 65,
    controlBindings: {
      beam: 'Digit1',
      'select-target': 'KeyT',
      'toggle-scan': 'KeyR',
      torpedo: 'Digit2',
      tractor: 'Digit3',
    },
    effectsVolumePercent: 85,
    graphicsPresetId,
    hudScalePercent: 100,
    invertVerticalLook: false,
    masterVolumePercent: 80,
    mouseSensitivity: 1,
    particleDensity: 'full',
    reduceCameraShake: false,
    reduceFlashes: false,
  };
}

export function createGameSettingsEnvelope(settings: GameSettings): GameSettingsEnvelope {
  const parsed = parseGameSettings(settings);
  if (parsed === undefined) throw new Error('As configurações contêm valor inválido ou conflito.');
  return { schemaVersion: GAME_SETTINGS_SCHEMA_VERSION, settings: parsed };
}

export function decodeGameSettings(value: unknown): DecodeGameSettingsResult {
  if (!isRecord(value) || typeof value.schemaVersion !== 'number') {
    return { reason: 'invalid-envelope', status: 'invalid' };
  }
  if (value.schemaVersion === 1) {
    const settings = parseGameSettingsV1(value.settings);
    if (settings === undefined) return { reason: 'invalid-settings', status: 'invalid' };
    return {
      envelope: createGameSettingsEnvelope({ ...settings, audioMuted: false }),
      status: 'migrated',
    };
  }
  if (value.schemaVersion !== GAME_SETTINGS_SCHEMA_VERSION) {
    return { reason: 'unsupported-version', status: 'invalid' };
  }
  const settings = parseGameSettings(value.settings);
  if (settings === undefined) return { reason: 'invalid-settings', status: 'invalid' };
  return { envelope: createGameSettingsEnvelope(settings), status: 'ready' };
}
