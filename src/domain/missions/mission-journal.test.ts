import { describe, expect, it } from 'vitest';

import type { TutorialCampaignSnapshot } from './tutorial-campaign';
import { createMissionJournal, type MissionJournalDefinition } from './mission-journal';

const definitions: readonly MissionJournalDefinition[] = [
  { discovery: 'Dados do corredor registrados.', id: 'survey', title: 'Levantamento' },
  { discovery: 'Nave de pesquisa estabilizada.', id: 'assistance', title: 'Assistência' },
  { discovery: 'Corredor protegido.', id: 'combat', title: 'Defesa' },
];

function campaign(missionId: string, completedMissionCount: number): TutorialCampaignSnapshot {
  return {
    campaignCompleted: completedMissionCount === definitions.length,
    completedMissionCount,
    missionCount: definitions.length,
    missionId,
    missionNumber: Math.min(completedMissionCount + 1, definitions.length),
    objectiveCompleted: false,
    objectiveType: 'identify-contact',
    phase: 'briefing',
    transitionProgress: 0,
  };
}

describe('createMissionJournal', () => {
  it('projeta progresso e libera somente descobertas concluídas', () => {
    expect(createMissionJournal(definitions, campaign('assistance', 1), 'Socorra a nave.')).toEqual(
      {
        completedMissionCount: 1,
        currentObjective: 'Socorra a nave.',
        entries: [
          {
            discovery: 'Dados do corredor registrados.',
            id: 'survey',
            status: 'completed',
            title: 'Levantamento',
          },
          { id: 'assistance', status: 'current', title: 'Assistência' },
          { id: 'combat', status: 'locked', title: 'Defesa' },
        ],
        missionCount: 3,
        state: 'ready',
        statusMessage: 'As descobertas são registradas ao concluir cada missão.',
      },
    );
  });

  it('é idempotente ao projetar novamente o mesmo checkpoint', () => {
    const snapshot = {
      ...campaign('combat', 3),
      campaignCompleted: true,
      objectiveCompleted: true,
      phase: 'completed',
    } as const;
    const first = createMissionJournal(definitions, snapshot, 'Treinamento concluído.');
    const second = createMissionJournal(definitions, snapshot, 'Treinamento concluído.');

    expect(second).toEqual(first);
    expect(second.entries).toHaveLength(3);
    expect(new Set(second.entries.map(({ id }) => id)).size).toBe(3);
    expect(second.entries.every(({ status }) => status === 'completed')).toBe(true);
  });

  it('retorna mensagem segura para conteúdo desconhecido ou inconsistente', () => {
    const unknown = createMissionJournal(definitions, campaign('unknown', 1), 'Objetivo oculto');
    const duplicated = createMissionJournal(
      [definitions[0]!, definitions[0]!],
      { ...campaign('survey', 0), missionCount: 2 },
      'Faça o levantamento.',
    );

    for (const result of [unknown, duplicated]) {
      expect(result.state).toBe('unavailable');
      expect(result.entries).toEqual([]);
      expect(result.currentObjective).toContain('Objetivo atual indisponível');
      expect(result.statusMessage).toContain('save original permanece preservado');
    }
  });
});
