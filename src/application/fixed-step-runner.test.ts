import { describe, expect, it } from 'vitest';

import {
  createInitialShipState,
  integrateShipFlight,
  type ShipDefinition,
} from '../domain/flight/ship-flight';
import { createFixedStepRunner } from './fixed-step-runner';

const definition: ShipDefinition = {
  accelerationUnitsPerSecondSquared: 5,
  boostMultiplier: 2,
  collisionRadiusUnits: 1,
  displayName: 'Nave',
  flightAssistPerSecond: 0.1,
  id: 'ship',
  maxSpeedUnitsPerSecond: 30,
  maxTurnRateDegreesPerSecond: { x: 50, y: 60, z: 70 },
  turnResponsePerSecond: 6,
};

function simulate(renderFps: number) {
  const runner = createFixedStepRunner({
    fixedDeltaSeconds: 1 / 60,
    maxFrameDeltaSeconds: 0.25,
    maxStepsPerFrame: 15,
  });
  let state = createInitialShipState({ x: 0, y: 0, z: 0 });
  for (let frame = 0; frame < renderFps * 4; frame += 1) {
    runner.advance(1 / renderFps, (fixedDeltaSeconds) => {
      state = integrateShipFlight({
        arenaRadiusUnits: 500,
        definition,
        deltaSeconds: fixedDeltaSeconds,
        input: {
          boost: false,
          brake: false,
          pitch: 0.25,
          pitchDegrees: 0,
          roll: 0,
          throttle: 1,
          yaw: -0.4,
          yawDegrees: 0,
        },
        state,
      });
    });
  }
  return state;
}

describe('createFixedStepRunner', () => {
  it('produz a mesma simulação em taxas de renderização diferentes', () => {
    const at30Fps = simulate(30);
    const at144Fps = simulate(144);

    expect(at144Fps.position.x).toBeCloseTo(at30Fps.position.x, 8);
    expect(at144Fps.position.y).toBeCloseTo(at30Fps.position.y, 8);
    expect(at144Fps.position.z).toBeCloseTo(at30Fps.position.z, 8);
    expect(at144Fps.orientationDegrees.y).toBeCloseTo(at30Fps.orientationDegrees.y, 8);
  });

  it('limita recuperação de uma pausa longa e registra tempo descartado', () => {
    const runner = createFixedStepRunner({
      fixedDeltaSeconds: 1 / 60,
      maxFrameDeltaSeconds: 0.25,
      maxStepsPerFrame: 8,
    });
    let calls = 0;
    const result = runner.advance(3, () => {
      calls += 1;
    });

    expect(calls).toBe(8);
    expect(result.droppedSeconds).toBeGreaterThan(2.8);
  });
});
