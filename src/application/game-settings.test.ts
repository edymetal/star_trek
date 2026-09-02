import { describe, expect, it } from 'vitest';

import {
  controlBindingLabel,
  createDefaultGameSettings,
  createGameSettingsEnvelope,
  decodeGameSettings,
  formatControlHints,
  parseGameSettings,
} from './game-settings';

describe('game settings', () => {
  it('formata instruções com os atalhos ativos sem acoplar conteúdo ao teclado padrão', () => {
    const settings = createDefaultGameSettings('medium');
    const remapped = {
      ...settings.controlBindings,
      'select-target': 'KeyY',
      tractor: 'Digit6',
    } as const;

    expect(
      formatControlHints('Selecione com {select-target} e use trator em {tractor}.', remapped),
    ).toBe('Selecione com Y e use trator em 6.');
    expect(controlBindingLabel('KeyY')).toBe('Y');
    expect(controlBindingLabel('CodeFuturo')).toBe('CodeFuturo');
  });

  it('cria defaults válidos e faz round-trip do schema v2', () => {
    const settings = createDefaultGameSettings('medium');
    const envelope = createGameSettingsEnvelope(settings);

    expect(envelope.schemaVersion).toBe(2);
    expect(decodeGameSettings(JSON.parse(JSON.stringify(envelope)))).toEqual({
      envelope,
      status: 'ready',
    });
  });

  it('migra o schema v1 para mute desativado sem perder preferências', () => {
    const current = createDefaultGameSettings('high');
    const { audioMuted, ...legacy } = current;
    expect(audioMuted).toBe(false);

    expect(decodeGameSettings({ schemaVersion: 1, settings: legacy })).toEqual({
      envelope: createGameSettingsEnvelope(current),
      status: 'migrated',
    });
  });

  it('rejeita versão futura, valores fora da faixa e opções desconhecidas', () => {
    const settings = createDefaultGameSettings('low');

    expect(decodeGameSettings({ schemaVersion: 3, settings })).toEqual({
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
