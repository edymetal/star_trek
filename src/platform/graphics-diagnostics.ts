import { classifyRenderer, type GraphicsCapability } from '../domain/graphics-readiness';

const NOT_REPORTED = 'Não informado';

function readContextString(context: WebGL2RenderingContext, parameter: number): string {
  const value: unknown = context.getParameter(parameter);
  return typeof value === 'string' && value.trim().length > 0 ? value : NOT_REPORTED;
}

export function inspectWebGl2Capability(): GraphicsCapability {
  const probeCanvas = document.createElement('canvas');
  probeCanvas.width = 1;
  probeCanvas.height = 1;

  const context = probeCanvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    failIfMajorPerformanceCaveat: false,
    powerPreference: 'high-performance',
  });

  if (context === null) {
    return {
      rendererKind: 'unknown',
      rendererName: NOT_REPORTED,
      vendorName: NOT_REPORTED,
      webGl2Available: false,
    };
  }

  const debugRendererInfo = context.getExtension('WEBGL_debug_renderer_info');
  const rendererName =
    debugRendererInfo === null
      ? readContextString(context, context.RENDERER)
      : readContextString(context, debugRendererInfo.UNMASKED_RENDERER_WEBGL);
  const vendorName =
    debugRendererInfo === null
      ? readContextString(context, context.VENDOR)
      : readContextString(context, debugRendererInfo.UNMASKED_VENDOR_WEBGL);

  context.getExtension('WEBGL_lose_context')?.loseContext();

  return {
    rendererKind: debugRendererInfo === null ? 'unknown' : classifyRenderer(rendererName),
    rendererName,
    vendorName,
    webGl2Available: true,
  };
}
