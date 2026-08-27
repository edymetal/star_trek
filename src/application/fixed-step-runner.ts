export interface FixedStepResult {
  readonly alpha: number;
  readonly droppedSeconds: number;
  readonly steps: number;
}

export interface FixedStepOptions {
  readonly fixedDeltaSeconds: number;
  readonly maxFrameDeltaSeconds: number;
  readonly maxStepsPerFrame: number;
}

export interface FixedStepRunner {
  advance(renderDeltaSeconds: number, step: (fixedDeltaSeconds: number) => void): FixedStepResult;
  reset(): void;
}

export function createFixedStepRunner(options: FixedStepOptions): FixedStepRunner {
  let accumulatorSeconds = 0;
  const comparisonTolerance = options.fixedDeltaSeconds * 1e-9;

  return {
    advance(renderDeltaSeconds, step) {
      const acceptedDelta = Math.min(Math.max(0, renderDeltaSeconds), options.maxFrameDeltaSeconds);
      let droppedSeconds = Math.max(0, renderDeltaSeconds - acceptedDelta);
      accumulatorSeconds += acceptedDelta;
      let steps = 0;

      while (
        accumulatorSeconds + comparisonTolerance >= options.fixedDeltaSeconds &&
        steps < options.maxStepsPerFrame
      ) {
        step(options.fixedDeltaSeconds);
        accumulatorSeconds = Math.max(0, accumulatorSeconds - options.fixedDeltaSeconds);
        steps += 1;
      }

      if (accumulatorSeconds >= options.fixedDeltaSeconds) {
        const retained = accumulatorSeconds % options.fixedDeltaSeconds;
        droppedSeconds += accumulatorSeconds - retained;
        accumulatorSeconds = retained;
      }

      return {
        alpha: accumulatorSeconds / options.fixedDeltaSeconds,
        droppedSeconds,
        steps,
      };
    },
    reset() {
      accumulatorSeconds = 0;
    },
  };
}
