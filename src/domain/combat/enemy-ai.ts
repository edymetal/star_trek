export type EnemyAiMode =
  'detecting' | 'pursuing' | 'orienting' | 'attacking' | 'redistributing' | 'retreating';

export interface EnemyAiDefinition {
  readonly attackRangeUnits: number;
  readonly attackSolution: number;
  readonly decisionIntervalSeconds: number;
  readonly redistributionDurationSeconds: number;
  readonly retreatHullFraction: number;
  readonly shieldRedistributionFraction: number;
}

export interface EnemyPerception {
  readonly distanceUnits: number;
  readonly firingSolution: number;
  readonly observedNow: boolean;
}

export interface EnemyAiState {
  readonly decisionCooldownSeconds: number;
  readonly mode: EnemyAiMode;
  readonly secondsInMode: number;
}

export interface EnemyAiContext {
  readonly deltaSeconds: number;
  readonly hullFraction: number;
  readonly perceivedTarget?: EnemyPerception;
  readonly shieldFraction: number;
}

export interface EnemyAiAction {
  readonly fireBeam: boolean;
  readonly movement: 'hold' | 'approach' | 'retreat';
  readonly requestedEnergyPreset?: 'attack' | 'defense' | 'escape';
  readonly targetSource: 'none' | 'remembered' | 'observed';
  readonly turnTowardTarget: boolean;
}

export interface EnemyAiStep {
  readonly action: EnemyAiAction;
  readonly state: EnemyAiState;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, Number.isFinite(value) ? value : 0));
}

function actionForMode(mode: EnemyAiMode, perception: EnemyPerception | undefined): EnemyAiAction {
  const targetSource =
    perception === undefined ? 'none' : perception.observedNow ? 'observed' : 'remembered';
  switch (mode) {
    case 'pursuing':
      return {
        fireBeam: false,
        movement: perception === undefined ? 'hold' : 'approach',
        targetSource,
        turnTowardTarget: perception !== undefined,
      };
    case 'orienting':
      return {
        fireBeam: false,
        movement: 'hold',
        targetSource,
        turnTowardTarget: perception !== undefined,
      };
    case 'attacking':
      return {
        fireBeam: perception?.observedNow === true,
        movement: 'hold',
        requestedEnergyPreset: 'attack',
        targetSource,
        turnTowardTarget: perception !== undefined,
      };
    case 'redistributing':
      return {
        fireBeam: false,
        movement: 'hold',
        requestedEnergyPreset: 'defense',
        targetSource,
        turnTowardTarget: perception !== undefined,
      };
    case 'retreating':
      return {
        fireBeam: false,
        movement: 'retreat',
        requestedEnergyPreset: 'escape',
        targetSource: 'none',
        turnTowardTarget: false,
      };
    default:
      return {
        fireBeam: false,
        movement: 'hold',
        targetSource: 'none',
        turnTowardTarget: false,
      };
  }
}

function decideMode(
  definition: EnemyAiDefinition,
  state: EnemyAiState,
  context: EnemyAiContext,
): EnemyAiMode {
  if (clamp(context.hullFraction, 0, 1) <= definition.retreatHullFraction) {
    return 'retreating';
  }
  if (context.perceivedTarget === undefined) {
    return 'detecting';
  }
  if (
    state.mode !== 'redistributing' &&
    clamp(context.shieldFraction, 0, 1) <= definition.shieldRedistributionFraction
  ) {
    return 'redistributing';
  }
  if (
    state.mode === 'redistributing' &&
    state.secondsInMode < definition.redistributionDurationSeconds
  ) {
    return 'redistributing';
  }
  if (!context.perceivedTarget.observedNow) {
    return context.perceivedTarget.distanceUnits > definition.attackRangeUnits
      ? 'pursuing'
      : 'orienting';
  }
  if (context.perceivedTarget.distanceUnits > definition.attackRangeUnits) {
    return 'pursuing';
  }
  if (context.perceivedTarget.firingSolution < definition.attackSolution) {
    return 'orienting';
  }
  return 'attacking';
}

export function createInitialEnemyAiState(): EnemyAiState {
  return { decisionCooldownSeconds: 0, mode: 'detecting', secondsInMode: 0 };
}

export function stepEnemyAi(
  definition: EnemyAiDefinition,
  state: EnemyAiState,
  context: EnemyAiContext,
): EnemyAiStep {
  const deltaSeconds = Math.max(
    0,
    Number.isFinite(context.deltaSeconds) ? context.deltaSeconds : 0,
  );
  const cooldown = Math.max(0, state.decisionCooldownSeconds - deltaSeconds);
  const elapsedState = {
    ...state,
    decisionCooldownSeconds: cooldown,
    secondsInMode: state.secondsInMode + deltaSeconds,
  };
  const lostLiveTrack =
    context.perceivedTarget === undefined ||
    (state.mode === 'attacking' && !context.perceivedTarget.observedNow);
  if (cooldown > 0 && !lostLiveTrack) {
    return {
      action: actionForMode(state.mode, context.perceivedTarget),
      state: elapsedState,
    };
  }
  const mode = decideMode(definition, elapsedState, context);
  const nextState: EnemyAiState = {
    decisionCooldownSeconds: definition.decisionIntervalSeconds,
    mode,
    secondsInMode: mode === state.mode ? elapsedState.secondsInMode : 0,
  };
  return { action: actionForMode(mode, context.perceivedTarget), state: nextState };
}
