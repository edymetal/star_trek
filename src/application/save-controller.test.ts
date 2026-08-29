import { describe, expect, it } from 'vitest';

import {
  createGameSaveEnvelope,
  createGameSavePayload,
  createLegacyGameSaveEnvelopeV1,
  decodeGameSave,
  type GameSaveEnvelope,
} from './game-save';
import { createSaveController } from './save-controller';
import type { SaveRepository } from './save-repository';

const timestamp = '2026-08-29T20:00:00.000Z';
const defaultPayload = createGameSavePayload('mission-test', 'briefing');

class MemorySaveRepository implements SaveRepository {
  active: unknown | undefined;
  failLoad = false;
  failSave = false;
  readonly saved: GameSaveEnvelope[] = [];

  async loadActive(): Promise<unknown | undefined> {
    if (this.failLoad) throw new Error('leitura indisponível');
    return this.active;
  }

  async saveActive(envelope: GameSaveEnvelope): Promise<void> {
    if (this.failSave) throw new Error('quota indisponível');
    this.saved.push(envelope);
    this.active = envelope;
  }
}

function controller(repository: MemorySaveRepository) {
  return createSaveController({
    clock: { nowIso: () => timestamp },
    isPayloadSupported: (payload) => payload.mission.missionId === 'mission-test',
    repository,
  });
}

describe('createSaveController', () => {
  it('cria o primeiro save quando não existe progresso local', async () => {
    const repository = new MemorySaveRepository();
    const result = await controller(repository).initialize(defaultPayload);

    expect(result).toMatchObject({ payload: defaultPayload, status: { state: 'created' } });
    expect(repository.saved).toHaveLength(1);
    expect(decodeGameSave(repository.active).status).toBe('ready');
  });

  it('carrega o checkpoint atual sem regravar o snapshot', async () => {
    const repository = new MemorySaveRepository();
    repository.active = createGameSaveEnvelope(
      createGameSavePayload('mission-test', 'completed'),
      timestamp,
    );
    const result = await controller(repository).initialize(defaultPayload);

    expect(result).toMatchObject({
      payload: { mission: { checkpoint: 'completed' } },
      status: { state: 'loaded' },
    });
    expect(repository.saved).toHaveLength(0);
  });

  it('migra e regrava um save legado válido', async () => {
    const repository = new MemorySaveRepository();
    repository.active = createLegacyGameSaveEnvelopeV1('mission-test', true, timestamp);
    const result = await controller(repository).initialize(defaultPayload);

    expect(result).toMatchObject({
      payload: { mission: { checkpoint: 'completed' } },
      status: { state: 'migrated' },
    });
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]?.schemaVersion).toBe(2);
  });

  it('preserva save inválido, bloqueia autosave e só substitui após recuperação explícita', async () => {
    const repository = new MemorySaveRepository();
    repository.active = { checksum: 'inválido', schemaVersion: 2 };
    const saveController = controller(repository);

    const initialization = await saveController.initialize(defaultPayload);
    expect(initialization.status.state).toBe('invalid');
    expect((await saveController.save(defaultPayload)).state).toBe('invalid');
    expect(repository.saved).toHaveLength(0);

    expect((await saveController.recover(defaultPayload)).state).toBe('saved');
    expect(repository.saved).toHaveLength(1);
    expect((await saveController.save(defaultPayload)).state).toBe('saved');
    expect(repository.saved).toHaveLength(2);
  });

  it('abre sessão segura quando a leitura falha e permite tentar novamente', async () => {
    const repository = new MemorySaveRepository();
    repository.failLoad = true;
    const saveController = controller(repository);
    const initialization = await saveController.initialize(defaultPayload);

    expect(initialization).toMatchObject({
      payload: defaultPayload,
      status: { detail: 'leitura indisponível', state: 'error' },
    });
    repository.failLoad = false;
    expect((await saveController.recover(defaultPayload)).state).toBe('saved');
  });

  it('mantém o último save válido quando uma nova gravação falha', async () => {
    const repository = new MemorySaveRepository();
    repository.active = createGameSaveEnvelope(defaultPayload, timestamp);
    const saveController = controller(repository);
    await saveController.initialize(defaultPayload);
    repository.failSave = true;

    const status = await saveController.save(createGameSavePayload('mission-test', 'completed'));
    expect(status).toEqual({ detail: 'quota indisponível', state: 'error' });
    expect(decodeGameSave(repository.active)).toMatchObject({
      envelope: { payload: { mission: { checkpoint: 'briefing' } } },
      status: 'ready',
    });
  });
});
