export const ENERGY_CHANNELS = ['engines', 'shields', 'weapons', 'auxiliary'] as const;

export type EnergyChannelId = (typeof ENERGY_CHANNELS)[number];
export type EnergyPresetId = 'balanced' | 'attack' | 'defense' | 'escape';

export type EnergyAllocation = Readonly<Record<EnergyChannelId, number>>;
export type EnergyIntegrity = Readonly<Record<EnergyChannelId | 'reactor', number>>;

export interface EnergySystemDefinition {
  readonly allocationCapacityUnits: number;
  readonly baseSensorRangeUnits: number;
  readonly nominalReactorOutputUnitsPerSecond: number;
  readonly reserveCapacityUnits: number;
  readonly shieldCapacityUnits: number;
  readonly shieldRegenerationUnitsPerSecondAtBalanced: number;
  readonly weaponCapacitorCapacityUnits: number;
  readonly weaponCoolingUnitsPerSecondAtBalanced: number;
  readonly weaponRechargeUnitsPerSecondAtBalanced: number;
}

export interface EnergySystemState {
  readonly allocation: EnergyAllocation;
  readonly integrity: EnergyIntegrity;
  readonly reserveUnits: number;
  readonly shieldChargeUnits: number;
  readonly weaponCapacitorUnits: number;
  readonly weaponHeatUnits: number;
}

export interface EnergyChannelFlow {
  readonly allocatedUnitsPerSecond: number;
  readonly effectiveUnitsPerSecond: number;
  readonly lostUnitsPerSecond: number;
}

export interface EnergyFlow {
  readonly channels: Readonly<Record<EnergyChannelId, EnergyChannelFlow>>;
  readonly deliveredUnitsPerSecond: number;
  readonly reactorGeneratedUnitsPerSecond: number;
  readonly reserveDrawUnitsPerSecond: number;
}

export interface EnergyEffects {
  readonly enginePerformanceMultiplier: number;
  readonly sensorRangeUnits: number;
  readonly shieldRegenerationUnitsPerSecond: number;
  readonly weaponCoolingUnitsPerSecond: number;
  readonly weaponRechargeUnitsPerSecond: number;
}

export interface EnergyStepResult {
  readonly effects: EnergyEffects;
  readonly flow: EnergyFlow;
  readonly state: EnergySystemState;
}

export interface InitialEnergyState {
  readonly allocation?: Partial<EnergyAllocation>;
  readonly integrity?: Partial<EnergyIntegrity>;
  readonly reserveUnits?: number;
  readonly shieldChargeUnits?: number;
  readonly weaponCapacitorUnits?: number;
  readonly weaponHeatUnits?: number;
}

const DEFAULT_ALLOCATION: EnergyAllocation = {
  auxiliary: 25,
  engines: 25,
  shields: 25,
  weapons: 25,
};

const DEFAULT_INTEGRITY: EnergyIntegrity = {
  auxiliary: 1,
  engines: 1,
  reactor: 1,
  shields: 1,
  weapons: 1,
};

