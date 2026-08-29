import { describe, expect, it } from 'vitest';

import {
  createGameSaveEnvelope,
  createGameSavePayload,
  createLegacyGameSaveEnvelopeV1,
  decodeGameSave,
  GAME_SAVE_SCHEMA_VERSION,
} from './game-save';

const timestamp = '2026-08-29T20:00:00.000Z';

describe('game save schema', () => {
  it('serializa e valida o envelope atual com checksum', () => {
    const envelope = createGameSaveEnvelope(
      createGameSavePayload('mission-test', 'completed'),
      timestamp,
    );

    expect(envelope.schemaVersion).toBe(GAME_SAVE_SCHEMA_VERSION);
    expect(decodeGameSave(envelope)).toEqual({ envelope, status: 'ready' });
  });

  it('rejeita adulteração do payload sem checksum correspondente', () => {
    const envelope = createGameSaveEnvelope(
      createGameSavePayload('mission-test', 'briefing'),
      timestamp,
    );
    const tampered = {
      ...envelope,
      payload: createGameSavePayload('mission-test', 'completed'),
    };

    expect(decodeGameSave(tampered)).toEqual({
      reason: 'checksum-mismatch',
      status: 'invalid',
    });
  });

  it('migra sequencialmente o schema legado v1 para o atual', () => {
    const legacy = createLegacyGameSaveEnvelopeV1('mission-test', true, timestamp);
    const result = decodeGameSave(legacy);

    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    expect(result.migratedFromVersion).toBe(1);
    expect(result.envelope).toMatchObject({
      payload: { mission: { checkpoint: 'completed', missionId: 'mission-test' } },
      schemaVersion: 2,
    });
    expect(decodeGameSave(result.envelope).status).toBe('ready');
  });

  it('rejeita versão futura, timestamp e payload estruturalmente inválidos', () => {
    expect(decodeGameSave({ schemaVersion: 99 })).toEqual({
      reason: 'invalid-timestamp',
      status: 'invalid',
    });
    expect(
      decodeGameSave({
        checksum: 'x',
        payload: {},
        savedAtIso: timestamp,
        schemaVersion: 99,
      }),
    ).toEqual({ reason: 'unsupported-version', status: 'invalid' });
    expect(
      decodeGameSave({
        checksum: 'x',
        payload: { mission: { checkpoint: 'survey', missionId: 'mission-test' } },
        savedAtIso: timestamp,
        schemaVersion: 2,
      }),
    ).toEqual({ reason: 'invalid-payload', status: 'invalid' });
  });

  it('não cria envelopes com timestamp ou ID vazio', () => {
    expect(() => createGameSavePayload('', 'briefing')).toThrow('não pode ser vazio');
    expect(() =>
      createGameSaveEnvelope(createGameSavePayload('mission-test', 'briefing'), 'agora'),
    ).toThrow('timestamp ISO UTC válido');
  });
});
