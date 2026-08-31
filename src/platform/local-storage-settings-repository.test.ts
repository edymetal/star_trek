import { describe, expect, it } from 'vitest';

import {
  createDefaultGameSettings,
  createGameSettingsEnvelope,
} from '../application/game-settings';
import {
  createLocalStorageSettingsRepository,
  SETTINGS_STORAGE_KEY,
  type SettingsStorage,
} from './local-storage-settings-repository';

class MemoryStorage implements SettingsStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('createLocalStorageSettingsRepository', () => {
  it('usa uma chave exclusiva e faz round-trip do envelope', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageSettingsRepository(storage);
    const envelope = createGameSettingsEnvelope(createDefaultGameSettings('medium'));

    expect(repository.load()).toBeUndefined();
    repository.save(envelope);
    expect(storage.values.has(SETTINGS_STORAGE_KEY)).toBe(true);
    expect(repository.load()).toEqual(envelope);
  });

  it('devolve JSON malformado como entrada inválida para validação da aplicação', () => {
    const storage = new MemoryStorage();
    storage.values.set(SETTINGS_STORAGE_KEY, '{configuração quebrada');

    expect(createLocalStorageSettingsRepository(storage).load()).toBe('{configuração quebrada');
  });
});
