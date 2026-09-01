import type { TutorialCampaignSnapshot } from './tutorial-campaign';

export interface MissionJournalDefinition {
  readonly discovery: string;
  readonly id: string;
  readonly title: string;
}

export type MissionJournalEntryStatus = 'completed' | 'current' | 'locked';

export interface MissionJournalEntry {
  readonly discovery?: string;
  readonly id: string;
  readonly status: MissionJournalEntryStatus;
  readonly title: string;
}

export interface MissionJournalSnapshot {
  readonly completedMissionCount: number;
  readonly currentObjective: string;
  readonly entries: readonly MissionJournalEntry[];
  readonly missionCount: number;
  readonly state: 'ready' | 'unavailable';
  readonly statusMessage: string;
}

const UNAVAILABLE_OBJECTIVE =
  'Objetivo atual indisponível. Retorne à Base Aurora e carregue um checkpoint compatível.';
const UNAVAILABLE_STATUS =
  'Os dados do diário não puderam ser reconhecidos. O save original permanece preservado.';

function unavailableJournal(missionCount: number): MissionJournalSnapshot {
  return {
    completedMissionCount: 0,
    currentObjective: UNAVAILABLE_OBJECTIVE,
    entries: [],
    missionCount,
    state: 'unavailable',
    statusMessage: UNAVAILABLE_STATUS,
  };
}

function definitionsAreValid(definitions: readonly MissionJournalDefinition[]): boolean {
  const ids = new Set<string>();
  for (const definition of definitions) {
    if (
      typeof definition.id !== 'string' ||
      typeof definition.title !== 'string' ||
      typeof definition.discovery !== 'string' ||
      definition.id.trim().length === 0 ||
      definition.title.trim().length === 0 ||
      definition.discovery.trim().length === 0 ||
      ids.has(definition.id)
    ) {
      return false;
    }
    ids.add(definition.id);
  }
  return definitions.length > 0;
}

export function createMissionJournal(
  definitions: readonly MissionJournalDefinition[],
  campaign: TutorialCampaignSnapshot,
  currentObjective: string,
): MissionJournalSnapshot {
  const currentMissionIndex = definitions.findIndex(({ id }) => id === campaign.missionId);
  const expectedCompletedMissionCount =
    currentMissionIndex + (campaign.phase === 'completed' ? 1 : 0);
  if (
    !definitionsAreValid(definitions) ||
    campaign.missionCount !== definitions.length ||
    !Number.isInteger(campaign.completedMissionCount) ||
    campaign.completedMissionCount < 0 ||
    campaign.completedMissionCount > definitions.length ||
    currentMissionIndex < 0 ||
    campaign.completedMissionCount !== expectedCompletedMissionCount
  ) {
    return unavailableJournal(definitions.length);
  }

  const entries = definitions.map<MissionJournalEntry>((definition, index) => {
    const completed = index < campaign.completedMissionCount;
    return {
      ...(completed ? { discovery: definition.discovery } : {}),
      id: definition.id,
      status: completed ? 'completed' : definition.id === campaign.missionId ? 'current' : 'locked',
      title: definition.title,
    };
  });

  return {
    completedMissionCount: campaign.completedMissionCount,
    currentObjective:
      typeof currentObjective === 'string' && currentObjective.trim().length > 0
        ? currentObjective
        : UNAVAILABLE_OBJECTIVE,
    entries,
    missionCount: definitions.length,
    state: 'ready',
    statusMessage:
      campaign.completedMissionCount === definitions.length
        ? 'Todas as descobertas do treinamento foram registradas.'
        : 'As descobertas são registradas ao concluir cada missão.',
  };
}
