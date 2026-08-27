import { describe, expect, it } from 'vitest';

import { ENERGY_PRESETS, PLAYER_ENERGY_DEFINITION } from '../../content/energy-content';
import {
  ENERGY_CHANNELS,
  adjustEnergyAllocation,
  createInitialEnergyState,
  normalizeEnergyAllocation,
  stepEnergySystems,
  type EnergySystemState,
} from './energy-system';

function allocationTotal(state: EnergySystemState): number {
  return ENERGY_CHANNELS.reduce((total, channel) => total + state.allocation[channel], 0);
}

describe('alocação de energia', () => {
  it('normaliza valores extremos, inválidos e negativos sem quebrar conservação', () => {
    const allocation = normalizeEnergyAllocation(
      {
        auxiliary: Number.NaN,
        engines: Number.POSITIVE_INFINITY,
        shields: -20,
        weapons: 8,
      },
      100,
    );

    expect(ENERGY_CHANNELS.every((channel) => Number.isFinite(allocation[channel]))).toBe(true);
    expect(ENERGY_CHANNELS.every((channel) => allocation[channel] >= 0)).toBe(true);
    expect(ENERGY_CHANNELS.reduce((total, channel) => total + allocation[channel], 0)).toBeCloseTo(
      100,
      10,
    );
    expect(allocation.weapons).toBe(100);
  });

  it('usa distribuição equilibrada quando nenhuma solicitação é válida', () => {
    expect(normalizeEnergyAllocation({}, 100)).toEqual({
      auxiliary: 25,
      engines: 25,
      shields: 25,
      weapons: 25,
    });
  });

  it('normaliza extremos finitos sem overflow, negativos ou perda da proporção', () => {
    const allocation = normalizeEnergyAllocation(
      {
        auxiliary: Number.MIN_VALUE,
        engines: Number.MAX_VALUE,
        shields: Number.MAX_VALUE / 2,
        weapons: Number.MAX_VALUE / 4,
      },
      100,
    );

    expect(ENERGY_CHANNELS.every((channel) => Number.isFinite(allocation[channel]))).toBe(true);
    expect(ENERGY_CHANNELS.every((channel) => allocation[channel] >= 0)).toBe(true);
    expect(ENERGY_CHANNELS.reduce((total, channel) => total + allocation[channel], 0)).toBeCloseTo(
      100,
      12,
    );
    expect(allocation.engines / allocation.shields).toBeCloseTo(2, 12);
    expect(allocation.shields / allocation.weapons).toBeCloseTo(2, 12);
  });

  it('ajusta um canal até os extremos redistribuindo os demais', () => {
    let allocation = ENERGY_PRESETS.balanced.allocation;
    allocation = adjustEnergyAllocation(allocation, 'engines', 500, 100);
    expect(allocation.engines).toBe(100);
    expect(ENERGY_CHANNELS.reduce((total, channel) => total + allocation[channel], 0)).toBeCloseTo(
      100,
      10,
    );

    allocation = adjustEnergyAllocation(allocation, 'engines', -500, 100);
    expect(allocation.engines).toBe(0);
    expect(ENERGY_CHANNELS.every((channel) => allocation[channel] >= 0)).toBe(true);
    expect(ENERGY_CHANNELS.reduce((total, channel) => total + allocation[channel], 0)).toBeCloseTo(
      100,
      10,
    );
  });

  it.each(Object.values(ENERGY_PRESETS))(
    'preset $id conserva exatamente a capacidade',
    (preset) => {
      const normalized = normalizeEnergyAllocation(
        preset.allocation,
        PLAYER_ENERGY_DEFINITION.allocationCapacityUnits,
      );
      expect(ENERGY_CHANNELS.reduce((total, channel) => total + normalized[channel], 0)).toBe(100);
    },
  );

  it('presets priorizam os sistemas declarados', () => {
    expect(ENERGY_PRESETS.attack.allocation.weapons).toBeGreaterThan(
      ENERGY_PRESETS.balanced.allocation.weapons,
    );
    expect(ENERGY_PRESETS.defense.allocation.shields).toBeGreaterThan(
      ENERGY_PRESETS.balanced.allocation.shields,
    );
    expect(ENERGY_PRESETS.escape.allocation.engines).toBeGreaterThan(
      ENERGY_PRESETS.balanced.allocation.engines,
    );
  });
});