function finiteOr(value: number | undefined, fallback: number): number {
  return value === undefined || !Number.isFinite(value) ? fallback : value;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function assertDefinition(definition: EnergySystemDefinition): void {
  const positiveValues = [
    definition.allocationCapacityUnits,
    definition.baseSensorRangeUnits,
    definition.nominalReactorOutputUnitsPerSecond,
    definition.reserveCapacityUnits,
    definition.shieldCapacityUnits,
    definition.shieldRegenerationUnitsPerSecondAtBalanced,
    definition.weaponCapacitorCapacityUnits,
    definition.weaponCoolingUnitsPerSecondAtBalanced,
    definition.weaponRechargeUnitsPerSecondAtBalanced,
  ];
  if (positiveValues.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error(
      'Definição de energia inválida: capacidades e taxas devem ser finitas e positivas.',
    );
  }
}

export function normalizeEnergyAllocation(
  requested: Partial<EnergyAllocation>,
  capacityUnits: number,
): EnergyAllocation {
  if (!Number.isFinite(capacityUnits) || capacityUnits <= 0) {
    throw new Error('A capacidade de alocação deve ser finita e positiva.');
  }
  const sanitized = ENERGY_CHANNELS.map((channel) => Math.max(0, finiteOr(requested[channel], 0)));
  const maximumRequested = Math.max(...sanitized);
  const source =
    maximumRequested > 0
      ? sanitized.map((value) => value / maximumRequested)
      : ENERGY_CHANNELS.map((channel) => DEFAULT_ALLOCATION[channel]);
  const sourceTotal = source.reduce((total, value) => total + value, 0);
  const normalized = source.map((value) => (value / sourceTotal) * capacityUnits);
  const correction = capacityUnits - normalized.reduce((total, value) => total + value, 0);
  let correctionIndex = 0;
  for (let index = 1; index < normalized.length; index += 1) {
    if ((normalized[index] ?? 0) > (normalized[correctionIndex] ?? 0)) {
      correctionIndex = index;
    }
  }
  const correctionTarget = normalized[correctionIndex];
  if (correctionTarget !== undefined && correctionTarget > 0) {
    normalized[correctionIndex] = Math.max(0, correctionTarget + correction);
  }

  return {
    auxiliary: normalized[3] ?? 0,
    engines: normalized[0] ?? 0,
    shields: normalized[1] ?? 0,
    weapons: normalized[2] ?? 0,
  };
}

export function adjustEnergyAllocation(
  current: EnergyAllocation,
  channel: EnergyChannelId,
  deltaUnits: number,
  capacityUnits: number,
): EnergyAllocation {
  const normalized = normalizeEnergyAllocation(current, capacityUnits);
  const desired = clamp(normalized[channel] + finiteOr(deltaUnits, 0), 0, capacityUnits);
  const otherChannels = ENERGY_CHANNELS.filter((candidate) => candidate !== channel);
  const currentOtherTotal = otherChannels.reduce(
    (total, candidate) => total + normalized[candidate],
    0,
  );
  const remaining = capacityUnits - desired;
  const adjusted: Record<EnergyChannelId, number> = { ...normalized };
  adjusted[channel] = desired;
  for (const candidate of otherChannels) {
    adjusted[candidate] =
      currentOtherTotal > 0
        ? (normalized[candidate] / currentOtherTotal) * remaining
        : remaining / otherChannels.length;
  }
  return normalizeEnergyAllocation(adjusted, capacityUnits);
}

export function createInitialEnergyState(
  definition: EnergySystemDefinition,
  initial: InitialEnergyState = {},
): EnergySystemState {
  assertDefinition(definition);
  const integrity: Record<EnergyChannelId | 'reactor', number> = { ...DEFAULT_INTEGRITY };
  for (const system of [...ENERGY_CHANNELS, 'reactor'] as const) {
    integrity[system] = clamp(finiteOr(initial.integrity?.[system], 1), 0, 1);
  }
  return {
    allocation: normalizeEnergyAllocation(
      initial.allocation ?? DEFAULT_ALLOCATION,
      definition.allocationCapacityUnits,
    ),
    integrity,
    reserveUnits: clamp(
      finiteOr(initial.reserveUnits, definition.reserveCapacityUnits),
      0,
      definition.reserveCapacityUnits,
    ),
    shieldChargeUnits: clamp(
      finiteOr(initial.shieldChargeUnits, definition.shieldCapacityUnits * 0.7),
      0,
      definition.shieldCapacityUnits,
    ),
    weaponCapacitorUnits: clamp(
      finiteOr(initial.weaponCapacitorUnits, definition.weaponCapacitorCapacityUnits * 0.4),
      0,
      definition.weaponCapacitorCapacityUnits,
    ),
    weaponHeatUnits: clamp(finiteOr(initial.weaponHeatUnits, 25), 0, 100),
  };
}

export function setEnergyAllocation(
  definition: EnergySystemDefinition,
  state: EnergySystemState,
  allocation: Partial<EnergyAllocation>,
): EnergySystemState {
  return {
    ...state,
    allocation: normalizeEnergyAllocation(allocation, definition.allocationCapacityUnits),
  };
}

function computeEnergyFlow(
  definition: EnergySystemDefinition,
  state: EnergySystemState,
  deltaSeconds: number,
): { readonly flow: EnergyFlow; readonly reserveUnits: number } {
  const safeDeltaSeconds = Math.max(0, finiteOr(deltaSeconds, 0));
  const reactorGeneratedUnitsPerSecond =
    definition.nominalReactorOutputUnitsPerSecond * state.integrity.reactor;
  const reactorDeficit = Math.max(
    0,
    definition.nominalReactorOutputUnitsPerSecond - reactorGeneratedUnitsPerSecond,
  );
  const reserveDrawUnitsPerSecond =
    safeDeltaSeconds > 0 ? Math.min(reactorDeficit, state.reserveUnits / safeDeltaSeconds) : 0;
  const deliveredUnitsPerSecond = reactorGeneratedUnitsPerSecond + reserveDrawUnitsPerSecond;
  const createChannelFlow = (channel: EnergyChannelId): EnergyChannelFlow => {
    const allocatedUnitsPerSecond =
      deliveredUnitsPerSecond * (state.allocation[channel] / definition.allocationCapacityUnits);
    const effectiveUnitsPerSecond = allocatedUnitsPerSecond * state.integrity[channel];
    return {
      allocatedUnitsPerSecond,
      effectiveUnitsPerSecond,
      lostUnitsPerSecond: allocatedUnitsPerSecond - effectiveUnitsPerSecond,
    };
  };
  const channels: Record<EnergyChannelId, EnergyChannelFlow> = {
    auxiliary: createChannelFlow('auxiliary'),
    engines: createChannelFlow('engines'),
    shields: createChannelFlow('shields'),
    weapons: createChannelFlow('weapons'),
  };
  return {
    flow: {
      channels,
      deliveredUnitsPerSecond,
      reactorGeneratedUnitsPerSecond,
      reserveDrawUnitsPerSecond,
    },
    reserveUnits: clamp(
      state.reserveUnits - reserveDrawUnitsPerSecond * safeDeltaSeconds,
      0,
      definition.reserveCapacityUnits,
    ),
  };
}

function deriveEnergyEffects(definition: EnergySystemDefinition, flow: EnergyFlow): EnergyEffects {
  const balancedPower = definition.nominalReactorOutputUnitsPerSecond / ENERGY_CHANNELS.length;
  const ratio = (channel: EnergyChannelId): number =>
    flow.channels[channel].effectiveUnitsPerSecond / balancedPower;
  const engineRatio = ratio('engines');
  const shieldRatio = ratio('shields');
  const weaponRatio = ratio('weapons');
  const auxiliaryRatio = ratio('auxiliary');
  return {
    enginePerformanceMultiplier: clamp(0.55 + 0.45 * engineRatio, 0.35, 1.65),
    sensorRangeUnits:
      definition.baseSensorRangeUnits * clamp(0.45 + 0.55 * auxiliaryRatio, 0.25, 2),
    shieldRegenerationUnitsPerSecond:
      definition.shieldRegenerationUnitsPerSecondAtBalanced * shieldRatio,
    weaponCoolingUnitsPerSecond:
      definition.weaponCoolingUnitsPerSecondAtBalanced * (0.35 + 0.65 * weaponRatio),
    weaponRechargeUnitsPerSecond: definition.weaponRechargeUnitsPerSecondAtBalanced * weaponRatio,
  };
}

export function stepEnergySystems(
  definition: EnergySystemDefinition,
  state: EnergySystemState,
  deltaSeconds: number,
): EnergyStepResult {
  assertDefinition(definition);
  const safeDeltaSeconds = Math.max(0, finiteOr(deltaSeconds, 0));
  const { flow, reserveUnits } = computeEnergyFlow(definition, state, safeDeltaSeconds);
  const effects = deriveEnergyEffects(definition, flow);
  return {
    effects,
    flow,
    state: {
      ...state,
      reserveUnits,
      shieldChargeUnits: clamp(
        state.shieldChargeUnits + effects.shieldRegenerationUnitsPerSecond * safeDeltaSeconds,
        0,
        definition.shieldCapacityUnits,
      ),
      weaponCapacitorUnits: clamp(
        state.weaponCapacitorUnits + effects.weaponRechargeUnitsPerSecond * safeDeltaSeconds,
        0,
        definition.weaponCapacitorCapacityUnits,
      ),
      weaponHeatUnits: clamp(
        state.weaponHeatUnits - effects.weaponCoolingUnitsPerSecond * safeDeltaSeconds,
        0,
        100,
      ),
    },
  };
}
