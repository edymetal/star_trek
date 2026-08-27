import { describe, expect, it } from 'vitest';

import {
  classifyRenderer,
  evaluateGraphicsReadiness,
  type GraphicsCapability,
} from './graphics-readiness';

function createCapability(overrides: Partial<GraphicsCapability> = {}): GraphicsCapability {
  return {
    rendererKind: 'hardware',
    rendererName: 'NVIDIA GeForce MX130',
    vendorName: 'NVIDIA',
    webGl2Available: true,
    ...overrides,
  };
}

describe('classifyRenderer', () => {
  it.each(['SwiftShader Device', 'ANGLE (Microsoft Basic Render Driver)', 'llvmpipe'])(
    'classifica %s como renderização por software',
    (rendererName) => {
      expect(classifyRenderer(rendererName)).toBe('software');
    },
  );

  it('classifica a MX130 como hardware', () => {
    expect(classifyRenderer('ANGLE (NVIDIA, NVIDIA GeForce MX130)')).toBe('hardware');
  });

  it.each(['Não informado', 'WebKit WebGL', 'WebGL Renderer', 'ANGLE'])(
    'mantém o nome genérico %s como desconhecido',
    (rendererName) => {
      expect(classifyRenderer(rendererName)).toBe('unknown');
    },
  );
});

describe('evaluateGraphicsReadiness', () => {
  it('bloqueia quando WebGL 2 não está disponível', () => {
    expect(evaluateGraphicsReadiness(createCapability({ webGl2Available: false }))).toEqual({
      reason: 'webgl2-unavailable',
      status: 'blocked',
    });
  });

  it('degrada sem bloquear quando o renderizador é software', () => {
    expect(evaluateGraphicsReadiness(createCapability({ rendererKind: 'software' }))).toEqual({
      reason: 'software-renderer',
      status: 'degraded',
    });
  });

  it('degrada com razão distinta quando o renderizador não pode ser confirmado', () => {
    expect(evaluateGraphicsReadiness(createCapability({ rendererKind: 'unknown' }))).toEqual({
      reason: 'renderer-unconfirmed',
      status: 'degraded',
    });
  });

  it('aprova WebGL 2 acelerado por hardware', () => {
    expect(evaluateGraphicsReadiness(createCapability())).toEqual({
      reason: 'supported',
      status: 'ready',
    });
  });
});
