import { describe, expect, it } from 'vitest';

import {
  createUnknownContact,
  selectNextContact,
  stepSensorContact,
  toPublicContact,
  validateSelectedContact,
  type SensorDefinition,
  type SensorObservation,
  type SensorObservationSnapshot,
} from './sensors';

const DEFINITION: SensorDefinition = {
  identificationDurationSeconds: 2,
  identificationRangeFactor: 0.8,
  lostContactDelaySeconds: 8,
};

function snapshot(distanceUnits: number, x = distanceUnits): SensorObservationSnapshot {
  return {
    bearingDegrees: 90,
    directionFromObserver: { x: 1, y: 0, z: 0 },
    distanceUnits,
    firingSolution: 0.9,
    position: { x, y: 2, z: -3 },
  };
}

function observation(
  distanceUnits: number,
  overrides: Partial<Omit<SensorObservation, 'snapshot'>> & {
    readonly snapshot?: SensorObservationSnapshot;
  } = {},
): SensorObservation {
  return {
    activeScan: false,
    deltaSeconds: 0,
    sensorIntegrity: 1,
    sensorPowerMultiplier: 1,
    sensorRangeUnits: 100,
    ...overrides,
    snapshot: overrides.snapshot ?? snapshot(distanceUnits),
  };
}

describe('sensores e contatos', () => {
  it('não revela posição, distância ou identidade de contato desconhecido', () => {
    const state = createUnknownContact('enemy');
    expect(toPublicContact(DEFINITION, state, 'Corsária')).toEqual({
      awareness: 'unknown',
      contactId: 'enemy',
      observedNow: false,
      scanProgress: 0,
    });
  });

  it('detecta por alcance, mas só identifica com scan, tempo e energia', () => {
    let state = createUnknownContact('enemy');
    state = stepSensorContact(DEFINITION, state, observation(50, { deltaSeconds: 1 }));
    expect(state.awareness).toBe('detected');
    expect(state.observedNow).toBe(true);

    state = stepSensorContact(
      DEFINITION,
      state,
      observation(50, { activeScan: true, deltaSeconds: 2, sensorPowerMultiplier: 0 }),
    );
    expect(state.awareness).toBe('detected');

    state = stepSensorContact(
      DEFINITION,
      state,
      observation(50, { activeScan: true, deltaSeconds: 2 }),
    );
    expect(state.awareness).toBe('identified');
    expect(toPublicContact(DEFINITION, state, 'Corsária').displayName).toBe('Corsária');
  });

  it('não progride scan fora do alcance de identificação', () => {
    const detected = stepSensorContact(DEFINITION, createUnknownContact('enemy'), observation(90));
    const state = stepSensorContact(
      DEFINITION,
      detected,
      observation(90, { activeScan: true, deltaSeconds: 10, sensorPowerMultiplier: 2 }),
    );
    expect(state.awareness).toBe('detected');
    expect(state.scanProgressSeconds).toBe(0);
  });

  it('congela o snapshot público completo enquanto o alvo está apenas na memória', () => {
    const firstSnapshot = snapshot(90, 90);
    const detected = stepSensorContact(
      DEFINITION,
      createUnknownContact('enemy'),
      observation(90, { snapshot: firstSnapshot }),
    );
    const hiddenSnapshot: SensorObservationSnapshot = {
      bearingDegrees: -45,
      directionFromObserver: { x: -1, y: 0, z: 1 },
      distanceUnits: 140,
      firingSolution: -0.5,
      position: { x: -80, y: 10, z: 120 },
    };
    const remembered = stepSensorContact(
      DEFINITION,
      detected,
      observation(140, { deltaSeconds: 3, snapshot: hiddenSnapshot }),
    );
    const publicContact = toPublicContact(DEFINITION, remembered, 'Corsária');

    expect(remembered.observedNow).toBe(false);
    expect(remembered.lastObservation).toEqual(firstSnapshot);
    expect(publicContact).toMatchObject({
      awareness: 'detected',
      distanceUnits: 90,
      memoryAgeSeconds: 3,
      observedNow: false,
    });
    expect(publicContact.lastObservation).toEqual(firstSnapshot);
  });

  it('expira exatamente em oito segundos e limpa snapshot e seleção', () => {
    const detected = stepSensorContact(DEFINITION, createUnknownContact('enemy'), observation(90));
    const beforeExpiry = stepSensorContact(
      DEFINITION,
      detected,
      observation(101, { deltaSeconds: 8 - 1e-6 }),
    );
    const expired = stepSensorContact(
      DEFINITION,
      beforeExpiry,
      observation(101, { deltaSeconds: 1e-6 }),
    );

    expect(beforeExpiry.awareness).toBe('detected');
    expect(beforeExpiry.lastObservation?.distanceUnits).toBe(90);
    expect(expired.awareness).toBe('unknown');
    expect(expired.lastObservation).toBeUndefined();
    expect(expired.observedNow).toBe(false);
    expect(validateSelectedContact('enemy', [expired])).toBeUndefined();
  });

  it('seleciona somente contatos percebidos e percorre a lista', () => {
    const unknown = createUnknownContact('unknown');
    const first = { ...createUnknownContact('first'), awareness: 'detected' as const };
    const second = { ...createUnknownContact('second'), awareness: 'identified' as const };
    expect(selectNextContact(undefined, [unknown, first, second])).toBe('first');
    expect(selectNextContact('first', [unknown, first, second])).toBe('second');
    expect(selectNextContact('second', [unknown, first, second])).toBe('first');
  });

  it('mantém scan e expiração de memória equivalentes em 30 e 144 passos por segundo', () => {
    const simulate = (stepsPerSecond: number) => {
      let state = createUnknownContact('enemy');
      for (let index = 0; index < stepsPerSecond * 2; index += 1) {
        state = stepSensorContact(
          DEFINITION,
          state,
          observation(40, { activeScan: true, deltaSeconds: 1 / stepsPerSecond }),
        );
      }
      for (let index = 0; index < stepsPerSecond * 8; index += 1) {
        state = stepSensorContact(
          DEFINITION,
          state,
          observation(140, { deltaSeconds: 1 / stepsPerSecond }),
        );
      }
      return state;
    };
    const at30 = simulate(30);
    const at144 = simulate(144);
    expect(at30.awareness).toBe('unknown');
    expect(at144.awareness).toBe('unknown');
    expect(at30.lastObservation).toBeUndefined();
    expect(at144.lastObservation).toBeUndefined();
    expect(at144.secondsSinceObserved).toBeCloseTo(at30.secondsSinceObserved, 10);
  });
});
