import type { GameSettingsEnvelope } from './game-settings';

export interface SettingsRepository {
  load(): unknown | undefined;
  save(envelope: GameSettingsEnvelope): void;
}
