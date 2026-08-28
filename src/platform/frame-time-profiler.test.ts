import { describe, expect, it } from 'vitest';

import { FrameTimeProfiler } from './frame-time-profiler';

describe('frame time profiler', () => {
  it('calcula FPS e percentis de frametime', () => {
    const profiler = new FrameTimeProfiler();
    for (const sample of [10, 20, 30, 40, 50]) profiler.record(sample);

    expect(profiler.snapshot()).toEqual({
      averageFps: 100 / 3,
      frameCount: 5,
      maximumFrameTimeMs: 50,
      p50FrameTimeMs: 30,
      p95FrameTimeMs: 50,
      p99FrameTimeMs: 50,
      sampleDurationMs: 150,
    });
  });

  it('ignora amostras inválidas e nunca cresce além da capacidade', () => {
    const profiler = new FrameTimeProfiler(3);
    for (const sample of [Number.NaN, 0, -2, 10, 20, 30, 40]) profiler.record(sample);

    expect(profiler.snapshot()).toMatchObject({
      averageFps: 100 / 3,
      frameCount: 3,
      maximumFrameTimeMs: 40,
      p50FrameTimeMs: 30,
      p95FrameTimeMs: 40,
      sampleDurationMs: 90,
    });
  });

  it('pode ser reiniciado entre aquecimento e medição', () => {
    const profiler = new FrameTimeProfiler();
    profiler.record(16);
    profiler.reset();

    expect(profiler.snapshot()).toBeUndefined();
  });

  it('rejeita capacidade inválida', () => {
    expect(() => new FrameTimeProfiler(0)).toThrow(/inteiro positivo/);
  });
});
