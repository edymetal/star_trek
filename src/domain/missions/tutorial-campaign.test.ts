import { describe, expect, it } from 'vitest';

import { createTutorialCampaign, type TutorialMissionDefinition } from './tutorial-campaign';

const definitions: readonly TutorialMissionDefinition[] = [
  {
    destinationNodeId: 'destination-a',
    id: 'survey-test',
    objectiveType: 'identify-contact',
    targetContactId: 'contact-test',
    travelDurationSeconds: 2,
  },
  {
    destinationNodeId: 'destination-b',
    id: 'assistance-test',
    objectiveType: 'tractor-lock',
    targetContactId: 'contact-test',
    travelDurationSeconds: 2,
  },
  {
    destinationNodeId: 'destination-c',
    id: 'combat-test',
    objectiveType: 'combat-victory',
    targetContactId: 'contact-test',
    travelDurationSeconds: 2,
  },
];

function completeTravel(campaign: ReturnType<typeof createTutorialCampaign>): void {
  expect(campaign.start()).toBe(true);
  expect(campaign.advance(1).transitionProgress).toBe(0.5);
  expect(campaign.advance(1).phase).toBe('objective');
}

function completeReturn(campaign: ReturnType<typeof createTutorialCampaign>): void {
  expect(campaign.beginReturn()).toBe(true);
  expect(campaign.advance(2).phase).toBe('completed');
}

describe('createTutorialCampaign', () => {
  it('conduz sensores, assistência e combate em ordem', () => {
    const campaign = createTutorialCampaign(definitions);

    completeTravel(campaign);
    expect(
      campaign.recordObjective({ contactId: 'contact-test', type: 'contact-identified' }),
    ).toBe(true);
    completeReturn(campaign);
    expect(campaign.getSnapshot()).toMatchObject({
      completedMissionCount: 1,
      missionNumber: 1,
    });

    expect(campaign.continueFromCompletion()).toBe(true);
    completeTravel(campaign);
    expect(campaign.recordObjective({ contactId: 'contact-test', type: 'tractor-activated' })).toBe(
      true,
    );
    completeReturn(campaign);

    expect(campaign.continueFromCompletion()).toBe(true);
    completeTravel(campaign);
    expect(campaign.recordObjective({ contactId: 'contact-test', type: 'combat-won' })).toBe(true);
    completeReturn(campaign);
    expect(campaign.getSnapshot()).toMatchObject({
      campaignCompleted: true,
      completedMissionCount: 3,
      missionNumber: 3,
    });
  });

  it('rejeita objetivo errado, contato errado e comandos fora de fase', () => {
    const campaign = createTutorialCampaign(definitions);

    expect(
      campaign.recordObjective({ contactId: 'contact-test', type: 'contact-identified' }),
    ).toBe(false);
    expect(campaign.beginReturn()).toBe(false);
    completeTravel(campaign);
    expect(campaign.recordObjective({ contactId: 'contact-test', type: 'tractor-activated' })).toBe(
      false,
    );
    expect(campaign.recordObjective({ contactId: 'other', type: 'contact-identified' })).toBe(
      false,
    );
    expect(campaign.beginReturn()).toBe(false);
  });

  it('retoma qualquer missão em briefing ou concluída', () => {
    const briefing = createTutorialCampaign(definitions, {
      checkpoint: 'briefing',
      missionId: 'assistance-test',
    });
    expect(briefing.getSnapshot()).toMatchObject({ missionNumber: 2, phase: 'briefing' });

    const completed = createTutorialCampaign(definitions, {
      checkpoint: 'completed',
      missionId: 'combat-test',
    });
    expect(completed.getSnapshot()).toMatchObject({
      campaignCompleted: true,
      objectiveCompleted: true,
      phase: 'completed',
    });
  });

  it('avança para a próxima missão e reinicia a sequência depois da terceira', () => {
    const secondCompleted = createTutorialCampaign(definitions, {
      checkpoint: 'completed',
      missionId: 'assistance-test',
    });
    expect(secondCompleted.continueFromCompletion()).toBe(true);
    expect(secondCompleted.getSnapshot()).toMatchObject({ missionNumber: 3, phase: 'briefing' });

    const finalCompleted = createTutorialCampaign(definitions, {
      checkpoint: 'completed',
      missionId: 'combat-test',
    });
    expect(finalCompleted.continueFromCompletion()).toBe(true);
    expect(finalCompleted.getSnapshot()).toMatchObject({ missionNumber: 1, phase: 'briefing' });
  });

  it('reinicia toda a campanha no briefing da primeira missão', () => {
    const campaign = createTutorialCampaign(definitions, {
      checkpoint: 'completed',
      missionId: 'combat-test',
    });

    expect(campaign.getSnapshot().campaignCompleted).toBe(true);
    expect(campaign.reset()).toMatchObject({
      campaignCompleted: false,
      completedMissionCount: 0,
      missionId: 'survey-test',
      missionNumber: 1,
      phase: 'briefing',
    });
  });

  it('valida definições, missão inicial e deltas', () => {
    expect(() => createTutorialCampaign([])).toThrow('ao menos uma missão');
    expect(() => createTutorialCampaign([definitions[0]!, definitions[0]!])).toThrow('duplicado');
    expect(() =>
      createTutorialCampaign([{ ...definitions[0]!, travelDurationSeconds: 0 }]),
    ).toThrow('maior que zero');
    expect(() =>
      createTutorialCampaign(definitions, { checkpoint: 'briefing', missionId: 'unknown' }),
    ).toThrow('desconhecida');
    const campaign = createTutorialCampaign(definitions);
    campaign.start();
    expect(() => campaign.advance(Number.NaN)).toThrow('finito e não negativo');
  });
});
