import type { GameSaveEnvelope } from './game-save';

export interface SaveRepository {
  loadActive(): Promise<unknown | undefined>;
  saveActive(envelope: GameSaveEnvelope): Promise<void>;
}
