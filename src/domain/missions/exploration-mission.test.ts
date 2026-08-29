import { describe, expect, it } from 'vitest';

import { createExplorationMission } from './exploration-mission';

const definition = {
  id: 'survey-test',
  targetContactId: 'contact-test',
  travelDurationSeconds: 2,
} as const;

describe('createExplorationMission', () => {
  it('fecha o ciclo briefing, viagem, levantamento, retorno e conclusão', () => {
    const mission = createExplorationMission(definition);

    expect(mission.getSnapshot()).toMatchObject({
      identifiedTarget: false,
      phase: 'briefing',
      transitionProgress: 0,
    });
    expect(mission.start()).toBe(true);
    expect(mission.advance(1).transitionProgress).toBe(0.5);
    expect(mission.advance(1).phase).toBe('survey');
    expect(mission.recordIdentifiedContact('contact-test')).toBe(true);
    expect(mission.beginReturn()).toBe(true);
    expect(mission.advance(2).phase).toBe('completed');
  });

  it('rejeita comandos fora de fase e contatos que não são o objetivo', () => {
    const mission = createExplorationMission(definition);

    expect(mission.beginReturn()).toBe(false);
    expect(mission.recordIdentifiedContact('contact-test')).toBe(false);
    expect(mission.start()).toBe(true);
    expect(mission.start()).toBe(false);
    mission.advance(2);
    expect(mission.recordIdentifiedContact('outro-contato')).toBe(false);
    expect(mission.beginReturn()).toBe(false);
  });

  it('permite repetir uma missão concluída sem manter o objetivo anterior', () => {
    const mission = createExplorationMission(definition);
    mission.start();
    mission.advance(2);
    mission.recordIdentifiedContact('contact-test');
    mission.beginReturn();
    mission.advance(2);

    expect(mission.start()).toBe(true);
    expect(mission.getSnapshot()).toMatchObject({
      identifiedTarget: false,
      phase: 'outbound',
    });
  });

  it('retoma um checkpoint concluído em estado coerente e repetível', () => {
    const mission = createExplorationMission(definition, { checkpoint: 'completed' });

    expect(mission.getSnapshot()).toMatchObject({
      identifiedTarget: true,
      phase: 'completed',
      transitionProgress: 1,
    });
    expect(mission.start()).toBe(true);
    expect(mission.getSnapshot()).toMatchObject({
      identifiedTarget: false,
      phase: 'outbound',
    });
  });

  it('protege a simulação contra duração e delta inválidos', () => {
    expect(() => createExplorationMission({ ...definition, travelDurationSeconds: 0 })).toThrow(
      'maior que zero',
    );
    const mission = createExplorationMission(definition);
    mission.start();
    expect(() => mission.advance(-1)).toThrow('finito e não negativo');
  });
});
