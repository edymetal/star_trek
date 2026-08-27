import { describe, expect, it } from 'vitest';

import { hasLineOfSight, type SphericalLineOfSightObstacle } from './line-of-sight';

const origin = { x: 0, y: 0, z: 0 };
const target = { x: 0, y: 0, z: -20 };

function obstacle(z: number, x = 0): SphericalLineOfSightObstacle {
  return { center: { x, y: 0, z }, id: `obstacle-${x}-${z}`, radiusUnits: 2 };
}

describe('linha de visão por volumes simples', () => {
  it('bloqueia quando uma esfera intercepta o segmento entre origem e alvo', () => {
    expect(hasLineOfSight(origin, target, [obstacle(-10)])).toBe(false);
  });

  it('ignora volumes fora do segmento, atrás do alvo ou com raio inválido', () => {
    expect(
      hasLineOfSight(origin, target, [
        obstacle(-10, 3),
        obstacle(-24),
        { ...obstacle(-10), radiusUnits: Number.NaN },
      ]),
    ).toBe(true);
  });

  it('bloqueia quando origem ou alvo está dentro do volume', () => {
    expect(hasLineOfSight(origin, target, [obstacle(0)])).toBe(false);
    expect(hasLineOfSight(origin, target, [obstacle(-20)])).toBe(false);
    expect(hasLineOfSight(origin, origin, [obstacle(0)])).toBe(false);
  });

  it('considera tangência uma obstrução e ignora esfera de raio zero', () => {
    expect(hasLineOfSight(origin, target, [obstacle(-10, 2)])).toBe(false);
    expect(
      hasLineOfSight(origin, target, [
        { center: { x: 0, y: 0, z: -10 }, id: 'point', radiusUnits: 0 },
      ]),
    ).toBe(true);
  });
});
