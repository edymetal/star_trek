import { describe, expect, it } from 'vitest';

import { PLAYER_SHIP_DEFINITION, TRAINING_ARENA } from '../content/arena-content';
import { ENERGY_PRESETS, PLAYER_ENERGY_DEFINITION } from '../content/energy-content';
import { ENERGY_CHANNELS, createInitialEnergyState } from '../domain/energy/energy-system';
import {
  createInitialShipState,
  NEUTRAL_CONTINUOUS_FLIGHT_INPUT,
  NEUTRAL_POINTER_LOOK_DELTA,
  type ContinuousFlightInput,
  type PointerLookDelta,
} from '../domain/flight/ship-flight';
import { createFlightSession, type FlightInputSource } from './flight-session';
import { createEncounterSession } from './encounter-session';

function createInputSource(
  continuous: ContinuousFlightInput = NEUTRAL_CONTINUOUS_FLIGHT_INPUT,
  initialPointerDelta: PointerLookDelta = NEUTRAL_POINTER_LOOK_DELTA,
): FlightInputSource & { readonly consumeCount: number; readonly nonNeutralConsumeCount: number } {
  let pending = initialPointerDelta;
  let consumeCount = 0;
  let nonNeutralConsumeCount = 0;
  return {
    consumePointerDelta() {
      consumeCount += 1;
      const consumed = pending;
      pending = NEUTRAL_POINTER_LOOK_DELTA;
      if (consumed.pitchDegrees !== 0 || consumed.yawDegrees !== 0) {
        nonNeutralConsumeCount += 1;
      }
      return consumed;
    },
    get consumeCount() {
      return consumeCount;
    },
    get nonNeutralConsumeCount() {
      return nonNeutralConsumeCount;
    },
    readContinuousInput: () => continuous,
  };
}

function createSession() {
  return createFlightSession({
    arenaRadiusUnits: TRAINING_ARENA.radiusUnits,
    definition: PLAYER_SHIP_DEFINITION,
    energyDefinition: PLAYER_ENERGY_DEFINITION,
    encounter: createEncounterSession({
      enemyInitialPosition: TRAINING_ARENA.enemyPosition,
      playerInitialShieldChargeUnits: 70,
    }),
    initialEnergyState: createInitialEnergyState(PLAYER_ENERGY_DEFINITION),
    initialState: createInitialShipState({ x: 0, y: 0, z: 16 }),
  });
}

