export interface FrameTimeProfile {
  readonly averageFps: number;
  readonly frameCount: number;
  readonly maximumFrameTimeMs: number;
  readonly p50FrameTimeMs: number;
  readonly p95FrameTimeMs: number;
  readonly p99FrameTimeMs: number;
  readonly sampleDurationMs: number;
}

function percentile(sortedValues: readonly number[], fraction: number): number {
  const index = Math.min(sortedValues.length - 1, Math.ceil(sortedValues.length * fraction) - 1);
  return sortedValues[Math.max(0, index)] ?? 0;
}

export class FrameTimeProfiler {
  readonly #capacity: number;
  readonly #samples: number[] = [];
  #nextIndex = 0;
  #sampleDurationMs = 0;

  constructor(capacity = 7_200) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new Error('A capacidade do profiler deve ser um inteiro positivo.');
    }
    this.#capacity = capacity;
  }

  record(frameTimeMs: number): void {
    if (!Number.isFinite(frameTimeMs) || frameTimeMs <= 0) return;
    if (this.#samples.length < this.#capacity) {
      this.#samples.push(frameTimeMs);
      this.#sampleDurationMs += frameTimeMs;
      return;
    }
    this.#sampleDurationMs -= this.#samples[this.#nextIndex] ?? 0;
    this.#samples[this.#nextIndex] = frameTimeMs;
    this.#sampleDurationMs += frameTimeMs;
    this.#nextIndex = (this.#nextIndex + 1) % this.#capacity;
  }

  reset(): void {
    this.#samples.length = 0;
    this.#nextIndex = 0;
    this.#sampleDurationMs = 0;
  }

  snapshot(): FrameTimeProfile | undefined {
    if (this.#samples.length === 0 || this.#sampleDurationMs <= 0) return undefined;
    const sorted = [...this.#samples].sort((left, right) => left - right);
    return {
      averageFps: (this.#samples.length * 1_000) / this.#sampleDurationMs,
      frameCount: this.#samples.length,
      maximumFrameTimeMs: sorted.at(-1) ?? 0,
      p50FrameTimeMs: percentile(sorted, 0.5),
      p95FrameTimeMs: percentile(sorted, 0.95),
      p99FrameTimeMs: percentile(sorted, 0.99),
      sampleDurationMs: this.#sampleDurationMs,
    };
  }
}
