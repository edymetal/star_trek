import { describe, expect, it } from 'vitest';

import { EQUIPMENT_DEFINITIONS } from '../../content/combat-content';
import {
  createInitialWeaponSystemState,
  stepWeaponSystemState,
  tryUseEquipment,
  type EquipmentContext,
} from './weapons';

const VALID_CONTEXT: EquipmentContext = {
  auxiliaryPowerUnitsPerSecond: 40,
  capacitorUnits: 100,
  distanceUnits: 30,
  firingSolution: 1,
  lineOfSight: true,
  selectedTargetAwareness: 'identified',
  subsystemIntegrity: 1,
  targetMassRatio: 1,
  weaponPowerUnitsPerSecond: 40,
};

describe('equipamentos táticos', () => {
  it.each([
    ['beam', 'no-target', { selectedTargetAwareness: undefined }],
    ['torpedo', 'target-unidentified', { selectedTargetAwareness: 'detected' }],
    ['beam', 'out-of-range', { distanceUnits: 999 }],
    ['beam', 'line-of-sight', { lineOfSight: false }],
    ['beam', 'firing-solution', { firingSolution: 0 }],
    ['beam', 'insufficient-power', { weaponPowerUnitsPerSecond: 0 }],
    ['beam', 'insufficient-capacitor', { capacitorUnits: 0 }],
    ['beam', 'subsystem-disabled', { subsystemIntegrity: 0 }],
    ['tractor', 'mass-limit', { targetMassRatio: 99 }],
  ] as const)('bloqueia %s por %s', (equipment, expectedReason, override) => {
    const result = tryUseEquipment(
      EQUIPMENT_DEFINITIONS,
      createInitialWeaponSystemState(2),
      equipment,
      { ...VALID_CONTEXT, ...override } as EquipmentContext,
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe(expectedReason);
    }
  });

  it('feixe consome capacitor e respeita cooldown', () => {
    const fired = tryUseEquipment(
      EQUIPMENT_DEFINITIONS,
      createInitialWeaponSystemState(2),
      'beam',
      VALID_CONTEXT,
    );
    expect(fired.success).toBe(true);
    if (!fired.success) return;
    expect(fired.outcome.capacitorSpentUnits).toBeGreaterThan(0);
    const blocked = tryUseEquipment(EQUIPMENT_DEFINITIONS, fired.state, 'beam', VALID_CONTEXT);
    expect(blocked).toMatchObject({ reason: 'cooldown', success: false });
    const ready = stepWeaponSystemState(fired.state, 10);
    expect(ready.cooldownSeconds.beam).toBe(0);
  });

  it('usa potência efetiva já degradada sem multiplicar integridade uma segunda vez', () => {
    const atHalfIntegrity = tryUseEquipment(
      EQUIPMENT_DEFINITIONS,
      createInitialWeaponSystemState(2),
      'beam',
      {
        ...VALID_CONTEXT,
        subsystemIntegrity: 0.5,
        weaponPowerUnitsPerSecond: EQUIPMENT_DEFINITIONS.beam.minimumWeaponPowerUnitsPerSecond,
      },
    );
    expect(atHalfIntegrity.success).toBe(true);

    const disabled = tryUseEquipment(
      EQUIPMENT_DEFINITIONS,
      createInitialWeaponSystemState(2),
      'beam',
      { ...VALID_CONTEXT, subsystemIntegrity: 0.05 },
    );
    expect(disabled).toMatchObject({ reason: 'subsystem-disabled', success: false });
  });

  it('torpedo consome munição e produz projétil rastreável', () => {
    const fired = tryUseEquipment(
      EQUIPMENT_DEFINITIONS,
      createInitialWeaponSystemState(1),
      'torpedo',
      VALID_CONTEXT,
    );
    expect(fired.success).toBe(true);
    if (!fired.success) return;
    expect(fired.state.torpedoAmmo).toBe(0);
    expect(fired.outcome.projectileSpeedUnitsPerSecond).toBeGreaterThan(0);
    const noAmmo = tryUseEquipment(
      EQUIPMENT_DEFINITIONS,
      stepWeaponSystemState(fired.state, 10),
      'torpedo',
      VALID_CONTEXT,
    );
    expect(noAmmo).toMatchObject({ reason: 'no-ammunition', success: false });
  });

  it('raio trator usa potência auxiliar, alcance e limite de massa distintos', () => {
    const fired = tryUseEquipment(
      EQUIPMENT_DEFINITIONS,
      createInitialWeaponSystemState(0),
      'tractor',
      VALID_CONTEXT,
    );
    expect(fired.success).toBe(true);
    const insufficient = tryUseEquipment(
      EQUIPMENT_DEFINITIONS,
      createInitialWeaponSystemState(0),
      'tractor',
      { ...VALID_CONTEXT, auxiliaryPowerUnitsPerSecond: 0 },
    );
    expect(insufficient).toMatchObject({ reason: 'insufficient-power', success: false });
  });
});
