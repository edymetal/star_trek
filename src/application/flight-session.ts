import {
  integrateShipFlight,
  interpolateShipState,
  vectorLength,
  type ContinuousFlightInput,
  type PointerLookDelta,
  type ShipDefinition,
  type ShipState,
} from '../domain/flight/ship-flight';
import {
  adjustEnergyAllocation,
  setEnergyAllocation,
  stepEnergySystems,
  type EnergyAllocation,
  type EnergyChannelId,
  type EnergyEffects,
  type EnergyFlow,
  type EnergyPresetId,
  type EnergySystemDefinition,
  type EnergySystemState,
} from '../domain/energy/energy-system';
import { createFixedStepRunner } from './fixed-step-runner';
import type {
  EncounterCommand,
  EncounterSession,
  EncounterSnapshot,
  EncounterStepContext,
} from './encounter-session';

export type PauseReason =
  'focus-lost' | 'manual' | 'mission-complete' | 'mission-transition' | undefined;

export interface FlightSessionSnapshot {
  readonly boundaryDistanceUnits: number;
  readonly droppedSimulationSeconds: number;
  readonly energy: FlightEnergySnapshot;
  readonly encounter: EncounterSnapshot;
  readonly pauseReason: PauseReason;
  readonly paused: boolean;
  readonly ship: ShipState;
  readonly simulationSteps: number;
  readonly speedUnitsPerSecond: number;
}

export type EnergyProfileId = EnergyPresetId | 'custom';

export interface FlightEnergySnapshot {
  readonly effects: EnergyEffects;
  readonly flow: EnergyFlow;
  readonly profileId: EnergyProfileId;
  readonly state: EnergySystemState;
}

export interface FlightSession {
  adjustEnergy(channel: EnergyChannelId, deltaUnits: number): void;
  advance(renderDeltaSeconds: number, input: FlightInputSource): FlightSessionSnapshot;
  clearTarget(): void;
  getSnapshot(): FlightSessionSnapshot;
  pause(reason: Exclude<PauseReason, undefined>): void;
  restartEncounter(): void;
  resume(): void;
  selectNextTarget(): void;
  setEnergyProfile(profileId: EnergyPresetId, allocation: EnergyAllocation): void;
  toggleActiveScan(): void;
  toggleManualPause(): void;
  useEquipment(equipmentId: 'beam' | 'torpedo' | 'tractor'): void;
}

export interface FlightInputSource {
  consumePointerDelta(): PointerLookDelta;
  readContinuousInput(): ContinuousFlightInput;
}

export interface FlightSessionOptions {
  readonly arenaRadiusUnits: number;
  readonly definition: ShipDefinition;
  readonly energyDefinition: EnergySystemDefinition;
  readonly encounter: EncounterSession;
  readonly initialEnergyState: EnergySystemState;
  readonly initialState: ShipState;
}

