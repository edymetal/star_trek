import { describe, expect, it } from 'vitest';

import {
  createInitialShipState,
  integrateShipFlight,
  NEUTRAL_FLIGHT_INPUT,
  vectorLength,
  type ShipDefinition,
} from './ship-flight';

const DEFINITION: ShipDefinition = {
  accelerationUnitsPerSecondSquared: 8,
  boostMultiplier: 2,
  collisionRadiusUnits: 1,
  displayName: 'Nave de teste',
  flightAssistPerSecond: 0.12,
  id: 'test-ship',
  maxSpeedUnitsPerSecond: 30,
  maxTurnRateDegreesPerSecond: { x: 50, y: 60, z: 80 },
  turnResponsePerSecond: 7,
};

describe('integrateShipFlight', () => {
  it('acelera para a frente e mantém estado separado da definição', () => {
    const initial = createInitialShipState({ x: 0, y: 0, z: 0 });
    const result = integrateShipFlight({
      arenaRadiusUnits: 100,
      definition: DEFINITION,
      deltaSeconds: 1 / 60,
      input: { ...NEUTRAL_FLIGHT_INPUT, throttle: 1 },
      state: initial,
    });

    expect(result.position.z).toBeLessThan(0);
    expect(result.velocity.z).toBeLessThan(0);
    expect(initial.position.z).toBe(0);
    expect(DEFINITION.maxSpeedUnitsPerSecond).toBe(30);
  });

  it('oferece impulso sem ultrapassar o limite ampliado', () => {
    let state = createInitialShipState({ x: 0, y: 0, z: 0 });
    for (let index = 0; index < 600; index += 1) {
      state = integrateShipFlight({
        arenaRadiusUnits: 10_000,
        definition: DEFINITION,
        deltaSeconds: 1 / 60,
        input: { ...NEUTRAL_FLIGHT_INPUT, boost: true, throttle: 1 },
        state,
      });
    }

    expect(vectorLength(state.velocity)).toBeGreaterThan(DEFINITION.maxSpeedUnitsPerSecond);
    expect(vectorLength(state.velocity)).toBeLessThanOrEqual(
      DEFINITION.maxSpeedUnitsPerSecond * DEFINITION.boostMultiplier,
    );
  });

  it('contém a nave no limite da arena e remove velocidade de saída', () => {
    const result = integrateShipFlight({
      arenaRadiusUnits: 10,
      definition: DEFINITION,
      deltaSeconds: 1,
      input: NEUTRAL_FLIGHT_INPUT,
      state: {
        ...createInitialShipState({ x: 9, y: 0, z: 0 }),
        velocity: { x: 20, y: 0, z: 0 },
      },
    });

    expect(vectorLength(result.position)).toBeCloseTo(9);
    expect(result.velocity.x).toBeCloseTo(0);
  });

  it('assistência desacelera a inércia quando não há aceleração', () => {
    const state = {
      ...createInitialShipState({ x: 0, y: 0, z: 0 }),
      velocity: { x: 0, y: 0, z: -10 },
    };
    const coasting = integrateShipFlight({
      arenaRadiusUnits: 100,
      definition: DEFINITION,
      deltaSeconds: 0.1,
      input: NEUTRAL_FLIGHT_INPUT,
      state,
    });
    const braking = integrateShipFlight({
      arenaRadiusUnits: 100,
      definition: DEFINITION,
      deltaSeconds: 0.1,
      input: { ...NEUTRAL_FLIGHT_INPUT, brake: true },
      state,
    });

    expect(vectorLength(braking.velocity)).toBeLessThan(vectorLength(coasting.velocity));
  });

  it('potência dos motores altera aceleração no mesmo passo', () => {
    const state = createInitialShipState({ x: 0, y: 0, z: 0 });
    const standard = integrateShipFlight({
      arenaRadiusUnits: 100,
      definition: DEFINITION,
      deltaSeconds: 1 / 60,
      enginePerformanceMultiplier: 1,
      input: { ...NEUTRAL_FLIGHT_INPUT, throttle: 1 },
      state,
    });
    const powered = integrateShipFlight({
      arenaRadiusUnits: 100,
      definition: DEFINITION,
      deltaSeconds: 1 / 60,
      enginePerformanceMultiplier: 1.5,
      input: { ...NEUTRAL_FLIGHT_INPUT, throttle: 1 },
      state,
    });

    expect(vectorLength(powered.velocity)).toBeGreaterThan(vectorLength(standard.velocity));
  });
});
