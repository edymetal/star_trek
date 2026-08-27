export type RendererKind = 'hardware' | 'software' | 'unknown';

export interface GraphicsCapability {
  readonly rendererKind: RendererKind;
  readonly rendererName: string;
  readonly vendorName: string;
  readonly webGl2Available: boolean;
}

export type GraphicsReadinessReason =
  'renderer-unconfirmed' | 'software-renderer' | 'supported' | 'webgl2-unavailable';

export interface GraphicsReadiness {
  readonly reason: GraphicsReadinessReason;
  readonly status: 'blocked' | 'degraded' | 'ready';
}

const SOFTWARE_RENDERER_MARKERS = [
  'llvmpipe',
  'microsoft basic render',
  'software rasterizer',
  'swiftshader',
  'warp',
] as const;

const GENERIC_RENDERER_NAMES = [
  'angle',
  'mozilla',
  'não informado',
  'webkit webgl',
  'webgl',
  'webgl renderer',
] as const;

export function classifyRenderer(rendererName: string): RendererKind {
  const normalizedName = rendererName.trim().toLowerCase();

  if (
    normalizedName.length === 0 ||
    GENERIC_RENDERER_NAMES.some((name) => normalizedName === name)
  ) {
    return 'unknown';
  }

  return SOFTWARE_RENDERER_MARKERS.some((marker) => normalizedName.includes(marker))
    ? 'software'
    : 'hardware';
}

export function evaluateGraphicsReadiness(capability: GraphicsCapability): GraphicsReadiness {
  if (!capability.webGl2Available) {
    return { reason: 'webgl2-unavailable', status: 'blocked' };
  }

  if (capability.rendererKind === 'software') {
    return { reason: 'software-renderer', status: 'degraded' };
  }

  if (capability.rendererKind === 'unknown') {
    return { reason: 'renderer-unconfirmed', status: 'degraded' };
  }

  return { reason: 'supported', status: 'ready' };
}