describe('createFlightSession', () => {
  it('congela a simulação durante pausa e retoma sem salto de tempo', () => {
    const session = createSession();
    const movingInput = createInputSource({ ...NEUTRAL_CONTINUOUS_FLIGHT_INPUT, throttle: 1 });
    const moving = session.advance(1, movingInput);
    session.pause('focus-lost');
    const pausedAtStart = session.advance(1 / 60, movingInput);
    const paused = session.advance(30, movingInput);
    session.resume();
    const resumed = session.advance(1 / 60, createInputSource());

    expect(paused.ship.position).toEqual(pausedAtStart.ship.position);
    expect(paused.pauseReason).toBe('focus-lost');
    expect(resumed.simulationSteps).toBe(1);
    expect(resumed.droppedSimulationSeconds).toBe(moving.droppedSimulationSeconds);
  });

  it('limpa e rejeita comandos táticos durante pausa sem reproduzi-los ao retomar', () => {
    const session = createSession();
    session.advance(1 / 60, createInputSource());
    session.selectNextTarget();
    session.pause('manual');
    session.toggleActiveScan();
    session.useEquipment('torpedo');

    const paused = session.getSnapshot();
    session.resume();
    const resumed = session.advance(1 / 60, createInputSource());

    expect(paused.encounter.selectedContactId).toBeUndefined();
    expect(resumed.encounter.selectedContactId).toBeUndefined();
    expect(resumed.encounter.activeScan).toBe(false);
    expect(resumed.encounter.torpedoAmmo).toBe(6);
    expect(resumed.encounter.projectileCount).toBe(0);
  });

  it('preserva delta de ponteiro durante render frames sem passo de simulação', () => {
    const session = createSession();
    const input = createInputSource(NEUTRAL_CONTINUOUS_FLIGHT_INPUT, {
      pitchDegrees: 3,
      yawDegrees: -5,
    });

    const zeroStep = session.advance(1 / 144, input);
    const stillZeroStep = session.advance(1 / 144, input);
    const oneStep = session.advance(1 / 144, input);

    expect(zeroStep.simulationSteps).toBe(0);
    expect(stillZeroStep.simulationSteps).toBe(0);
    expect(input.consumeCount).toBe(1);
    expect(input.nonNeutralConsumeCount).toBe(1);
    expect(oneStep.simulationSteps).toBe(1);
  });

  it('consome a leitura discreta uma vez por passo e aplica o acumulado somente uma vez', () => {
    const session = createSession();
    const input = createInputSource(NEUTRAL_CONTINUOUS_FLIGHT_INPUT, {
      pitchDegrees: 2,
      yawDegrees: 4,
    });
    const snapshot = session.advance(1 / 30, input);

    expect(snapshot.simulationSteps).toBe(2);
    expect(input.consumeCount).toBe(2);
    expect(input.nonNeutralConsumeCount).toBe(1);
  });

  it('produz a mesma rotação de ponteiro com renderização a 30 e 144 FPS', () => {
    const simulate = (renderFps: number) => {
      const session = createSession();
      const input = createInputSource(NEUTRAL_CONTINUOUS_FLIGHT_INPUT, {
        pitchDegrees: -6,
        yawDegrees: 9,
      });
      for (let frame = 0; frame < renderFps; frame += 1) {
        session.advance(1 / renderFps, input);
      }
      return { input, snapshot: session.getSnapshot() };
    };
    const at30 = simulate(30);
    const at144 = simulate(144);

    expect(at30.input.nonNeutralConsumeCount).toBe(1);
    expect(at144.input.nonNeutralConsumeCount).toBe(1);
    expect(at144.snapshot.ship.orientationDegrees.x).toBeCloseTo(
      at30.snapshot.ship.orientationDegrees.x,
      8,
    );
    expect(at144.snapshot.ship.orientationDegrees.y).toBeCloseTo(
      at30.snapshot.ship.orientationDegrees.y,
      8,
    );
  });

  it('aplica preset e ajuste manual mantendo conservação', () => {
    const session = createSession();
    const balancedMultiplier = session.getSnapshot().energy.effects.enginePerformanceMultiplier;
    session.setEnergyProfile('escape', ENERGY_PRESETS.escape.allocation);
    const escape = session.getSnapshot();
    session.adjustEnergy('shields', 5);
    const custom = session.getSnapshot();

    expect(escape.energy.profileId).toBe('escape');
    expect(escape.energy.effects.enginePerformanceMultiplier).toBeGreaterThan(balancedMultiplier);
    expect(custom.energy.profileId).toBe('custom');
    expect(
      ENERGY_CHANNELS.reduce(
        (total, channel) => total + custom.energy.state.allocation[channel],
        0,
      ),
    ).toBeCloseTo(100, 10);
  });

  it('mantém sensores e encontro determinísticos com renderização a 30 e 144 FPS', () => {
    const simulate = (renderFps: number) => {
      const session = createSession();
      session.selectNextTarget();
      session.toggleActiveScan();
      for (let frame = 0; frame < renderFps * 3; frame += 1) {
        session.advance(1 / renderFps, createInputSource());
      }
      return session.getSnapshot();
    };
    const at30 = simulate(30);
    const at144 = simulate(144);
    expect(at30.encounter.contact.awareness).toBe('identified');
    expect(at144.encounter.contact.awareness).toBe('identified');
    expect(at144.encounter.contact.scanProgress).toBeCloseTo(
      at30.encounter.contact.scanProgress,
      10,
    );
    expect(at144.encounter.enemy.position.x).toBeCloseTo(at30.encounter.enemy.position.x, 8);
    expect(at144.encounter.enemy.position.z).toBeCloseTo(at30.encounter.enemy.position.z, 8);
  });
});
