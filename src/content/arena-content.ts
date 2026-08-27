import type { ShipDefinition, Vector3Value } from '../domain/flight/ship-flight';

export const PLAYER_SHIP_DEFINITION: ShipDefinition = {
  accelerationUnitsPerSecondSquared: 11,
  boostMultiplier: 1.8,
  collisionRadiusUnits: 1.2,
  displayName: 'Exploradora Aurora',
  flightAssistPerSecond: 0.16,
  id: 'player-aurora',
  maxSpeedUnitsPerSecond: 32,
  maxTurnRateDegreesPerSecond: { x: 58, y: 64, z: 82 },
  turnResponsePerSecond: 5.5,
};

export interface ArenaContentDefinition {
  readonly asteroidCount: number;
  readonly enemyPosition: Vector3Value;
  readonly moonPosition: Vector3Value;
  readonly planetPosition: Vector3Value;
  readonly radiusUnits: number;
  readonly starPosition: Vector3Value;
  readonly starbasePosition: Vector3Value;
}

export const TRAINING_ARENA: ArenaContentDefinition = {
  asteroidCount: 96,
  enemyPosition: { x: -18, y: 4, z: -55 },
  moonPosition: { x: -32, y: 13, z: -86 },
  planetPosition: { x: -44, y: -8, z: -104 },
  radiusUnits: 180,
  starPosition: { x: 220, y: -200, z: -180 },
  starbasePosition: { x: 34, y: 6, z: -62 },
};
