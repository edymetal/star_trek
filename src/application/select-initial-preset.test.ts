import { describe, expect, it } from 'vitest';

import type { GraphicsCapability } from '../domain/graphics-readiness';
import { selectInitialPreset } from './select-initial-preset';

const baseCapability: GraphicsCapability = {
  rendererKind: 'hardware',
  rendererName: 'ANGLE (NVIDIA, NVIDIA GeForce MX130)',
  vendorName: 'Google Inc. (NVIDIA)',
  webGl2Available: true,
};

describe('selectInitialPreset', () => {
  it('respeita a escolha explícita usada pelo benchmark', () => {
    expect(selectInitialPreset(baseCapability, 'high')).toBe('high');
  });

  it('seleciona médio para a GPU dedicada alvo', () => {
    expect(selectInitialPreset(baseCapability)).toBe('medium');
  });

  it('seleciona baixo para a UHD 620', () => {
    expect(
      selectInitialPreset({
        ...baseCapability,
        rendererName: 'ANGLE (Intel, Intel UHD Graphics 620)',
      }),
    ).toBe('low');
  });

  it('seleciona baixo quando a aceleração é por software', () => {
    expect(selectInitialPreset({ ...baseCapability, rendererKind: 'software' })).toBe('low');
  });
});
