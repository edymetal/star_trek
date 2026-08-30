import type { TutorialMissionCheckpoint } from '../domain/missions/tutorial-campaign';

export const GAME_SAVE_SCHEMA_VERSION = 2 as const;

export interface GameSavePayload {
  readonly mission: {
    readonly checkpoint: TutorialMissionCheckpoint;
    readonly missionId: string;
  };
}

export interface GameSaveEnvelope {
  readonly checksum: string;
  readonly payload: GameSavePayload;
  readonly savedAtIso: string;
  readonly schemaVersion: typeof GAME_SAVE_SCHEMA_VERSION;
}

export type DecodeGameSaveResult =
  | {
      readonly envelope: GameSaveEnvelope;
      readonly migratedFromVersion?: 1;
      readonly status: 'ready';
    }
  | {
      readonly reason:
        | 'checksum-mismatch'
        | 'invalid-envelope'
        | 'invalid-payload'
        | 'invalid-timestamp'
        | 'unsupported-version';
      readonly status: 'invalid';
    };

interface LegacyGameSavePayloadV1 {
  readonly missionCompleted: boolean;
  readonly missionId: string;
}

interface LegacyGameSaveEnvelopeV1 {
  readonly checksum: string;
  readonly payload: LegacyGameSavePayloadV1;
  readonly savedAtIso: string;
  readonly schemaVersion: 1;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
  );
}

function isMissionCheckpoint(value: unknown): value is TutorialMissionCheckpoint {
  return value === 'briefing' || value === 'completed';
}

function parseCurrentPayload(value: unknown): GameSavePayload | undefined {
  if (!isRecord(value) || !isRecord(value.mission)) return undefined;
  const missionId = value.mission.missionId;
  const checkpoint = value.mission.checkpoint;
  if (typeof missionId !== 'string' || missionId.length === 0 || !isMissionCheckpoint(checkpoint)) {
    return undefined;
  }
  return { mission: { checkpoint, missionId } };
}

function parseLegacyPayload(value: unknown): LegacyGameSavePayloadV1 | undefined {
  if (!isRecord(value)) return undefined;
  const missionId = value.missionId;
  const missionCompleted = value.missionCompleted;
  if (
    typeof missionId !== 'string' ||
    missionId.length === 0 ||
    typeof missionCompleted !== 'boolean'
  ) {
    return undefined;
  }
  return { missionCompleted, missionId };
}

function hashText(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function currentChecksum(savedAtIso: string, payload: GameSavePayload): string {
  return hashText(
    `${GAME_SAVE_SCHEMA_VERSION}|${savedAtIso}|${payload.mission.missionId}|${payload.mission.checkpoint}`,
  );
}

function legacyChecksum(savedAtIso: string, payload: LegacyGameSavePayloadV1): string {
  return hashText(
    `1|${savedAtIso}|${payload.missionId}|${payload.missionCompleted ? 'completed' : 'briefing'}`,
  );
}

export function createGameSavePayload(
  missionId: string,
  checkpoint: TutorialMissionCheckpoint,
): GameSavePayload {
  if (missionId.length === 0) throw new Error('O ID da missão do save não pode ser vazio.');
  return { mission: { checkpoint, missionId } };
}

export function createGameSaveEnvelope(
  payload: GameSavePayload,
  savedAtIso: string,
): GameSaveEnvelope {
  if (!isValidTimestamp(savedAtIso)) {
    throw new Error('O save requer um timestamp ISO UTC válido.');
  }
  return {
    checksum: currentChecksum(savedAtIso, payload),
    payload,
    savedAtIso,
    schemaVersion: GAME_SAVE_SCHEMA_VERSION,
  };
}

export function createLegacyGameSaveEnvelopeV1(
  missionId: string,
  missionCompleted: boolean,
  savedAtIso: string,
): LegacyGameSaveEnvelopeV1 {
  if (!isValidTimestamp(savedAtIso)) {
    throw new Error('O save legado requer um timestamp ISO UTC válido.');
  }
  const payload: LegacyGameSavePayloadV1 = { missionCompleted, missionId };
  return {
    checksum: legacyChecksum(savedAtIso, payload),
    payload,
    savedAtIso,
    schemaVersion: 1,
  };
}

export function decodeGameSave(value: unknown): DecodeGameSaveResult {
  if (!isRecord(value) || typeof value.schemaVersion !== 'number') {
    return { reason: 'invalid-envelope', status: 'invalid' };
  }
  if (!isValidTimestamp(value.savedAtIso)) {
    return { reason: 'invalid-timestamp', status: 'invalid' };
  }
  if (typeof value.checksum !== 'string') {
    return { reason: 'invalid-envelope', status: 'invalid' };
  }

  if (value.schemaVersion === 1) {
    const payload = parseLegacyPayload(value.payload);
    if (payload === undefined) return { reason: 'invalid-payload', status: 'invalid' };
    if (value.checksum !== legacyChecksum(value.savedAtIso, payload)) {
      return { reason: 'checksum-mismatch', status: 'invalid' };
    }
    const migratedPayload = createGameSavePayload(
      payload.missionId,
      payload.missionCompleted ? 'completed' : 'briefing',
    );
    return {
      envelope: createGameSaveEnvelope(migratedPayload, value.savedAtIso),
      migratedFromVersion: 1,
      status: 'ready',
    };
  }

  if (value.schemaVersion !== GAME_SAVE_SCHEMA_VERSION) {
    return { reason: 'unsupported-version', status: 'invalid' };
  }
  const payload = parseCurrentPayload(value.payload);
  if (payload === undefined) return { reason: 'invalid-payload', status: 'invalid' };
  if (value.checksum !== currentChecksum(value.savedAtIso, payload)) {
    return { reason: 'checksum-mismatch', status: 'invalid' };
  }
  return {
    envelope: createGameSaveEnvelope(payload, value.savedAtIso),
    status: 'ready',
  };
}
