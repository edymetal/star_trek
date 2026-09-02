import { describe, expect, it } from 'vitest';

import type { EncounterSnapshot } from './encounter-session';
import type { TutorialCampaignSnapshot } from '../domain/missions/tutorial-campaign';
import type { SystemNavigationSnapshot } from '../domain/navigation/system-navigation';
import {
  ambienceModeForNavigation,
  createGameAudioCueRouter,
  type GameAudioFrame,
} from './audio-cue-router';

function frame(
  overrides: {
    readonly encounter?: Partial<EncounterSnapshot>;
    readonly mission?: Partial<TutorialCampaignSnapshot>;
    readonly navigation?: Partial<SystemNavigationSnapshot>;
    readonly reservePercent?: number;
    readonly weaponCapacitorPercent?: number;
  } = {},
): GameAudioFrame {
  const encounter = {
    contact: {
      awareness: 'detected',
      contactId: 'contact-1',
      observedNow: true,
      scanProgress: 0.4,
    },
    effect: undefined,
    enemy: { hullPercent: 100, shieldPercent: 100 },
    feedback: 'Sistemas prontos.',
    phase: 'active',
    playerHullPercent: 100,
    playerShieldPercent: 100,
    selectedContactId: undefined,
    torpedoAmmo: 6,
    ...overrides.encounter,
  } as GameAudioFrame['encounter'];
  return {
    encounter,
    mission: {
      campaignCompleted: false,
      completedMissionCount: 0,
      missionCount: 3,
      missionId: 'mission-1',
      missionNumber: 1,
      objectiveCompleted: false,
      objectiveType: 'identify-contact',
      phase: 'briefing',
      transitionProgress: 0,
      ...overrides.mission,
    },
    navigation: {
      currentNodeId: 'base',
      mode: 'base',
      ...overrides.navigation,
    },
    reservePercent: overrides.reservePercent ?? 100,
    weaponCapacitorPercent: overrides.weaponCapacitorPercent ?? 100,
  };
}

describe('game audio cue router', () => {
  it('não cria eventos no primeiro snapshot nem repete um estado estável', () => {
    const router = createGameAudioCueRouter();
    const initial = frame();

    expect(router.update(initial)).toEqual([]);
    expect(router.update(initial)).toEqual([]);
  });

  it('distingue seleção, scan, armas, impactos e conclusão sem depender de GPU', () => {
    const router = createGameAudioCueRouter();
    router.update(frame());

    expect(
      router.update(
        frame({
          encounter: {
            contact: {
              awareness: 'identified',
              contactId: 'contact-1',
              displayName: 'Sonda Nereida',
              observedNow: true,
              scanProgress: 1,
            },
            effect: {
              impactSector: 'front',
              kind: 'beam',
              remainingSeconds: 0.2,
              serial: 1,
              targetPosition: { x: 0, y: 0, z: -10 },
            },
            enemy: { hullPercent: 90, shieldPercent: 80 } as EncounterSnapshot['enemy'],
            selectedContactId: 'contact-1',
            torpedoAmmo: 5,
          },
          mission: { objectiveCompleted: true, phase: 'objective' },
        }),
      ),
    ).toEqual([
      'beam',
      'target-select',
      'scan-complete',
      'torpedo-launch',
      'shield-impact',
      'hull-impact',
      'objective-complete',
    ]);
  });

  it('publica lançamento, impacto e fases de missão uma única vez', () => {
    const router = createGameAudioCueRouter();
    router.update(frame());
    const outbound = frame({
      encounter: { torpedoAmmo: 5 },
      mission: { phase: 'outbound' },
      navigation: {
        activeRoute: {
          destinationNodeId: 'sector',
          direction: 'outbound',
          distanceUnits: 1,
          durationSeconds: 1,
          originNodeId: 'base',
          routeId: 'route',
        },
        mode: 'travel',
      },
    });
    expect(router.update(outbound)).toEqual(['torpedo-launch', 'departure', 'travel']);
    expect(router.update(outbound)).toEqual([]);

    const returning = frame({
      encounter: {
        effect: {
          impactSector: 'rear',
          kind: 'torpedo',
          remainingSeconds: 0.2,
          serial: 2,
          targetPosition: { x: 0, y: 0, z: -10 },
        },
      },
      mission: { objectiveCompleted: true, phase: 'returning' },
      navigation: { mode: 'travel' },
    });
    expect(router.update(returning)).toContain('torpedo-impact');
    expect(router.update(returning)).toEqual([]);

    const completed = frame({
      mission: { objectiveCompleted: true, phase: 'completed' },
      navigation: { mode: 'base' },
    });
    expect(router.update(completed)).toContain('base-arrival');
  });

  it('emite avisos somente ao cruzar limites ou receber falha nova', () => {
    const router = createGameAudioCueRouter();
    router.update(frame());

    expect(router.update(frame({ reservePercent: 20, weaponCapacitorPercent: 15 }))).toEqual([
      'energy-warning',
      'recharge-warning',
    ]);
    expect(router.update(frame({ reservePercent: 10, weaponCapacitorPercent: 5 }))).toEqual([]);
    expect(
      router.update(
        frame({
          encounter: { feedback: 'Equipamento em recarga.' },
          reservePercent: 10,
          weaponCapacitorPercent: 50,
        }),
      ),
    ).toEqual(['recharge-warning']);
  });

  it('mapeia navegação para ambientes discretos', () => {
    expect(ambienceModeForNavigation(frame().navigation)).toBe('base');
    expect(ambienceModeForNavigation(frame({ navigation: { mode: 'travel' } }).navigation)).toBe(
      'travel',
    );
    expect(ambienceModeForNavigation(frame({ navigation: { mode: 'encounter' } }).navigation)).toBe(
      'encounter',
    );
  });
});
