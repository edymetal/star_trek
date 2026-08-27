export class FpsMeter {
  readonly #sampleDurationMs: number;
  #frameCount = 0;
  #sampleStartedAtMs: number | undefined;

  constructor(sampleDurationMs = 750) {
    this.#sampleDurationMs = sampleDurationMs;
  }

  recordFrame(nowMs: number): number | undefined {
    this.#sampleStartedAtMs ??= nowMs;
    this.#frameCount += 1;

    const elapsedMs = nowMs - this.#sampleStartedAtMs;
    if (elapsedMs < this.#sampleDurationMs) {
      return undefined;
    }

    const fps = Math.round((this.#frameCount * 1_000) / elapsedMs);
    this.#frameCount = 0;
    this.#sampleStartedAtMs = nowMs;
    return fps;
  }
}
