import type { SettingsRepository } from '../application/settings-repository';

export const SETTINGS_STORAGE_KEY = 'stellar-command-game-settings';

export interface SettingsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function createLocalStorageSettingsRepository(
  storage: SettingsStorage = window.localStorage,
): SettingsRepository {
  return {
    load() {
      const serialized = storage.getItem(SETTINGS_STORAGE_KEY);
      if (serialized === null) return undefined;
      try {
        return JSON.parse(serialized) as unknown;
      } catch {
        return serialized;
      }
    },
    save(envelope) {
      storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(envelope));
    },
  };
}
