import { describe, expect, it } from 'vitest';
import { createTutorialCampaign } from '../domain/missions/tutorial-campaign';
import { INITIAL_TUTORIAL_MISSIONS } from './mission-content';

describe('initial tutorial mission content', () => {
  it('defines the three ordered lessons required by the initial campaign', () => {
    expect(INITIAL_TUTORIAL_MISSIONS).toHaveLength(3);
    expect(INITIAL_TUTORIAL_MISSIONS.map(({ objectiveType }) => objectiveType)).toEqual([
      'identify-contact',
      'tractor-lock',
      'combat-victory',
    ]);
    expect(new Set(INITIAL_TUTORIAL_MISSIONS.map(({ id }) => id)).size).toBe(3);
    expect(
      new Set(INITIAL_TUTORIAL_MISSIONS.map(({ destinationNodeId }) => destinationNodeId)).size,
    ).toBe(3);
    expect(
      new Set(INITIAL_TUTORIAL_MISSIONS.map(({ targetContactId }) => targetContactId)).size,
    ).toBe(3);
    expect(() => createTutorialCampaign(INITIAL_TUTORIAL_MISSIONS)).not.toThrow();
  });

  it('keeps offensive equipment disabled until the combat lesson', () => {
    const [sensorMission, assistanceMission, combatMission] = INITIAL_TUTORIAL_MISSIONS;

    expect(sensorMission?.allowedEquipment).toEqual([]);
    expect(assistanceMission?.allowedEquipment).toEqual(['tractor']);
    expect(combatMission?.allowedEquipment).toEqual(['beam', 'torpedo', 'tractor']);
    expect(INITIAL_TUTORIAL_MISSIONS.map(({ encounterMode }) => encounterMode)).toEqual([
      'passive',
      'passive',
      'hostile',
    ]);
  });
});
