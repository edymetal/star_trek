import { describe, expect, it } from 'vitest';

import {
  combinePresentationEffects,
  createPresentationEffectRetainer,
  didPlayerEquipmentActivate,
} from './presentation-effect-retainer';

const tractorEffect = {
  kind: 'tractor' as const,
  remainingSeconds: 0.01,
  serial: 4,
  targetPosition: { x: 2, y: 3, z: 4 },
};

describe('retenção de efeito apenas para apresentação', () => {
  it('retém um efeito aceito sem alterar seu alvo ou serial', () => {
    const retainer = createPresentationEffectRetainer(0.65);
    retainer.capture('tractor', tractorEffect);
    expect(retainer.step(0.1, false, 'active')).toEqual([
      { ...tractorEffect, remainingSeconds: 0.55 },
    ]);
  });

  it('ignora efeito de outro equipamento e expira no tempo visual', () => {
    const retainer = createPresentationEffectRetainer(0.2);
    retainer.capture('beam', tractorEffect);
    expect(retainer.step(0.1, false, 'active')).toEqual([]);
    retainer.capture('tractor', tractorEffect);
    expect(retainer.step(0.2, false, 'active')).toEqual([]);
  });

  it('congela com a pausa e limpa no terminal', () => {
    const retainer = createPresentationEffectRetainer(0.65);
    retainer.capture('tractor', tractorEffect);
    expect(retainer.step(10, true, 'active')[0]?.remainingSeconds).toBe(0.65);
    expect(retainer.step(0, false, 'victory')).toEqual([]);
  });

  it('preserva efeitos simultâneos em uma coleção visual limitada', () => {
    const retainer = createPresentationEffectRetainer(0.65, 2);
    retainer.capture('beam', {
      ...tractorEffect,
      kind: 'beam',
      serial: 5,
    });
    retainer.capture('tractor', tractorEffect);
    expect(retainer.step(0, false, 'active').map((effect) => effect.kind)).toEqual([
      'beam',
      'tractor',
    ]);

    retainer.capture('torpedo', {
      ...tractorEffect,
      kind: 'torpedo',
      serial: 6,
    });
    expect(retainer.step(0, false, 'active').map((effect) => effect.kind)).toEqual([
      'tractor',
      'torpedo',
    ]);
  });

  it('combina o efeito autoritativo com o retido sem duplicar o mesmo disparo', () => {
    const enemyBeam = {
      ...tractorEffect,
      kind: 'enemy-beam' as const,
      serial: 9,
    };
    expect(combinePresentationEffects(enemyBeam, [tractorEffect])).toEqual([
      enemyBeam,
      tractorEffect,
    ]);
    expect(combinePresentationEffects(tractorEffect, [tractorEffect])).toEqual([tractorEffect]);
  });

  it('prioriza o efeito retido mais recente quando o pool visual está cheio', () => {
    const beam = { ...tractorEffect, kind: 'beam' as const, serial: 5 };
    const torpedo = { ...tractorEffect, kind: 'torpedo' as const, serial: 6 };
    const enemyBeam = { ...tractorEffect, kind: 'enemy-beam' as const, serial: 7 };

    expect(combinePresentationEffects(undefined, [tractorEffect, beam, torpedo])).toEqual([
      beam,
      torpedo,
    ]);
    expect(combinePresentationEffects(enemyBeam, [tractorEffect, beam, torpedo])).toEqual([
      enemyBeam,
      torpedo,
    ]);
  });

  it('confirma efeitos do jogador apenas por resultados públicos observáveis', () => {
    const before = {
      enemyHullPercent: 100,
      enemyShieldPercent: 80,
      torpedoAmmo: 6,
      tractorActive: false,
    };
    expect(didPlayerEquipmentActivate('beam', before, { ...before, enemyShieldPercent: 76 })).toBe(
      true,
    );
    expect(didPlayerEquipmentActivate('torpedo', before, { ...before, torpedoAmmo: 5 })).toBe(true);
    expect(didPlayerEquipmentActivate('tractor', before, { ...before, tractorActive: true })).toBe(
      true,
    );
    expect(didPlayerEquipmentActivate('beam', before, before)).toBe(false);
    expect(didPlayerEquipmentActivate('torpedo', before, before)).toBe(false);
    expect(didPlayerEquipmentActivate('tractor', before, before)).toBe(false);
  });
});
