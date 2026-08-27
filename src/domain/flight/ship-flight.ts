export interface Vector3Value {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface ShipDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly accelerationUnitsPerSecondSquared: number;
  readonly boostMultiplier: number;
  readonly collisionRadiusUnits: number;
  readonly flightAssistPerSecond: number;
  readonly maxSpeedUnitsPerSecond: number;
  readonly maxTurnRateDegreesPerSecond: Vector3Value;
  readonly turnResponsePerSecond: number;
}

export interface ShipState {
  readonly angularVelocityDegreesPerSecond: Vector3Value;
  readonly orientationDegrees: Vector3Value;
  readonly position: Vector3Value;
  readonly velocity: Vector3Value;
}

export interface ContinuousFlightInput {
  readonly boost: boolean;
  readonly brake: boolean;
  readonly pitch: number;
  readonly roll: number;
  readonly throttle: number;
  readonly yaw: number;
}

export interface PointerLookDelta {
  readonly pitchDegrees: number;
  readonly yawDegrees: number;
}

export interface FlightInput extends ContinuousFlightInput, PointerLookDelta {}

export interface FlightStepContext {
  readonly arenaRadiusUnits: number;
  readonly definition: ShipDefinition;
  readonly deltaSeconds: number;
  readonly enginePerformanceMultiplier?: number;
  readonly input: FlightInput;
  readonly state: ShipState;
}

export const NEUTRAL_FLIGHT_INPUT: FlightInput = {
  boost: false,
  brake: false,
  pitch: 0,
  pitchDegrees: 0,
  roll: 0,
  throttle: 0,
  yaw: 0,
  yawDegrees: 0,
};

export const NEUTRAL_CONTINUOUS_FLIGHT_INPUT: ContinuousFlightInput = {
  boost: false,
  brake: false,
  pitch: 0,
  roll: 0,
  throttle: 0,
  yaw: 0,
};

export const NEUTRAL_POINTER_LOOK_DELTA: PointerLookDelta = {
  pitchDegrees: 0,
  yawDegrees: 0,
};

const DEGREES_TO_RADIANS = Math.PI / 180;

function add(left: Vector3Value, right: Vector3Value): Vector3Value {
  return { x: left.x + right.x, y: left.y + right.y, z: left.z + right.z };
}

function scale(value: Vector3Value, multiplier: number): Vector3Value {
  return { x: value.x * multiplier, y: value.y * multiplier, z: value.z * multiplier };
}

function length(value: Vector3Value): number {
  return Math.hypot(value.x, value.y, value.z);
}

function clampAxis(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

function approach(current: number, target: number, response: number): number {
  return current + (target - current) * response;
}

function forwardFromOrientation(orientation: Vector3Value): Vector3Value {
  const yaw = orientation.y * DEGREES_TO_RADIANS;
  const pitch = orientation.x * DEGREES_TO_RADIANS;
  const pitchCosine = Math.cos(pitch);

  return {
    x: -Math.sin(yaw) * pitchCosine,
    y: Math.sin(pitch),
    z: -Math.cos(yaw) * pitchCosine,
  };
}

function clampMagnitude(value: Vector3Value, maximum: number): Vector3Value {
  const magnitude = length(value);
  if (magnitude <= maximum || magnitude === 0) {
    return value;
  }

  return scale(value, maximum / magnitude);
}

function containInsideArena(
  position: Vector3Value,
  velocity: Vector3Value,
  maximumDistance: number,
): Pick<ShipState, 'position' | 'velocity'> {
  const distance = length(position);
  if (distance <= maximumDistance || distance === 0) {
    return { position, velocity };
  }

  const normal = scale(position, 1 / distance);
  const outwardSpeed = velocity.x * normal.x + velocity.y * normal.y + velocity.z * normal.z;
  return {
    position: scale(normal, maximumDistance),
    velocity: outwardSpeed > 0 ? add(velocity, scale(normal, -outwardSpeed)) : velocity,
  };
}

export function createInitialShipState(position: Vector3Value): ShipState {
  return {
    angularVelocityDegreesPerSecond: { x: 0, y: 0, z: 0 },
    orientationDegrees: { x: 0, y: 0, z: 0 },
    position: { ...position },
    velocity: { x: 0, y: 0, z: 0 },
  };
}

export function integrateShipFlight(context: FlightStepContext): ShipState {
  const { definition, deltaSeconds, input, state } = context;
  const response = 1 - Math.exp(-definition.turnResponsePerSecond * deltaSeconds);
  const angularVelocityDegreesPerSecond = {
    x: approach(
      state.angularVelocityDegreesPerSecond.x,
      clampAxis(input.pitch) * definition.maxTurnRateDegreesPerSecond.x,
      response,
    ),
    y: approach(
      state.angularVelocityDegreesPerSecond.y,
      clampAxis(input.yaw) * definition.maxTurnRateDegreesPerSecond.y,
      response,
    ),
    z: approach(
      state.angularVelocityDegreesPerSecond.z,
      clampAxis(input.roll) * definition.maxTurnRateDegreesPerSecond.z,
      response,
    ),
  };
  const orientationDegrees = add(
    add(state.orientationDegrees, scale(angularVelocityDegreesPerSecond, deltaSeconds)),
    { x: input.pitchDegrees, y: input.yawDegrees, z: 0 },
  );
  const boostMultiplier = input.boost ? definition.boostMultiplier : 1;
  const requestedEngineMultiplier = context.enginePerformanceMultiplier ?? 1;
  const enginePerformanceMultiplier = Math.max(
    0.1,
    Math.min(3, Number.isFinite(requestedEngineMultiplier) ? requestedEngineMultiplier : 1),
  );
  const acceleration =
    clampAxis(input.throttle) *
    definition.accelerationUnitsPerSecondSquared *
    boostMultiplier *
    enginePerformanceMultiplier;
  const assistedVelocity = scale(
    state.velocity,
    Math.exp(
      -(input.brake ? definition.flightAssistPerSecond * 5 : definition.flightAssistPerSecond) *
        deltaSeconds,
    ),
  );
  const velocity = clampMagnitude(
    add(
      assistedVelocity,
      scale(forwardFromOrientation(orientationDegrees), acceleration * deltaSeconds),
    ),
    definition.maxSpeedUnitsPerSecond * boostMultiplier * enginePerformanceMultiplier,
  );
  const constrained = containInsideArena(
    add(state.position, scale(velocity, deltaSeconds)),
    velocity,
    Math.max(0, context.arenaRadiusUnits - definition.collisionRadiusUnits),
  );

  return {
    angularVelocityDegreesPerSecond,
    orientationDegrees,
    position: constrained.position,
    velocity: constrained.velocity,
  };
}

export function interpolateShipState(
  previous: ShipState,
  current: ShipState,
  alpha: number,
): ShipState {
  const mix = (from: Vector3Value, to: Vector3Value): Vector3Value => ({
    x: approach(from.x, to.x, alpha),
    y: approach(from.y, to.y, alpha),
    z: approach(from.z, to.z, alpha),
  });

  return {
    angularVelocityDegreesPerSecond: mix(
      previous.angularVelocityDegreesPerSecond,
      current.angularVelocityDegreesPerSecond,
    ),
    orientationDegrees: mix(previous.orientationDegrees, current.orientationDegrees),
    position: mix(previous.position, current.position),
    velocity: mix(previous.velocity, current.velocity),
  };
}

export function vectorLength(value: Vector3Value): number {
  return length(value);
}
