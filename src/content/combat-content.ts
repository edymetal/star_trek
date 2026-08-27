import type { DamageDefinition } from '../domain/combat/damage';
import type { EnemyAiDefinition } from '../domain/combat/enemy-ai';
import type { SphericalLineOfSightObstacle } from '../domain/combat/line-of-sight';
import type { SensorDefinition } from '../domain/combat/sensors';
import type { EquipmentDefinitions } from '../domain/combat/weapons';

export const SENSOR_DEFINITION: SensorDefinition = {
  identificationDurationSeconds: 2,
  identificationRangeFactor: 0.82,
  lostContactDelaySeconds: 8,
};

export const PLAYER_DAMAGE_DEFINITION: DamageDefinition = {
  hullCapacityPerSection: 32,
  shieldCapacityPerSector: 25,
  shieldRegenerationDelaySeconds: 3,
};

export const ENEMY_DAMAGE_DEFINITION: DamageDefinition = {
  hullCapacityPerSection: 16,
  shieldCapacityPerSector: 10,
  shieldRegenerationDelaySeconds: 4,
};

export const EQUIPMENT_DEFINITIONS: EquipmentDefinitions = {
  beam: {
    capacitorCostUnits: 8,
    cooldownSeconds: 0.45,
    damageUnits: 12,
    id: 'beam',
    maxRangeUnits: 95,
    minimumAuxiliaryPowerUnitsPerSecond: 0,
    minimumFiringSolution: 0.88,
    minimumWeaponPowerUnitsPerSecond: 16,
    overflowToHull: true,
    requiresIdentification: false,
    torpedoAmmoCost: 0,
  },
  torpedo: {
    capacitorCostUnits: 4,
    cooldownSeconds: 1.8,
    damageUnits: 34,
    id: 'torpedo',
    maxRangeUnits: 145,
    minimumAuxiliaryPowerUnitsPerSecond: 0,
    minimumFiringSolution: 0.82,
    minimumWeaponPowerUnitsPerSecond: 18,
    overflowToHull: true,
    projectileSpeedUnitsPerSecond: 62,
    requiresIdentification: true,
    torpedoAmmoCost: 1,
  },
  tractor: {
    capacitorCostUnits: 2,
    cooldownSeconds: 0.75,
    damageUnits: 0,
    id: 'tractor',
    maxRangeUnits: 72,
    minimumAuxiliaryPowerUnitsPerSecond: 5,
    minimumFiringSolution: 0.72,
    minimumWeaponPowerUnitsPerSecond: 0,
    overflowToHull: false,
    requiresIdentification: true,
    torpedoAmmoCost: 0,
    tractorMaximumMassRatio: 1.35,
  },
};

export const ENEMY_AI_DEFINITION: EnemyAiDefinition = {
  attackRangeUnits: 82,
  attackSolution: 0.9,
  decisionIntervalSeconds: 0.15,
  redistributionDurationSeconds: 0.8,
  retreatHullFraction: 0.55,
  shieldRedistributionFraction: 0.28,
};

export const COMBAT_LINE_OF_SIGHT_OBSTACLES: readonly SphericalLineOfSightObstacle[] = [
  { center: { x: 34, y: 6, z: -62 }, id: 'starbase-training', radiusUnits: 8 },
  { center: { x: -44, y: -8, z: -104 }, id: 'planet-training', radiusUnits: 18 },
  { center: { x: -32, y: 13, z: -86 }, id: 'moon-training', radiusUnits: 4 },
];

export const ENEMY_CONTENT = {
  beamCapacitorCostMultiplier: 0.25,
  displayName: 'Interceptadora Vespa',
  id: 'enemy-vespa',
  massRatioToPlayer: 0.85,
} as const;
