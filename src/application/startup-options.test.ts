import { describe, expect, it } from 'vitest';

import { parseStartupOptions } from './startup-options';

describe('startup options', () => {
  it('mantém o jogo normal sem parâmetros', () => {
    expect(parseStartupOptions('')).toEqual({});
  });

  it('aceita os três presets sem habilitar benchmark implicitamente', () => {
    expect(parseStartupOptions('?preset=high&backend=webgpu')).toEqual({
      requestedBackend: 'webgpu',
      requestedPresetId: 'high',
    });
    expect(parseStartupOptions('?preset=invalid')).toEqual({});
  });

  it('cria benchmark determinístico com duração limitada', () => {
    expect(parseStartupOptions('?benchmark=1&preset=medium&duration=0.2&warmup=999')).toEqual({
      benchmark: { durationSeconds: 1, enabled: true, warmupSeconds: 120 },
      requestedPresetId: 'medium',
    });
  });

  it('usa durações seguras quando os valores não são numéricos', () => {
    expect(parseStartupOptions('?benchmark=1&duration=nope&warmup=')).toEqual({
      benchmark: { durationSeconds: 30, enabled: true, warmupSeconds: 5 },
    });
  });
});
