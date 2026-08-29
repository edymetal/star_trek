export type ExplorationMissionPhase =
  'briefing' | 'outbound' | 'survey' | 'returning' | 'completed';

export type ExplorationMissionCheckpoint = Extract<
  ExplorationMissionPhase,
  'briefing' | 'completed'
>;

export interface ExplorationMissionDefinition {
  readonly id: string;
  readonly targetContactId: string;
  readonly travelDurationSeconds: number;
}

export interface ExplorationMissionSnapshot {
  readonly identifiedTarget: boolean;
  readonly missionId: string;
  readonly phase: ExplorationMissionPhase;
  readonly transitionProgress: number;
}

export interface ExplorationMissionSession {
  advance(deltaSeconds: number): ExplorationMissionSnapshot;
  beginReturn(): boolean;
  getSnapshot(): ExplorationMissionSnapshot;
  recordIdentifiedContact(contactId: string): boolean;
  start(): boolean;
}

export interface ExplorationMissionInitialState {
  readonly checkpoint: ExplorationMissionCheckpoint;
}

export function createExplorationMission(
  definition: ExplorationMissionDefinition,
  initialState: ExplorationMissionInitialState = { checkpoint: 'briefing' },
): ExplorationMissionSession {
  if (definition.travelDurationSeconds <= 0) {
    throw new Error('A duração da viagem da missão deve ser maior que zero.');
  }

  let phase: ExplorationMissionPhase = initialState.checkpoint;
  let identifiedTarget = phase === 'completed';
  let transitionElapsedSeconds = 0;

  function snapshot(): ExplorationMissionSnapshot {
    const transitionProgress =
      phase === 'outbound' || phase === 'returning'
        ? Math.min(1, transitionElapsedSeconds / definition.travelDurationSeconds)
        : phase === 'completed'
          ? 1
          : 0;
    return {
      identifiedTarget,
      missionId: definition.id,
      phase,
      transitionProgress,
    };
  }

  return {
    advance(deltaSeconds) {
      if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
        throw new Error('O avanço da missão requer um delta finito e não negativo.');
      }
      if (phase !== 'outbound' && phase !== 'returning') return snapshot();

      transitionElapsedSeconds += deltaSeconds;
      if (transitionElapsedSeconds >= definition.travelDurationSeconds) {
        phase = phase === 'outbound' ? 'survey' : 'completed';
        transitionElapsedSeconds = 0;
      }
      return snapshot();
    },
    beginReturn() {
      if (phase !== 'survey' || !identifiedTarget) return false;
      phase = 'returning';
      transitionElapsedSeconds = 0;
      return true;
    },
    getSnapshot: snapshot,
    recordIdentifiedContact(contactId) {
      if (phase !== 'survey' || contactId !== definition.targetContactId || identifiedTarget) {
        return false;
      }
      identifiedTarget = true;
      return true;
    },
    start() {
      if (phase !== 'briefing' && phase !== 'completed') return false;
      phase = 'outbound';
      identifiedTarget = false;
      transitionElapsedSeconds = 0;
      return true;
    },
  };
}
