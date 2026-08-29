import { createGameSaveEnvelope, decodeGameSave, type GameSavePayload } from './game-save';
import type { SaveRepository } from './save-repository';

export type SaveControllerState = 'created' | 'error' | 'invalid' | 'loaded' | 'migrated' | 'saved';

export interface SaveControllerStatus {
  readonly detail?: string;
  readonly state: SaveControllerState;
}

export interface SaveInitializationResult {
  readonly payload: GameSavePayload;
  readonly status: SaveControllerStatus;
}

export interface SaveController {
  initialize(defaultPayload: GameSavePayload): Promise<SaveInitializationResult>;
  recover(payload: GameSavePayload): Promise<SaveControllerStatus>;
  save(payload: GameSavePayload): Promise<SaveControllerStatus>;
}

export interface SaveClock {
  nowIso(): string;
}

export interface SaveControllerOptions {
  readonly clock: SaveClock;
  readonly isPayloadSupported: (payload: GameSavePayload) => boolean;
  readonly repository: SaveRepository;
}

function describeError(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'Falha de armazenamento sem detalhe técnico.';
}

export function createSaveController(options: SaveControllerOptions): SaveController {
  let writesBlocked = false;
  let blockedStatus: SaveControllerStatus = {
    detail: 'A persistência ainda não foi inicializada.',
    state: 'error',
  };
  let saveQueue: Promise<void> = Promise.resolve();

  function enqueue(operation: () => Promise<SaveControllerStatus>): Promise<SaveControllerStatus> {
    const result = saveQueue.then(operation, operation);
    saveQueue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  async function persist(
    payload: GameSavePayload,
    successState: Extract<SaveControllerState, 'created' | 'migrated' | 'saved'>,
  ): Promise<SaveControllerStatus> {
    try {
      const envelope = createGameSaveEnvelope(payload, options.clock.nowIso());
      await options.repository.saveActive(envelope);
      writesBlocked = false;
      blockedStatus = { state: successState };
      return blockedStatus;
    } catch (cause: unknown) {
      writesBlocked = true;
      blockedStatus = { detail: describeError(cause), state: 'error' };
      return blockedStatus;
    }
  }

  return {
    async initialize(defaultPayload) {
      try {
        const rawSave = await options.repository.loadActive();
        if (rawSave === undefined) {
          const status = await persist(defaultPayload, 'created');
          return { payload: defaultPayload, status };
        }
        const decoded = decodeGameSave(rawSave);
        if (decoded.status === 'invalid') {
          writesBlocked = true;
          blockedStatus = { detail: decoded.reason, state: 'invalid' };
          return { payload: defaultPayload, status: blockedStatus };
        }
        if (!options.isPayloadSupported(decoded.envelope.payload)) {
          writesBlocked = true;
          blockedStatus = { detail: 'unsupported-content', state: 'invalid' };
          return { payload: defaultPayload, status: blockedStatus };
        }
        if (decoded.migratedFromVersion !== undefined) {
          const status = await persist(decoded.envelope.payload, 'migrated');
          return { payload: decoded.envelope.payload, status };
        }
        writesBlocked = false;
        blockedStatus = { state: 'loaded' };
        return { payload: decoded.envelope.payload, status: blockedStatus };
      } catch (cause: unknown) {
        writesBlocked = true;
        blockedStatus = { detail: describeError(cause), state: 'error' };
        return { payload: defaultPayload, status: blockedStatus };
      }
    },
    recover(payload) {
      return enqueue(() => persist(payload, 'saved'));
    },
    save(payload) {
      if (writesBlocked) return Promise.resolve(blockedStatus);
      return enqueue(() => persist(payload, 'saved'));
    },
  };
}
