import type { Vector3Value } from '../flight/ship-flight';

export type ContactAwareness = 'unknown' | 'detected' | 'identified';

export interface SensorDefinition {
  readonly identificationDurationSeconds: number;
  readonly identificationRangeFactor: number;
  readonly lostContactDelaySeconds: number;
}

export interface SensorContactState {
  readonly awareness: ContactAwareness;
  readonly contactId: string;
  readonly lastObservation?: SensorObservationSnapshot;
  readonly observedNow: boolean;
  readonly scanProgressSeconds: number;
  readonly secondsSinceObserved: number;
}

export interface SensorObservationSnapshot {
  readonly bearingDegrees: number;
  readonly directionFromObserver: Vector3Value;
  readonly distanceUnits: number;
  readonly firingSolution: number;
  readonly position: Vector3Value;
}

export interface SensorObservation {
  readonly activeScan: boolean;
  readonly deltaSeconds: number;
  readonly snapshot: SensorObservationSnapshot;
  readonly sensorIntegrity: number;
  readonly sensorPowerMultiplier: number;
  readonly sensorRangeUnits: number;
}

export interface PublicContact {
  readonly awareness: ContactAwareness;
  readonly contactId: string;
  readonly distanceUnits?: number;
  readonly displayName?: string;
  readonly lastObservation?: SensorObservationSnapshot;
  readonly memoryAgeSeconds?: number;
  readonly observedNow: boolean;
  readonly scanProgress: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function sanitizeVector(value: Vector3Value): Vector3Value {
  return {
    x: finiteOrZero(value.x),
    y: finiteOrZero(value.y),
    z: finiteOrZero(value.z),
  };
}

function sanitizeSnapshot(snapshot: SensorObservationSnapshot): SensorObservationSnapshot {
  const direction = sanitizeVector(snapshot.directionFromObserver);
  const magnitude = Math.hypot(direction.x, direction.y, direction.z);
  return {
    bearingDegrees: finiteOrZero(snapshot.bearingDegrees),
    directionFromObserver:
      magnitude <= Number.EPSILON
        ? { x: 0, y: 0, z: 0 }
        : { x: direction.x / magnitude, y: direction.y / magnitude, z: direction.z / magnitude },
    distanceUnits: Math.max(0, finiteOrZero(snapshot.distanceUnits)),
    firingSolution: clamp(finiteOrZero(snapshot.firingSolution), -1, 1),
    position: sanitizeVector(snapshot.position),
  };
}

function assertDefinition(definition: SensorDefinition): void {
  if (
    !(definition.identificationDurationSeconds > 0) ||
    !(definition.identificationRangeFactor > 0 && definition.identificationRangeFactor <= 1) ||
    !(definition.lostContactDelaySeconds >= 0)
  ) {
    throw new Error('Definição de sensores inválida.');
  }
}

export function createUnknownContact(contactId: string): SensorContactState {
  if (contactId.trim().length === 0) {
    throw new Error('Contato precisa de um identificador.');
  }
  return {
    awareness: 'unknown',
    contactId,
    observedNow: false,
    scanProgressSeconds: 0,
    secondsSinceObserved: 0,
  };
}

export function stepSensorContact(
  definition: SensorDefinition,
  state: SensorContactState,
  observation: SensorObservation,
): SensorContactState {
  assertDefinition(definition);
  const deltaSeconds = Math.max(0, finiteOrZero(observation.deltaSeconds));
  const integrity = clamp(finiteOrZero(observation.sensorIntegrity), 0, 1);
  const rangeUnits = Math.max(0, finiteOrZero(observation.sensorRangeUnits)) * integrity;
  const currentObservation = sanitizeSnapshot(observation.snapshot);
  const distanceUnits = currentObservation.distanceUnits;
  const observed = integrity > 0 && distanceUnits <= rangeUnits;

  if (!observed) {
    const secondsSinceObserved = state.secondsSinceObserved + deltaSeconds;
    if (
      secondsSinceObserved + definition.lostContactDelaySeconds * 1e-9 >=
      definition.lostContactDelaySeconds
    ) {
      return {
        awareness: 'unknown',
        contactId: state.contactId,
        observedNow: false,
        scanProgressSeconds: 0,
        secondsSinceObserved,
      };
    }
    return { ...state, observedNow: false, secondsSinceObserved };
  }

  let awareness: ContactAwareness = state.awareness === 'unknown' ? 'detected' : state.awareness;
  let scanProgressSeconds = state.scanProgressSeconds;
  const scanRangeUnits = rangeUnits * definition.identificationRangeFactor;
  if (awareness !== 'identified' && observation.activeScan && distanceUnits <= scanRangeUnits) {
    scanProgressSeconds +=
      deltaSeconds * Math.max(0, finiteOrZero(observation.sensorPowerMultiplier)) * integrity;
    if (
      scanProgressSeconds + definition.identificationDurationSeconds * 1e-9 >=
      definition.identificationDurationSeconds
    ) {
      awareness = 'identified';
      scanProgressSeconds = definition.identificationDurationSeconds;
    }
  }

  return {
    ...state,
    awareness,
    lastObservation: currentObservation,
    observedNow: true,
    scanProgressSeconds,
    secondsSinceObserved: 0,
  };
}

export function toPublicContact(
  definition: SensorDefinition,
  state: SensorContactState,
  identifiedName: string,
): PublicContact {
  const scanProgress = clamp(
    state.scanProgressSeconds / definition.identificationDurationSeconds,
    0,
    1,
  );
  if (state.awareness === 'unknown') {
    return {
      awareness: state.awareness,
      contactId: state.contactId,
      observedNow: false,
      scanProgress,
    };
  }
  return {
    awareness: state.awareness,
    contactId: state.contactId,
    ...(state.lastObservation === undefined
      ? {}
      : {
          distanceUnits: state.lastObservation.distanceUnits,
          lastObservation: state.lastObservation,
          memoryAgeSeconds: state.secondsSinceObserved,
        }),
    ...(state.awareness === 'identified' ? { displayName: identifiedName } : {}),
    observedNow: state.observedNow,
    scanProgress,
  };
}

export function validateSelectedContact(
  selectedContactId: string | undefined,
  contacts: readonly SensorContactState[],
): string | undefined {
  return contacts.some(
    (contact) => contact.contactId === selectedContactId && contact.awareness !== 'unknown',
  )
    ? selectedContactId
    : undefined;
}

export function selectNextContact(
  selectedContactId: string | undefined,
  contacts: readonly SensorContactState[],
): string | undefined {
  const selectable = contacts.filter((contact) => contact.awareness !== 'unknown');
  if (selectable.length === 0) {
    return undefined;
  }
  const currentIndex = selectable.findIndex((contact) => contact.contactId === selectedContactId);
  return selectable[(currentIndex + 1) % selectable.length]?.contactId;
}
