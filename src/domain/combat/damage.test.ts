import { describe, expect, it } from 'vitest';

import {
  applyImpact,
  createInitialDamageState,
  resolveShieldSector,
  stepDamageState,
  totalShieldCharge,
  type DamageDefinition,
} from './damage';

const DEFINITION: DamageDefinition = {
  hullCapacityPerSection: 25,
  shieldCapacityPerSector: 20,
  shieldRegenerationDelaySeconds: 2,
};
const ORIENTATION = { x: 0, y: 0, z: 0 };

describe('escudos direcionais e dano', () => {
  it('resolve frente, traseira, bombordo e estibordo pelo vetor de impacto', () => {
    expect(resolveShieldSector(ORIENTATION, { x: 0, y: 0, z: -1 })).toBe('front');
    expect(resolveShieldSector(ORIENTATION, { x: 0, y: 0, z: 1 })).toBe('rear');
    expect(resolveShieldSector(ORIENTATION, { x: -1, y: 0, z: 0 })).toBe('port');
    expect(resolveShieldSector(ORIENTATION, { x: 1, y: 0, z: 0 })).toBe('starboard');
    expect(resolveShieldSector({ x: 0, y: 90, z: 0 }, { x: -1, y: 0, z: 0 })).toBe('front');
  });

  it('absorve primeiro no setor e transfere somente excesso permitido ao casco', () => {
    const initial = createInitialDamageState(DEFINITION);
    const result = applyImpact(DEFINITION, initial, {
      amount: 30,
      orientationDegrees: ORIENTATION,
      overflowToHull: true,
      sourceDirectionWorld: { x: 0, y: 0, z: -1 },
    });
    expect(result.shieldSector).toBe('front');
    expect(result.hullSection).toBe('bow');
    expect(result.absorbedByShield).toBe(20);
    expect(result.appliedToHull).toBe(10);
    expect(result.state.hull.bow).toBe(15);
    expect(result.state.subsystems.sensors).toBeCloseTo(0.6);
  });

  it('bloqueia overflow quando a regra do equipamento não permite', () => {
    const result = applyImpact(DEFINITION, createInitialDamageState(DEFINITION), {
      amount: 30,
      orientationDegrees: ORIENTATION,
      overflowToHull: false,
      sourceDirectionWorld: { x: 1, y: 0, z: 0 },
    });
    expect(result.overflowDamage).toBe(10);
    expect(result.appliedToHull).toBe(0);
    expect(result.state.hull.starboard).toBe(25);
  });

  it('respeita atraso de regeneração e nunca excede capacidades', () => {
    const damaged = applyImpact(DEFINITION, createInitialDamageState(DEFINITION), {
      amount: 10,
      orientationDegrees: ORIENTATION,
      overflowToHull: true,
      sourceDirectionWorld: { x: 0, y: 0, z: -1 },
    }).state;
    const delayed = stepDamageState(DEFINITION, damaged, 1, 100);
    const regenerated = stepDamageState(DEFINITION, delayed, 1, 100);
    expect(totalShieldCharge(delayed)).toBe(70);
    expect(totalShieldCharge(regenerated)).toBe(80);
    expect(regenerated.shields.front).toBe(20);
  });

  it('destrói ao perder uma seção e reduz o subsistema associado a zero', () => {
    const result = applyImpact(DEFINITION, createInitialDamageState(DEFINITION), {
      amount: 150,
      orientationDegrees: ORIENTATION,
      overflowToHull: true,
      sourceDirectionWorld: { x: 0, y: 0, z: 1 },
    });
    expect(result.state.destroyed).toBe(true);
    expect(result.state.hull.stern).toBe(0);
    expect(result.state.subsystems.engines).toBe(0);
  });
});
