import type {
  EnergyAllocation,
  EnergyPresetId,
  EnergySystemDefinition,
} from '../domain/energy/energy-system';

export const PLAYER_ENERGY_DEFINITION: EnergySystemDefinition = {
  allocationCapacityUnits: 100,
  baseSensorRangeUnits: 110,
  nominalReactorOutputUnitsPerSecond: 100,
  reserveCapacityUnits: 30,
  shieldCapacityUnits: 100,
  shieldRegenerationUnitsPerSecondAtBalanced: 2.4,
  weaponCapacitorCapacityUnits: 100,
  weaponCoolingUnitsPerSecondAtBalanced: 2.2,
  weaponRechargeUnitsPerSecondAtBalanced: 3.2,
};

export interface EnergyPresetDefinition {
  readonly allocation: EnergyAllocation;
  readonly id: EnergyPresetId;
  readonly label: string;
}

export const ENERGY_PRESETS: Readonly<Record<EnergyPresetId, EnergyPresetDefinition>> = {
  attack: {
    allocation: { auxiliary: 15, engines: 20, shields: 20, weapons: 45 },
    id: 'attack',
    label: 'Ataque',
  },
  balanced: {
    allocation: { auxiliary: 25, engines: 25, shields: 25, weapons: 25 },
    id: 'balanced',
    label: 'Equilibrado',
  },
  defense: {
    allocation: { auxiliary: 15, engines: 15, shields: 50, weapons: 20 },
    id: 'defense',
    label: 'Defesa',
  },
  escape: {
    allocation: { auxiliary: 15, engines: 50, shields: 25, weapons: 10 },
    id: 'escape',
    label: 'Fuga',
  },
};
