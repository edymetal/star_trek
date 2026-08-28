import { expect, test } from '@playwright/test';

import type { GraphicsPresetId } from '../../src/content/graphics-presets';

interface PhysicalBenchmarkConfiguration {
  readonly backend?: 'webgpu';
  readonly durationSeconds: number;
  readonly height: number;
  readonly presetId: GraphicsPresetId;
  readonly warmupSeconds: number;
  readonly width: number;
}

function boundedNumber(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}

function readConfiguration(): PhysicalBenchmarkConfiguration {
  const requestedPreset = process.env.BENCHMARK_PRESET;
  const requestedBackend = process.env.BENCHMARK_BACKEND;
  const presetId: GraphicsPresetId =
    requestedPreset === 'low' || requestedPreset === 'high' ? requestedPreset : 'medium';
  return {
    ...(requestedBackend === 'webgpu' ? { backend: requestedBackend } : {}),
    durationSeconds: boundedNumber(process.env.BENCHMARK_DURATION, 30, 10, 120),
    height: Math.round(boundedNumber(process.env.BENCHMARK_HEIGHT, 900, 720, 2160)),
    presetId,
    warmupSeconds: boundedNumber(process.env.BENCHMARK_WARMUP, 5, 1, 120),
    width: Math.round(boundedNumber(process.env.BENCHMARK_WIDTH, 1600, 1280, 3840)),
  };
}

test('mede o cenário P0.5 em uma janela física do Chrome', async ({ page }, testInfo) => {
  const configuration = readConfiguration();
  await page.setViewportSize({ width: configuration.width, height: configuration.height });
  const parameters = new URLSearchParams({
    benchmark: '1',
    duration: String(configuration.durationSeconds),
    preset: configuration.presetId,
    warmup: String(configuration.warmupSeconds),
  });
  if (configuration.backend !== undefined) parameters.set('backend', configuration.backend);
  await page.goto(`/?${parameters.toString()}`);

  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  await expect(root).toHaveAttribute('data-benchmark-state', 'complete', {
    timeout: (configuration.durationSeconds + configuration.warmupSeconds + 20) * 1_000,
  });

  const result = await page.evaluate((measuredConfiguration) => {
    const appRoot = document.querySelector<HTMLElement>('[data-app-root]');
    const readText = (selector: string): string =>
      document.querySelector<HTMLElement>(selector)?.textContent?.trim() ?? 'Não informado';
    return {
      ...measuredConfiguration,
      activeVfxCount: Number(appRoot?.dataset.activeVfx ?? 0),
      averageFps: Number(appRoot?.dataset.benchmarkAverageFps ?? 0),
      backend: readText('[data-diagnostic="backend"]'),
      browser: navigator.userAgent,
      drawCalls: Number(appRoot?.dataset.drawCalls ?? 0),
      p50FrameTimeMs: Number(appRoot?.dataset.benchmarkP50Ms ?? 0),
      p95FrameTimeMs: Number(appRoot?.dataset.benchmarkP95Ms ?? 0),
      p99FrameTimeMs: Number(appRoot?.dataset.benchmarkP99Ms ?? 0),
      renderer: readText('[data-diagnostic="renderer"]'),
    };
  }, configuration);

  expect(result.averageFps).toBeGreaterThan(0);
  expect(result.p50FrameTimeMs).toBeGreaterThan(0);
  expect(result.p95FrameTimeMs).toBeGreaterThan(0);
  expect(result.p99FrameTimeMs).toBeGreaterThan(0);
  expect(result.renderer).not.toMatch(/SwiftShader|software/i);
  await testInfo.attach('benchmark-result.json', {
    body: Buffer.from(JSON.stringify(result, null, 2)),
    contentType: 'application/json',
  });
  console.log(`BENCHMARK_RESULT ${JSON.stringify(result)}`);
});