export function createFlightSession(options: FlightSessionOptions): FlightSession {
  const fixedStep = createFixedStepRunner({
    fixedDeltaSeconds: 1 / 60,
    maxFrameDeltaSeconds: 0.25,
    maxStepsPerFrame: 15,
  });
  let current = options.initialState;
  let energyState = options.initialEnergyState;
  let energyStep = stepEnergySystems(options.energyDefinition, energyState, 0);
  let energyProfileId: EnergyProfileId = 'balanced';
  let previous = current;
  let displayed = current;
  let pauseReason: PauseReason;
  let droppedSimulationSeconds = 0;
  let simulationSteps = 0;
  let pendingEncounterCommands: EncounterCommand[] = [];

  function encounterContext(deltaSeconds: number): EncounterStepContext {
    return {
      deltaSeconds,
      playerEnergyEffects: energyStep.effects,
      playerEnergyFlow: energyStep.flow,
      playerEnergyState: energyState,
      playerShip: current,
    };
  }

  function queueEncounterCommand(command: EncounterCommand): void {
    if (pauseReason !== undefined) return;
    pendingEncounterCommands.push(command);
  }

  function snapshot(): FlightSessionSnapshot {
    return {
      boundaryDistanceUnits:
        options.arenaRadiusUnits -
        options.definition.collisionRadiusUnits -
        vectorLength(current.position),
      droppedSimulationSeconds,
      energy: {
        effects: energyStep.effects,
        flow: energyStep.flow,
        profileId: energyProfileId,
        state: energyState,
      },
      encounter: options.encounter.getSnapshot(),
      pauseReason,
      paused: pauseReason !== undefined,
      ship: displayed,
      simulationSteps,
      speedUnitsPerSecond: vectorLength(current.velocity),
    };
  }

  return {
    adjustEnergy(channel, deltaUnits) {
      energyState = setEnergyAllocation(
        options.energyDefinition,
        energyState,
        adjustEnergyAllocation(
          energyState.allocation,
          channel,
          deltaUnits,
          options.energyDefinition.allocationCapacityUnits,
        ),
      );
      energyStep = stepEnergySystems(options.energyDefinition, energyState, 0);
      energyProfileId = 'custom';
    },
    advance(renderDeltaSeconds, input) {
      if (pauseReason !== undefined) {
        fixedStep.reset();
        previous = current;
        displayed = current;
        simulationSteps = 0;
        return snapshot();
      }

      const result = fixedStep.advance(renderDeltaSeconds, (fixedDeltaSeconds) => {
        const continuousInput = input.readContinuousInput();
        const pointerDelta = input.consumePointerDelta();
        energyStep = stepEnergySystems(options.energyDefinition, energyState, fixedDeltaSeconds);
        energyState = energyStep.state;
        previous = current;
        current = integrateShipFlight({
          arenaRadiusUnits: options.arenaRadiusUnits,
          definition: options.definition,
          deltaSeconds: fixedDeltaSeconds,
          enginePerformanceMultiplier: energyStep.effects.enginePerformanceMultiplier,
          input: { ...continuousInput, ...pointerDelta },
          state: current,
        });
        const encounterStep = options.encounter.step(encounterContext(fixedDeltaSeconds));
        energyState = encounterStep.playerEnergyState;
        for (const command of pendingEncounterCommands) {
          energyState = options.encounter.applyCommand(
            command,
            encounterContext(0),
          ).playerEnergyState;
        }
        pendingEncounterCommands = [];
      });
      displayed = interpolateShipState(previous, current, result.alpha);
      droppedSimulationSeconds += result.droppedSeconds;
      simulationSteps = result.steps;
      return snapshot();
    },
    getSnapshot: snapshot,
    clearTarget() {
      queueEncounterCommand({ type: 'clear-target' });
    },
    pause(reason) {
      pauseReason = reason;
      pendingEncounterCommands = [];
      fixedStep.reset();
      previous = current;
      displayed = current;
      simulationSteps = 0;
    },
    restartEncounter() {
      options.encounter.restart();
      current = options.initialState;
      previous = current;
      displayed = current;
      energyState = options.initialEnergyState;
      energyStep = stepEnergySystems(options.energyDefinition, energyState, 0);
      energyProfileId = 'balanced';
      pauseReason = undefined;
      droppedSimulationSeconds = 0;
      simulationSteps = 0;
      pendingEncounterCommands = [];
      fixedStep.reset();
    },
    resume() {
      pauseReason = undefined;
      pendingEncounterCommands = [];
      fixedStep.reset();
    },
    selectNextTarget() {
      queueEncounterCommand({ type: 'select-next-target' });
    },
    setEnergyProfile(profileId, allocation) {
      energyState = setEnergyAllocation(options.energyDefinition, energyState, allocation);
      energyStep = stepEnergySystems(options.energyDefinition, energyState, 0);
      energyProfileId = profileId;
    },
    toggleActiveScan() {
      queueEncounterCommand({ type: 'toggle-scan' });
    },
    toggleManualPause() {
      if (pauseReason === undefined) {
        pauseReason = 'manual';
        pendingEncounterCommands = [];
        fixedStep.reset();
        previous = current;
        displayed = current;
        simulationSteps = 0;
      } else {
        pauseReason = undefined;
        pendingEncounterCommands = [];
        fixedStep.reset();
      }
    },
    useEquipment(equipmentId) {
      queueEncounterCommand({ equipmentId, type: 'use-equipment' });
    },
  };
}