describe('fluxo e efeitos de energia', () => {
  it('conserva geração, reserva, potência entregue, eficiência e perdas', () => {
    const state = createInitialEnergyState(PLAYER_ENERGY_DEFINITION, {
      integrity: { reactor: 0.5 },
      reserveUnits: 10,
    });
    const result = stepEnergySystems(PLAYER_ENERGY_DEFINITION, state, 0.1);
    const allocated = ENERGY_CHANNELS.reduce(
      (total, channel) => total + result.flow.channels[channel].allocatedUnitsPerSecond,
      0,
    );
    const accounted = ENERGY_CHANNELS.reduce(
      (total, channel) =>
        total +
        result.flow.channels[channel].effectiveUnitsPerSecond +
        result.flow.channels[channel].lostUnitsPerSecond,
      0,
    );

    expect(
      result.flow.reactorGeneratedUnitsPerSecond + result.flow.reserveDrawUnitsPerSecond,
    ).toBeCloseTo(result.flow.deliveredUnitsPerSecond, 10);
    expect(allocated).toBeCloseTo(result.flow.deliveredUnitsPerSecond, 10);
    expect(accounted).toBeCloseTo(result.flow.deliveredUnitsPerSecond, 10);
    expect(result.state.reserveUnits).toBeCloseTo(5, 10);
  });

  it('reserva limitada não cria energia quando o reator está danificado', () => {
    const state = createInitialEnergyState(PLAYER_ENERGY_DEFINITION, {
      integrity: { reactor: 0 },
      reserveUnits: 2,
    });
    const result = stepEnergySystems(PLAYER_ENERGY_DEFINITION, state, 1);

    expect(result.flow.reactorGeneratedUnitsPerSecond).toBe(0);
    expect(result.flow.reserveDrawUnitsPerSecond).toBe(2);
    expect(result.flow.deliveredUnitsPerSecond).toBe(2);
    expect(result.state.reserveUnits).toBe(0);
  });

  it('dano reduz eficiência e o efeito do canal correspondente', () => {
    const intact = createInitialEnergyState(PLAYER_ENERGY_DEFINITION, {
      allocation: ENERGY_PRESETS.escape.allocation,
    });
    const damaged = createInitialEnergyState(PLAYER_ENERGY_DEFINITION, {
      allocation: ENERGY_PRESETS.escape.allocation,
      integrity: { engines: 0.35 },
    });
    const intactStep = stepEnergySystems(PLAYER_ENERGY_DEFINITION, intact, 1 / 60);
    const damagedStep = stepEnergySystems(PLAYER_ENERGY_DEFINITION, damaged, 1 / 60);

    expect(damagedStep.flow.channels.engines.lostUnitsPerSecond).toBeGreaterThan(0);
    expect(damagedStep.effects.enginePerformanceMultiplier).toBeLessThan(
      intactStep.effects.enginePerformanceMultiplier,
    );
  });

  it.each(['jogador', 'IA'])('aplica integridade de 50%% uma única vez para %s', () => {
    const intact = stepEnergySystems(
      PLAYER_ENERGY_DEFINITION,
      createInitialEnergyState(PLAYER_ENERGY_DEFINITION),
      0,
    );
    const damaged = stepEnergySystems(
      PLAYER_ENERGY_DEFINITION,
      createInitialEnergyState(PLAYER_ENERGY_DEFINITION, {
        integrity: { shields: 0.5, weapons: 0.5 },
      }),
      0,
    );

    expect(damaged.flow.channels.shields.effectiveUnitsPerSecond).toBeCloseTo(
      intact.flow.channels.shields.effectiveUnitsPerSecond * 0.5,
      12,
    );
    expect(damaged.effects.shieldRegenerationUnitsPerSecond).toBeCloseTo(
      intact.effects.shieldRegenerationUnitsPerSecond * 0.5,
      12,
    );
    expect(damaged.flow.channels.weapons.effectiveUnitsPerSecond).toBeCloseTo(
      intact.flow.channels.weapons.effectiveUnitsPerSecond * 0.5,
      12,
    );
    expect(damaged.effects.weaponRechargeUnitsPerSecond).toBeCloseTo(
      intact.effects.weaponRechargeUnitsPerSecond * 0.5,
      12,
    );
  });

  it('energia de cada canal produz efeito observável e limitado', () => {
    const state = createInitialEnergyState(PLAYER_ENERGY_DEFINITION, {
      allocation: ENERGY_PRESETS.attack.allocation,
      shieldChargeUnits: 20,
      weaponCapacitorUnits: 20,
      weaponHeatUnits: 80,
    });
    const result = stepEnergySystems(PLAYER_ENERGY_DEFINITION, state, 1);

    expect(result.state.shieldChargeUnits).toBeGreaterThan(state.shieldChargeUnits);
    expect(result.state.weaponCapacitorUnits).toBeGreaterThan(state.weaponCapacitorUnits);
    expect(result.state.weaponHeatUnits).toBeLessThan(state.weaponHeatUnits);
    expect(result.effects.sensorRangeUnits).toBeGreaterThan(0);
    expect(result.effects.enginePerformanceMultiplier).toBeGreaterThan(0);
    expect(allocationTotal(result.state)).toBeCloseTo(100, 10);
  });

  it('integra regeneração e recarga independentemente da taxa de renderização', () => {
    const simulate = (fps: number) => {
      let state = createInitialEnergyState(PLAYER_ENERGY_DEFINITION, {
        shieldChargeUnits: 0,
        weaponCapacitorUnits: 0,
        weaponHeatUnits: 100,
      });
      for (let frame = 0; frame < fps * 3; frame += 1) {
        state = stepEnergySystems(PLAYER_ENERGY_DEFINITION, state, 1 / fps).state;
      }
      return state;
    };
    const at30 = simulate(30);
    const at144 = simulate(144);

    expect(at144.shieldChargeUnits).toBeCloseTo(at30.shieldChargeUnits, 9);
    expect(at144.weaponCapacitorUnits).toBeCloseTo(at30.weaponCapacitorUnits, 9);
    expect(at144.weaponHeatUnits).toBeCloseTo(at30.weaponHeatUnits, 9);
  });

  it('rejeita definição estruturalmente inválida', () => {
    expect(() =>
      createInitialEnergyState({
        ...PLAYER_ENERGY_DEFINITION,
        nominalReactorOutputUnitsPerSecond: Number.NaN,
      }),
    ).toThrow(/Definição de energia inválida/);
  });
});
