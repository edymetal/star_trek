import { describe, expect, it } from 'vitest';

import {
  classifyHullVisualState,
  deriveCombatVisualPresentation,
  deriveRemoteVesselPresentation,
} from './arena-presentation';

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
  const encounter = {
    effect: {
      kind: 'beam' as const,
      remainingSeconds: 0.2,
      serial: 1,
      targetPosition: { x: 1, y: 2, z: 3 },
    },
    enemy: { hullPercent: 48, shieldPercent: 62 },
    playerHullPercent: 81,
    playerShieldPercent: 55,
  };

  it('classifica três estados preparados com limites estáveis', () => {
    expect(classifyHullVisualState(100)).toBe('intact');
    expect(classifyHullVisualState(66)).toBe('damaged');
    expect(classifyHullVisualState(33)).toBe('critical');
    expect(classifyHullVisualState(Number.NaN)).toBe('critical');
  });

  it('não publica estado visual atual da nave remota quando ela não está observada', () => {
    expect(deriveCombatVisualPresentation(encounter, false)).toEqual({
      effectKind: 'beam',
      playerHullState: 'intact',
      remoteHullState: 'hidden',
      shieldImpactTarget: 'none',
    });
  });

  it('deriva dano e impacto de escudo somente para alvo remoto observado', () => {
    expect(deriveCombatVisualPresentation(encounter, true)).toEqual({
      effectKind: 'beam',
      playerHullState: 'intact',
      remoteHullState: 'damaged',
      shieldImpactTarget: 'remote',
    });
  });
});
