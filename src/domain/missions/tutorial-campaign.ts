export type TutorialMissionPhase =
  'briefing' | 'outbound' | 'objective' | 'returning' | 'completed';

export type TutorialMissionCheckpoint = Extract<TutorialMissionPhase, 'briefing' | 'completed'>;

export type TutorialObjectiveType = 'identify-contact' | 'tractor-lock' | 'combat-victory';

export interface TutorialMissionDefinition {
  readonly destinationNodeId: string;
  readonly id: string;
  readonly objectiveType: TutorialObjectiveType;
  readonly targetContactId: string;
  readonly travelDurationSeconds: number;
}

export type TutorialObjectiveEvent =
  | { readonly contactId: string; readonly type: 'contact-identified' }
  | { readonly contactId: string; readonly type: 'tractor-activated' }
  | { readonly contactId: string; readonly type: 'combat-won' };

export interface TutorialCampaignSnapshot {
  readonly campaignCompleted: boolean;
  readonly completedMissionCount: number;
  readonly missionCount: number;
  readonly missionId: string;
  readonly missionNumber: number;
  readonly objectiveCompleted: boolean;
  readonly objectiveType: TutorialObjectiveType;
  readonly phase: TutorialMissionPhase;
  readonly transitionProgress: number;
}

export interface TutorialCampaignSession {
  advance(deltaSeconds: number): TutorialCampaignSnapshot;
  beginReturn(): boolean;
  continueFromCompletion(): boolean;
  getSnapshot(): TutorialCampaignSnapshot;
  recordObjective(event: TutorialObjectiveEvent): boolean;
  reset(): TutorialCampaignSnapshot;
  start(): boolean;
}

export interface TutorialCampaignInitialState {
  readonly checkpoint: TutorialMissionCheckpoint;
  readonly missionId: string;
}

function objectiveMatches(
  objectiveType: TutorialObjectiveType,
  event: TutorialObjectiveEvent,
): boolean {
  return (
    (objectiveType === 'identify-contact' && event.type === 'contact-identified') ||
    (objectiveType === 'tractor-lock' && event.type === 'tractor-activated') ||
    (objectiveType === 'combat-victory' && event.type === 'combat-won')
  );
}

function validateDefinitions(definitions: readonly TutorialMissionDefinition[]): void {
  if (definitions.length === 0) throw new Error('A campanha tutorial requer ao menos uma missão.');
  const ids = new Set<string>();
  for (const definition of definitions) {
    if (
      definition.id.length === 0 ||
      definition.destinationNodeId.length === 0 ||
      definition.targetContactId.length === 0
    ) {
      throw new Error('Missões do tutorial exigem IDs não vazios.');
    }
    if (ids.has(definition.id)) throw new Error(`ID de missão duplicado: ${definition.id}.`);
    if (
      !Number.isFinite(definition.travelDurationSeconds) ||
      definition.travelDurationSeconds <= 0
    ) {
      throw new Error('A duração da viagem da missão deve ser finita e maior que zero.');
    }
    ids.add(definition.id);
  }
}

export function createTutorialCampaign(
  definitions: readonly TutorialMissionDefinition[],
  initialState: TutorialCampaignInitialState = {
    checkpoint: 'briefing',
    missionId: definitions[0]?.id ?? '',
  },
): TutorialCampaignSession {
  validateDefinitions(definitions);
  let missionIndex = definitions.findIndex(({ id }) => id === initialState.missionId);
  if (missionIndex < 0) throw new Error(`Missão inicial desconhecida: ${initialState.missionId}.`);

  let phase: TutorialMissionPhase = initialState.checkpoint;
  let objectiveCompleted = phase === 'completed';
  let transitionElapsedSeconds = 0;

  function currentDefinition(): TutorialMissionDefinition {
    const definition = definitions[missionIndex];
    if (definition === undefined) throw new Error('A campanha tutorial perdeu sua missão atual.');
    return definition;
  }

  function snapshot(): TutorialCampaignSnapshot {
    const definition = currentDefinition();
    const transitionProgress =
      phase === 'outbound' || phase === 'returning'
        ? Math.min(1, transitionElapsedSeconds / definition.travelDurationSeconds)
        : phase === 'completed'
          ? 1
          : 0;
    return {
      campaignCompleted: phase === 'completed' && missionIndex === definitions.length - 1,
      completedMissionCount: missionIndex + (phase === 'completed' ? 1 : 0),
      missionCount: definitions.length,
      missionId: definition.id,
      missionNumber: missionIndex + 1,
      objectiveCompleted,
      objectiveType: definition.objectiveType,
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
      if (transitionElapsedSeconds >= currentDefinition().travelDurationSeconds) {
        phase = phase === 'outbound' ? 'objective' : 'completed';
        transitionElapsedSeconds = 0;
      }
      return snapshot();
    },
    beginReturn() {
      if (phase !== 'objective' || !objectiveCompleted) return false;
      phase = 'returning';
      transitionElapsedSeconds = 0;
      return true;
    },
    continueFromCompletion() {
      if (phase !== 'completed') return false;
      missionIndex = missionIndex === definitions.length - 1 ? 0 : missionIndex + 1;
      phase = 'briefing';
      objectiveCompleted = false;
      transitionElapsedSeconds = 0;
      return true;
    },
    getSnapshot: snapshot,
    recordObjective(event) {
      const definition = currentDefinition();
      if (
        phase !== 'objective' ||
        objectiveCompleted ||
        event.contactId !== definition.targetContactId ||
        !objectiveMatches(definition.objectiveType, event)
      ) {
        return false;
      }
      objectiveCompleted = true;
      return true;
    },
    reset() {
      missionIndex = 0;
      phase = 'briefing';
      objectiveCompleted = false;
      transitionElapsedSeconds = 0;
      return snapshot();
    },
    start() {
      if (phase !== 'briefing') return false;
      phase = 'outbound';
      objectiveCompleted = false;
      transitionElapsedSeconds = 0;
      return true;
    },
  };
}
