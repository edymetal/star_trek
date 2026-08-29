import type { GameSaveEnvelope } from '../application/game-save';
import type { SaveRepository } from '../application/save-repository';

export const GAME_SAVE_DATABASE_NAME = 'stellar-command-game-save';
export const GAME_SAVE_METADATA_STORE = 'metadata';
export const GAME_SAVE_SNAPSHOTS_STORE = 'snapshots';
export const GAME_SAVE_ACTIVE_KEY = 'active-game-save';

const DATABASE_VERSION = 1;
const MAXIMUM_SNAPSHOTS = 3;

interface ActiveSavePointer {
  readonly key: typeof GAME_SAVE_ACTIVE_KEY;
  readonly snapshotId: string;
}

interface StoredSaveSnapshot {
  readonly envelope: unknown;
  readonly id: string;
  readonly savedAtIso: string;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(GAME_SAVE_DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(GAME_SAVE_SNAPSHOTS_STORE)) {
        database.createObjectStore(GAME_SAVE_SNAPSHOTS_STORE, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(GAME_SAVE_METADATA_STORE)) {
        database.createObjectStore(GAME_SAVE_METADATA_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Falha ao abrir o banco de saves.'));
    request.onblocked = () =>
      reject(new Error('Atualização do banco de saves bloqueada por outra aba.'));
  });
}

function parsePointer(value: unknown): ActiveSavePointer | undefined {
  if (
    !isRecord(value) ||
    value.key !== GAME_SAVE_ACTIVE_KEY ||
    typeof value.snapshotId !== 'string'
  ) {
    return undefined;
  }
  return { key: GAME_SAVE_ACTIVE_KEY, snapshotId: value.snapshotId };
}

function parseStoredSnapshot(value: unknown): StoredSaveSnapshot | undefined {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.savedAtIso !== 'string' ||
    !('envelope' in value)
  ) {
    return undefined;
  }
  return { envelope: value.envelope, id: value.id, savedAtIso: value.savedAtIso };
}

function createSnapshotId(envelope: GameSaveEnvelope): string {
  return `${envelope.savedAtIso}-${globalThis.crypto.randomUUID()}`;
}

export function createIndexedDbSaveRepository(
  factory: IDBFactory = globalThis.indexedDB,
): SaveRepository {
  return {
    async loadActive() {
      if (factory === undefined) throw new Error('IndexedDB não está disponível neste navegador.');
      const database = await openDatabase(factory);
      return new Promise<unknown | undefined>((resolve, reject) => {
        let result: unknown | undefined;
        let failure: Error | undefined;
        const transaction = database.transaction(
          [GAME_SAVE_METADATA_STORE, GAME_SAVE_SNAPSHOTS_STORE],
          'readonly',
        );
        const pointerRequest = transaction
          .objectStore(GAME_SAVE_METADATA_STORE)
          .get(GAME_SAVE_ACTIVE_KEY);
        pointerRequest.onsuccess = () => {
          if (pointerRequest.result === undefined) return;
          const pointer = parsePointer(pointerRequest.result as unknown);
          if (pointer === undefined) {
            failure = new Error('A referência do save ativo está corrompida.');
            transaction.abort();
            return;
          }
          const snapshotRequest = transaction
            .objectStore(GAME_SAVE_SNAPSHOTS_STORE)
            .get(pointer.snapshotId);
          snapshotRequest.onsuccess = () => {
            const snapshot = parseStoredSnapshot(snapshotRequest.result as unknown);
            if (snapshot === undefined) {
              failure = new Error('O snapshot indicado pelo save ativo não foi encontrado.');
              transaction.abort();
              return;
            }
            result = snapshot.envelope;
          };
        };
        transaction.oncomplete = () => {
          database.close();
          resolve(result);
        };
        transaction.onerror = () => {
          database.close();
          reject(transaction.error ?? failure ?? new Error('Falha ao ler o save local.'));
        };
        transaction.onabort = () => {
          database.close();
          reject(failure ?? transaction.error ?? new Error('Leitura do save local cancelada.'));
        };
      });
    },
    async saveActive(envelope) {
      if (factory === undefined) throw new Error('IndexedDB não está disponível neste navegador.');
      const database = await openDatabase(factory);
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(
          [GAME_SAVE_METADATA_STORE, GAME_SAVE_SNAPSHOTS_STORE],
          'readwrite',
        );
        const snapshotStore = transaction.objectStore(GAME_SAVE_SNAPSHOTS_STORE);
        const metadataStore = transaction.objectStore(GAME_SAVE_METADATA_STORE);
        const existingRequest = snapshotStore.getAll();
        existingRequest.onsuccess = () => {
          const snapshotId = createSnapshotId(envelope);
          const snapshot: StoredSaveSnapshot = {
            envelope,
            id: snapshotId,
            savedAtIso: envelope.savedAtIso,
          };
          snapshotStore.put(snapshot);
          const pointer: ActiveSavePointer = {
            key: GAME_SAVE_ACTIVE_KEY,
            snapshotId,
          };
          metadataStore.put(pointer);

          const rawExisting: unknown = existingRequest.result;
          const existing = Array.isArray(rawExisting)
            ? rawExisting
                .map((value: unknown) => parseStoredSnapshot(value))
                .filter((value): value is StoredSaveSnapshot => value !== undefined)
                .sort((left, right) => right.savedAtIso.localeCompare(left.savedAtIso))
            : [];
          for (const obsolete of existing.slice(MAXIMUM_SNAPSHOTS - 1)) {
            snapshotStore.delete(obsolete.id);
          }
        };
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => {
          database.close();
          reject(transaction.error ?? new Error('Falha ao gravar o save local.'));
        };
        transaction.onabort = () => {
          database.close();
          reject(transaction.error ?? new Error('Gravação do save local cancelada.'));
        };
      });
    },
  };
}
