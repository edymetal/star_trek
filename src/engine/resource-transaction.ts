export type ResourceCleanup = () => void;

export interface ResourceTransaction {
  commit(): ResourceCleanup;
  defer(cleanup: ResourceCleanup): ResourceCleanup;
  rollback(): void;
}

interface CleanupEntry {
  active: boolean;
  readonly cleanup: ResourceCleanup;
}

export function createResourceTransaction(): ResourceTransaction {
  const entries: CleanupEntry[] = [];
  let committed = false;
  let settled = false;

  const cleanupAll = (): void => {
    if (settled) {
      return;
    }
    settled = true;
    let firstError: unknown;
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const entry = entries[index];
      if (entry?.active !== true) {
        continue;
      }
      entry.active = false;
      try {
        entry.cleanup();
      } catch (cause: unknown) {
        firstError ??= cause;
      }
    }
    if (firstError !== undefined) {
      throw firstError;
    }
  };

  return {
    commit() {
      if (committed || settled) {
        throw new Error('A transação de recursos já foi encerrada.');
      }
      committed = true;
      return cleanupAll;
    },
    defer(cleanup) {
      if (committed || settled) {
        throw new Error('Não é possível registrar recurso em uma transação encerrada.');
      }
      const entry: CleanupEntry = { active: true, cleanup };
      entries.push(entry);
      return () => {
        entry.active = false;
      };
    },
    rollback: cleanupAll,
  };
}
