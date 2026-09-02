import {
  createGameSettingsEnvelope,
  decodeGameSettings,
  type GameSettings,
  type GameSettingsEnvelope,
} from './game-settings';
import type { SettingsRepository } from './settings-repository';

export type SettingsControllerState =
  'defaulted' | 'error' | 'invalid' | 'loaded' | 'migrated' | 'reset' | 'saved';

export interface SettingsControllerStatus {
  readonly detail?: string;
  readonly state: SettingsControllerState;
}

export interface SettingsControllerResult {
  readonly settings: GameSettings;
  readonly status: SettingsControllerStatus;
}

export interface SettingsController {
  initialize(defaultSettings: GameSettings): SettingsControllerResult;
  reset(defaultSettings: GameSettings): SettingsControllerResult;
  save(settings: GameSettings): SettingsControllerResult;
}

function describeError(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'Falha de preferências sem detalhe técnico.';
}

export function createSettingsController(repository: SettingsRepository): SettingsController {
  let currentSettings: GameSettings | undefined;

  function persist(
    settings: GameSettings,
    state: Extract<SettingsControllerState, 'reset' | 'saved'>,
  ): SettingsControllerResult {
    let envelope: GameSettingsEnvelope;
    try {
      envelope = createGameSettingsEnvelope(settings);
    } catch (cause: unknown) {
      return {
        settings: currentSettings ?? settings,
        status: { detail: describeError(cause), state: 'invalid' },
      };
    }
    try {
      repository.save(envelope);
      currentSettings = envelope.settings;
      return { settings: currentSettings, status: { state } };
    } catch (cause: unknown) {
      const fallback = currentSettings ?? settings;
      return { settings: fallback, status: { detail: describeError(cause), state: 'error' } };
    }
  }

  return {
    initialize(defaultSettings) {
      currentSettings = createGameSettingsEnvelope(defaultSettings).settings;
      try {
        const raw = repository.load();
        if (raw === undefined) {
          return { settings: currentSettings, status: { state: 'defaulted' } };
        }
        const decoded = decodeGameSettings(raw);
        if (decoded.status === 'invalid') {
          return {
            settings: currentSettings,
            status: { detail: decoded.reason, state: 'invalid' },
          };
        }
        currentSettings = decoded.envelope.settings;
        if (decoded.status === 'migrated') {
          try {
            repository.save(decoded.envelope);
          } catch (cause: unknown) {
            return {
              settings: currentSettings,
              status: { detail: describeError(cause), state: 'error' },
            };
          }
          return { settings: currentSettings, status: { state: 'migrated' } };
        }
        return { settings: currentSettings, status: { state: 'loaded' } };
      } catch (cause: unknown) {
        return {
          settings: currentSettings,
          status: { detail: describeError(cause), state: 'error' },
        };
      }
    },
    reset(defaultSettings) {
      return persist(defaultSettings, 'reset');
    },
    save(settings) {
      return persist(settings, 'saved');
    },
  };
}
