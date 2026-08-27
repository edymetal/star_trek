import type { GraphicsPresetId } from '../content/graphics-presets';
import type { GraphicsCapability } from '../domain/graphics-readiness';

export function selectInitialPreset(capability: GraphicsCapability): GraphicsPresetId {
  if (!capability.webGl2Available || capability.rendererKind !== 'hardware') {
    return 'low';
  }

  const rendererName = capability.rendererName.toLowerCase();
  return rendererName.includes('nvidia') || rendererName.includes('geforce') ? 'medium' : 'low';
}
