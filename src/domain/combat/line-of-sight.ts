import type { Vector3Value } from '../flight/ship-flight';

export interface SphericalLineOfSightObstacle {
  readonly center: Vector3Value;
  readonly id: string;
  readonly radiusUnits: number;
}

function squaredDistance(left: Vector3Value, right: Vector3Value): number {
  const x = left.x - right.x;
  const y = left.y - right.y;
  const z = left.z - right.z;
  return x * x + y * y + z * z;
}

export function hasLineOfSight(
  origin: Vector3Value,
  target: Vector3Value,
  obstacles: readonly SphericalLineOfSightObstacle[],
): boolean {
  const segment = {
    x: target.x - origin.x,
    y: target.y - origin.y,
    z: target.z - origin.z,
  };
  const segmentLengthSquared =
    segment.x * segment.x + segment.y * segment.y + segment.z * segment.z;

  return !obstacles.some((obstacle) => {
    const radius = Number.isFinite(obstacle.radiusUnits) ? Math.max(0, obstacle.radiusUnits) : 0;
    if (radius === 0) return false;
    if (segmentLengthSquared <= Number.EPSILON) {
      return squaredDistance(origin, obstacle.center) <= radius * radius;
    }
    const fromOrigin = {
      x: obstacle.center.x - origin.x,
      y: obstacle.center.y - origin.y,
      z: obstacle.center.z - origin.z,
    };
    const projection = Math.max(
      0,
      Math.min(
        1,
        (fromOrigin.x * segment.x + fromOrigin.y * segment.y + fromOrigin.z * segment.z) /
          segmentLengthSquared,
      ),
    );
    const closestPoint = {
      x: origin.x + segment.x * projection,
      y: origin.y + segment.y * projection,
      z: origin.z + segment.z * projection,
    };
    return squaredDistance(closestPoint, obstacle.center) <= radius * radius;
  });
}
