import type { GraphicsPresetId } from '../content/graphics-presets';

export interface BenchmarkStartupOptions {
  readonly durationSeconds: number;
  readonly enabled: true;
  readonly warmupSeconds: number;
}

export interface StartupOptions {
  readonly benchmark?: BenchmarkStartupOptions;
  readonly requestedBackend?: 'webgpu';
  readonly requestedPresetId?: GraphicsPresetId;
}

const MINIMUM_SAMPLE_SECONDS = 1;
const MAXIMUM_SAMPLE_SECONDS = 120;
const DEFAULT_SAMPLE_SECONDS = 30;
const DEFAULT_WARMUP_SECONDS = 5;

function parseBoundedSeconds(value: string | null, fallback: number): number {
  if (value === null || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(MAXIMUM_SAMPLE_SECONDS, Math.max(MINIMUM_SAMPLE_SECONDS, parsed));
}

function parsePresetId(value: string | null): GraphicsPresetId | undefined {
  return value === 'low' || value === 'medium' || value === 'high' ? value : undefined;
}

export function parseStartupOptions(search: string): StartupOptions {
  const parameters = new URLSearchParams(search);
  const requestedPresetId = parsePresetId(parameters.get('preset'));
  const requestedBackend = parameters.get('backend') === 'webgpu' ? 'webgpu' : undefined;
  const benchmarkEnabled = parameters.get('benchmark') === '1';

  return {
    ...(benchmarkEnabled
      ? {
          benchmark: {
            durationSeconds: parseBoundedSeconds(
              parameters.get('duration'),
              DEFAULT_SAMPLE_SECONDS,
            ),
            enabled: true as const,
            warmupSeconds: parseBoundedSeconds(parameters.get('warmup'), DEFAULT_WARMUP_SECONDS),
          },
        }
      : {}),
    ...(requestedPresetId === undefined ? {} : { requestedPresetId }),
    ...(requestedBackend === undefined ? {} : { requestedBackend }),
  };
}
