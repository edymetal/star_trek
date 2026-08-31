import { describe, expect, it } from 'vitest';

import {
  createDefaultGameSettings,
  createGameSettingsEnvelope,
  decodeGameSettings,
  parseGameSettings,
} from './game-settings';

describe('game settings', () => {
  it('cria defaults válidos e faz round-trip do schema v1', () => {
    const settings = createDefaultGameSettings('medium');
    const envelope = createGameSettingsEnvelope(settings);

    expect(envelope.schemaVersion).toBe(1);
    expect(decodeGameSettings(JSON.parse(JSON.stringify(envelope)))).toEqual({
      envelope,
      status: 'ready',
    });
  });

  it('rejeita versão futura, valores fora da faixa e opções desconhecidas', () => {
    const settings = createDefaultGameSettings('low');

    expect(decodeGameSettings({ schemaVersion: 2, settings })).toEqual({
      reason: 'unsupported-version',
      status: 'invalid',
    });
    expect(parseGameSettings({ ...settings, hudScalePercent: 200 })).toBeUndefined();
    expect(parseGameSettings({ ...settings, particleDensity: 'ilimitada' })).toBeUndefined();
    expect(parseGameSettings({ ...settings, mouseSensitivity: Number.NaN })).toBeUndefined();
  });

  it('rejeita teclas desconhecidas e conflitos entre comandos remapeáveis', () => {
    const settings = createDefaultGameSettings('high');

    expect(
      parseGameSettings({
        ...settings,
        controlBindings: { ...settings.controlBindings, beam: 'KeyW' },
      }),
    ).toBeUndefined();
    expect(
      parseGameSettings({
        ...settings,
        controlBindings: {
          ...settings.controlBindings,
          beam: settings.controlBindings.torpedo,
        },
      }),
    ).toBeUndefined();
  });
});
