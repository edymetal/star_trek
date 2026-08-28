import { describe, expect, it } from 'vitest';

import {
  classifyHullVisualState,
  classifyHullSectionVisualStates,
  deriveCombatVisualPresentation,
  deriveRemoteVesselPresentation,
} from './arena-presentation';
import type { DamageState } from '../domain/combat/damage';

const observation = {
  bearingDegrees: 12,
  directionFromObserver: { x: 0, y: 0, z: -1 },
  distanceUnits: 42,
  firingSolution: 1,
  position: { x: 3, y: 4, z: -40 },
};

describe('apresentação da nave remota', () => {
  it('usa somente a posição pública enquanto o contato está observado', () => {
    expect(
      deriveRemoteVesselPresentation({ lastObservation: observation, observedNow: true }),
    ).toEqual({ position: observation.position, visible: true });
  });

  it('oculta a nave durante memória mesmo quando existe última observação', () => {
    expect(
      deriveRemoteVesselPresentation({ lastObservation: observation, observedNow: false }),
    ).toEqual({ visible: false });
  });
});

describe('apresentação visual de combate', () => {
  const intactDamage: DamageState = {
    destroyed: false,
    hull: { bow: 100, port: 100, starboard: 100, stern: 100 },
    secondsSinceShieldImpact: 10,
    shields: { front: 100, port: 100, rear: 100, starboard: 100 },
    subsystems: { engines: 1, sensors: 1, shields: 1, weapons: 1 },
  };
  const encounter = {
    effect: {
      impactSector: 'port' as const,
      kind: 'beam' as const,
      remainingSeconds: 0.2,
      serial: 1,
      targetPosition: { x: 1, y: 2, z: 3 },
    },
    enemy: {
      damage: {
        ...intactDamage,
        hull: { ...intactDamage.hull, port: 48 },
        subsystems: { ...intactDamage.subsystems, weapons: 0 },
      },
      hullPercent: 48,
      shieldPercent: 62,
    },
    playerDamage: intactDamage,
    playerHullPercent: 81,
    playerShieldPercent: 55,
  };
  const capacities = { enemyHullCapacityPerSection: 100, playerHullCapacityPerSection: 100 };

  it('classifica três estados preparados com limites estáveis', () => {
    expect(classifyHullVisualState(100)).toBe('intact');
    expect(classifyHullVisualState(66)).toBe('damaged');
    expect(classifyHullVisualState(33)).toBe('critical');
    expect(classifyHullVisualState(Number.NaN)).toBe('critical');
    expect(
      classifyHullSectionVisualStates({ bow: 100, port: 66, starboard: 33, stern: 0 }, 100),
    ).toEqual({ bow: 'intact', port: 'damaged', starboard: 'critical', stern: 'critical' });
  });

  it('não publica estado visual atual da nave remota quando ela não está observada', () => {
    expect(deriveCombatVisualPresentation(encounter, false, capacities)).toEqual({
      effectKind: 'beam',
      impactSector: 'port',
      playerDisabledSubsystems: [],
      playerHullSections: { bow: 'intact', port: 'intact', starboard: 'intact', stern: 'intact' },
      playerHullState: 'intact',
      remoteDisabledSubsystems: [],
      remoteHullSections: 'hidden',
      remoteHullState: 'hidden',
      shieldImpactTarget: 'none',
    });
  });

  it('deriva dano e impacto de escudo somente para alvo remoto observado', () => {
    expect(deriveCombatVisualPresentation(encounter, true, capacities)).toEqual({
      effectKind: 'beam',
      impactSector: 'port',
      playerDisabledSubsystems: [],
      playerHullSections: { bow: 'intact', port: 'intact', starboard: 'intact', stern: 'intact' },
      playerHullState: 'intact',
      remoteDisabledSubsystems: ['weapons'],
      remoteHullSections: { bow: 'intact', port: 'damaged', starboard: 'intact', stern: 'intact' },
      remoteHullState: 'damaged',
      shieldImpactTarget: 'remote',
    });
  });
});
