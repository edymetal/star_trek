import { describe, expect, it } from 'vitest';

import { conditionLabel } from './condition-label';

describe('faixas de condição do HUD', () => {
  it.each([
    [100, 'íntegro'],
    [75, 'íntegro'],
    [74.999, 'avariado'],
    [35, 'avariado'],
    [34.999, 'crítico'],
    [0.001, 'crítico'],
    [0, 'destruído'],
    [-1, 'destruído'],
    [Number.NaN, 'destruído'],
  ] as const)('classifica %s%% como %s', (integrityPercent, expected) => {
    expect(conditionLabel(integrityPercent)).toBe(expected);
  });
});
