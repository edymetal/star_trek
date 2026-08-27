import type { ContactAwareness } from './sensors';

export const EQUIPMENT_IDS = ['beam', 'torpedo', 'tractor'] as const;
export type EquipmentId = (typeof EQUIPMENT_IDS)[number];

export type EquipmentFailureReason =
  | 'no-target'
  | 'target-unidentified'
  | 'out-of-range'
  | 'line-of-sight'
  | 'firing-solution'
  | 'cooldown'
  | 'insufficient-power'
  | 'insufficient-capacitor'
  | 'no-ammunition'
  | 'subsystem-disabled'
  | 'mass-limit';

export interface EquipmentDefinition {
  readonly capacitorCostUnits: number;
  readonly cooldownSeconds: number;
  readonly damageUnits: number;
  readonly id: EquipmentId;
  readonly maxRangeUnits: number;
  readonly minimumAuxiliaryPowerUnitsPerSecond: number;
  readonly minimumFiringSolution: number;
  readonly minimumWeaponPowerUnitsPerSecond: number;
  readonly overflowToHull: boolean;
  readonly projectileSpeedUnitsPerSecond?: number;
  readonly requiresIdentification: boolean;
  readonly torpedoAmmoCost: number;
  readonly tractorMaximumMassRatio?: number;
}

export type EquipmentDefinitions = Readonly<Record<EquipmentId, EquipmentDefinition>>;

export interface WeaponSystemState {
  readonly cooldownSeconds: Readonly<Record<EquipmentId, number>>;
  readonly torpedoAmmo: number;
}

export interface EquipmentContext {
  readonly auxiliaryPowerUnitsPerSecond: number;
  readonly capacitorUnits: number;
  readonly distanceUnits: number;
  readonly firingSolution: number;
  readonly lineOfSight: boolean;
  readonly selectedTargetAwareness?: ContactAwareness;
  readonly subsystemIntegrity: number;
  readonly targetMassRatio: number;
  readonly weaponPowerUnitsPerSecond: number;
}

export interface EquipmentSuccess {
  readonly capacitorSpentUnits: number;
  readonly damageUnits: number;
  readonly equipmentId: EquipmentId;
  readonly overflowToHull: boolean;
  readonly projectileSpeedUnitsPerSecond?: number;
  readonly torpedoAmmoSpent: number;
}

export type EquipmentUseResult =
  | {
      readonly success: false;
      readonly reason: EquipmentFailureReason;
      readonly state: WeaponSystemState;
    }
  | {
      readonly success: true;
      readonly outcome: EquipmentSuccess;
      readonly state: WeaponSystemState;
    };

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function firstFailure(
  definition: EquipmentDefinition,
  state: WeaponSystemState,
  context: EquipmentContext,
): EquipmentFailureReason | undefined {
  if (
    context.selectedTargetAwareness === undefined ||
    context.selectedTargetAwareness === 'unknown'
  ) {
    return 'no-target';
  }
  if (definition.requiresIdentification && context.selectedTargetAwareness !== 'identified') {
    return 'target-unidentified';
  }
  if (context.distanceUnits > definition.maxRangeUnits) {
    return 'out-of-range';
  }
  if (!context.lineOfSight) {
    return 'line-of-sight';
  }
  if (context.firingSolution < definition.minimumFiringSolution) {
    return 'firing-solution';
  }
  if (state.cooldownSeconds[definition.id] > 0) {
    return 'cooldown';
  }
  if (context.subsystemIntegrity <= 0.05) {
    return 'subsystem-disabled';
  }
  if (
    context.weaponPowerUnitsPerSecond + Number.EPSILON <
      definition.minimumWeaponPowerUnitsPerSecond ||
    context.auxiliaryPowerUnitsPerSecond + Number.EPSILON <
      definition.minimumAuxiliaryPowerUnitsPerSecond
  ) {
    return 'insufficient-power';
  }
  if (context.capacitorUnits + Number.EPSILON < definition.capacitorCostUnits) {
    return 'insufficient-capacitor';
  }
  if (state.torpedoAmmo < definition.torpedoAmmoCost) {
    return 'no-ammunition';
  }
  if (
    definition.tractorMaximumMassRatio !== undefined &&
    context.targetMassRatio > definition.tractorMaximumMassRatio
  ) {
    return 'mass-limit';
  }
  return undefined;
}

export function createInitialWeaponSystemState(torpedoAmmo: number): WeaponSystemState {
  return {
    cooldownSeconds: { beam: 0, torpedo: 0, tractor: 0 },
    torpedoAmmo: Math.max(0, Math.floor(finiteOrZero(torpedoAmmo))),
  };
}

export function stepWeaponSystemState(
  state: WeaponSystemState,
  deltaSeconds: number,
): WeaponSystemState {
  const safeDelta = Math.max(0, finiteOrZero(deltaSeconds));
  return {
    ...state,
    cooldownSeconds: {
      beam: Math.max(0, state.cooldownSeconds.beam - safeDelta),
      torpedo: Math.max(0, state.cooldownSeconds.torpedo - safeDelta),
      tractor: Math.max(0, state.cooldownSeconds.tractor - safeDelta),
    },
  };
}

export function tryUseEquipment(
  definitions: EquipmentDefinitions,
  state: WeaponSystemState,
  equipmentId: EquipmentId,
  context: EquipmentContext,
): EquipmentUseResult {
  const definition = definitions[equipmentId];
  const sanitizedContext: EquipmentContext = {
    ...context,
    auxiliaryPowerUnitsPerSecond: Math.max(0, finiteOrZero(context.auxiliaryPowerUnitsPerSecond)),
    capacitorUnits: Math.max(0, finiteOrZero(context.capacitorUnits)),
    distanceUnits: Math.max(0, finiteOrZero(context.distanceUnits)),
    firingSolution: Math.max(0, finiteOrZero(context.firingSolution)),
    subsystemIntegrity: Math.max(0, finiteOrZero(context.subsystemIntegrity)),
    targetMassRatio: Math.max(0, finiteOrZero(context.targetMassRatio)),
    weaponPowerUnitsPerSecond: Math.max(0, finiteOrZero(context.weaponPowerUnitsPerSecond)),
  };
  const reason = firstFailure(definition, state, sanitizedContext);
  if (reason !== undefined) {
    return { reason, state, success: false };
  }
  return {
    outcome: {
      capacitorSpentUnits: definition.capacitorCostUnits,
      damageUnits: definition.damageUnits,
      equipmentId,
      overflowToHull: definition.overflowToHull,
      ...(definition.projectileSpeedUnitsPerSecond === undefined
        ? {}
        : { projectileSpeedUnitsPerSecond: definition.projectileSpeedUnitsPerSecond }),
      torpedoAmmoSpent: definition.torpedoAmmoCost,
    },
    state: {
      cooldownSeconds: { ...state.cooldownSeconds, [equipmentId]: definition.cooldownSeconds },
      torpedoAmmo: state.torpedoAmmo - definition.torpedoAmmoCost,
    },
    success: true,
  };
}
