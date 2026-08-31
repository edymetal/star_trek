import { describe, expect, it } from 'vitest';

import {
  createDefaultGameSettings,
  createGameSettingsEnvelope,
  type GameSettingsEnvelope,
} from './game-settings';
import { createSettingsController } from './settings-controller';
import type { SettingsRepository } from './settings-repository';

class MemorySettingsRepository implements SettingsRepository {
  failLoad = false;
  failSave = false;
  raw: unknown | undefined;
  readonly saved: GameSettingsEnvelope[] = [];

  load(): unknown | undefined {
    if (this.failLoad) throw new Error('preferências indisponíveis');
    return this.raw;
  }

  save(envelope: GameSettingsEnvelope): void {
    if (this.failSave) throw new Error('quota de preferências indisponível');
    this.saved.push(envelope);
    this.raw = envelope;
  }
}

describe('createSettingsController', () => {
  it('usa defaults sem gravar quando ainda não há preferências', () => {
    const repository = new MemorySettingsRepository();
    const defaults = createDefaultGameSettings('low');
    const result = createSettingsController(repository).initialize(defaults);

    expect(result).toEqual({ settings: defaults, status: { state: 'defaulted' } });
    expect(repository.saved).toHaveLength(0);
  });

  it('carrega, altera e restaura preferências sem tocar outro repositório', () => {
    const repository = new MemorySettingsRepository();
    const defaults = createDefaultGameSettings('medium');
    repository.raw = createGameSettingsEnvelope({ ...defaults, hudScalePercent: 110 });
    const controller = createSettingsController(repository);

    expect(controller.initialize(defaults)).toMatchObject({
      settings: { hudScalePercent: 110 },
      status: { state: 'loaded' },
    });
    expect(
      controller.save({ ...defaults, mouseSensitivity: 1.4, reduceFlashes: true }),
    ).toMatchObject({ status: { state: 'saved' } });
    expect(controller.reset(defaults)).toEqual({ settings: defaults, status: { state: 'reset' } });
    expect(repository.saved).toHaveLength(2);
  });

  it('recupera configuração inválida com defaults e permite restauração explícita', () => {
    const repository = new MemorySettingsRepository();
    repository.raw = { schemaVersion: 1, settings: { hudScalePercent: 999 } };
    const defaults = createDefaultGameSettings('low');
    const controller = createSettingsController(repository);

    expect(controller.initialize(defaults)).toEqual({
      settings: defaults,
      status: { detail: 'invalid-settings', state: 'invalid' },
    });
    expect(repository.raw).toEqual({ schemaVersion: 1, settings: { hudScalePercent: 999 } });
    expect(controller.reset(defaults)).toEqual({ settings: defaults, status: { state: 'reset' } });
  });

  it('mantém a última configuração válida quando armazenamento falha', () => {
    const repository = new MemorySettingsRepository();
    const defaults = createDefaultGameSettings('high');
    const controller = createSettingsController(repository);
    controller.initialize(defaults);
    repository.failSave = true;

    expect(controller.save({ ...defaults, masterVolumePercent: 20 })).toEqual({
      settings: defaults,
      status: { detail: 'quota de preferências indisponível', state: 'error' },
    });
  });
});
