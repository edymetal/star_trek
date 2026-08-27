import { describe, expect, it } from 'vitest';

import { TRAINING_ARENA } from '../content/arena-content';
import { PLAYER_ENERGY_DEFINITION } from '../content/energy-content';
import type { SphericalLineOfSightObstacle } from '../domain/combat/line-of-sight';
import {
  createInitialEnergyState,
  stepEnergySystems,
  type EnergySystemState,
} from '../domain/energy/energy-system';
import { createInitialShipState, type ShipState } from '../domain/flight/ship-flight';
import {
  createEncounterSession,
  type EncounterCommand,
  type EncounterStepContext,
} from './encounter-session';

function createHarness(
  initialShip = createInitialShipState({ x: 0, y: 0, z: 16 }),
  lineOfSightObstacles?: readonly SphericalLineOfSightObstacle[],
) {
  const session = createEncounterSession({
    enemyInitialPosition: TRAINING_ARENA.enemyPosition,
    ...(lineOfSightObstacles === undefined ? {} : { lineOfSightObstacles }),
    playerInitialShieldChargeUnits: 70,
  });
  let energyState: EnergySystemState = createInitialEnergyState(PLAYER_ENERGY_DEFINITION);
  let ship: ShipState = initialShip;

  const createContext = (deltaSeconds: number): EncounterStepContext => {
    const energy = stepEnergySystems(PLAYER_ENERGY_DEFINITION, energyState, deltaSeconds);
    energyState = energy.state;
    return {
      deltaSeconds,
      playerEnergyEffects: energy.effects,
      playerEnergyFlow: energy.flow,
      playerEnergyState: energyState,
      playerShip: ship,
    };
  };
  return {
    advance(deltaSeconds = 1 / 60) {
      const result = session.step(createContext(deltaSeconds));
      energyState = result.playerEnergyState;
      return result.snapshot;
    },
    command(command: EncounterCommand) {
      const result = session.applyCommand(command, createContext(0));
      energyState = result.playerEnergyState;
      return result.snapshot;
    },
    get energyState() {
      return energyState;
    },
    session,
    setShip(nextShip: ShipState) {
      ship = nextShip;
    },
  };
}

function identifyContact(harness: ReturnType<typeof createHarness>): void {
  harness.advance();
  harness.command({ type: 'select-next-target' });
  harness.command({ type: 'toggle-scan' });
  for (let index = 0; index < 121; index += 1) harness.advance();
  expect(harness.session.getSnapshot().contact.awareness).toBe('identified');
}

describe('sessão de encontro', () => {
  it('detecta, seleciona e identifica sem revelar nome antes do scan', () => {
    const harness = createHarness();
    expect(harness.session.getSnapshot().contact.awareness).toBe('unknown');
    let snapshot = harness.advance();
    expect(snapshot.contact.awareness).toBe('detected');
    expect(snapshot.contact.displayName).toBeUndefined();
    snapshot = harness.command({ type: 'select-next-target' });
    expect(snapshot.selectedContactId).toBe(snapshot.contact.contactId);
    harness.command({ type: 'toggle-scan' });
    for (let index = 0; index < 121; index += 1) snapshot = harness.advance();
    expect(snapshot.contact.awareness).toBe('identified');
    expect(snapshot.contact.displayName).toBe('Interceptadora Vespa');
  });

  it('bloqueia torpedo não identificado e resolve feixe detectado com capacitor', () => {
    const harness = createHarness();
    harness.advance();
    harness.command({ type: 'select-next-target' });
    let snapshot = harness.command({ equipmentId: 'torpedo', type: 'use-equipment' });
    expect(snapshot.feedback).toContain('Identifique');
    const capacitorBefore = harness.energyState.weaponCapacitorUnits;
    snapshot = harness.command({ equipmentId: 'beam', type: 'use-equipment' });
    expect(snapshot.feedback).toContain('Feixe atingiu');
    expect(snapshot.enemy.shieldPercent).toBeLessThan(100);
    expect(harness.energyState.weaponCapacitorUnits).toBeLessThan(capacitorBefore);
  });

  it('bloqueia disparos quando um volume da arena interrompe a linha de visão', () => {
    const harness = createHarness(undefined, [
      { center: { x: -9, y: 2, z: -19.5 }, id: 'test-blocker', radiusUnits: 8 },
    ]);
    harness.advance();
    harness.command({ type: 'select-next-target' });
    const snapshot = harness.command({ equipmentId: 'beam', type: 'use-equipment' });
    expect(snapshot.feedback).toContain('Linha de visão obstruída');
    expect(snapshot.enemy.shieldPercent).toBe(100);
  });

  it('mantém torpedo rastreável até impacto e raio trator exige proximidade', () => {
    const harness = createHarness();
    identifyContact(harness);
    let snapshot = harness.command({ equipmentId: 'tractor', type: 'use-equipment' });
    expect(snapshot.feedback).toContain('fora do alcance');

    const closeShip = createInitialShipState({
      x: TRAINING_ARENA.enemyPosition.x,
      y: TRAINING_ARENA.enemyPosition.y,
      z: TRAINING_ARENA.enemyPosition.z + 30,
    });
    harness.setShip(closeShip);
    harness.advance();
    snapshot = harness.command({ equipmentId: 'tractor', type: 'use-equipment' });
    expect(snapshot.feedback).toContain('Raio trator ativo');

    snapshot = harness.command({ equipmentId: 'torpedo', type: 'use-equipment' });
    expect(snapshot.projectileCount).toBe(1);
    const hullBefore = snapshot.enemy.hullPercent;
    for (let index = 0; index < 60; index += 1) snapshot = harness.advance();
    expect(snapshot.projectileCount).toBe(0);
    expect(snapshot.enemy.hullPercent).toBeLessThan(hullBefore);
  });

  it('encerra com vitória e reinicia o encontro sem recarregar estado externo', () => {
    const harness = createHarness();
    identifyContact(harness);
    let snapshot = harness.session.getSnapshot();
    for (let shot = 0; shot < 5 && snapshot.phase === 'active'; shot += 1) {
      harness.setShip(
        createInitialShipState({
          x: snapshot.enemy.position.x,
          y: snapshot.enemy.position.y,
          z: snapshot.enemy.position.z + 30,
        }),
      );
      harness.advance();
      snapshot = harness.command({ equipmentId: 'torpedo', type: 'use-equipment' });
      for (let index = 0; index < 125; index += 1) snapshot = harness.advance();
    }
    expect(snapshot.phase).toBe('victory');
    expect(snapshot.selectedContactId).toBeUndefined();
    harness.session.restart();
    snapshot = harness.session.getSnapshot();
    expect(snapshot.phase).toBe('active');
    expect(snapshot.enemy.hullPercent).toBe(100);
    expect(snapshot.torpedoAmmo).toBe(6);
    expect(snapshot.contact.awareness).toBe('unknown');
  });

  it('limpa alvo explicitamente e interrompe scan', () => {
    const harness = createHarness();
    harness.advance();
    harness.command({ type: 'select-next-target' });
    harness.command({ type: 'toggle-scan' });
    const snapshot = harness.command({ type: 'clear-target' });
    expect(snapshot.selectedContactId).toBeUndefined();
    expect(snapshot.activeScan).toBe(false);
  });

  it('encerra com derrota sob ataques e permite reinício seguro', () => {
    const harness = createHarness();
    let snapshot = harness.session.getSnapshot();
    for (let index = 0; index < 3_000 && snapshot.phase === 'active'; index += 1) {
      snapshot = harness.advance();
    }
    expect(snapshot.phase).toBe('defeat');
    expect(snapshot.playerHullPercent).toBe(0);
    harness.session.restart();
    expect(harness.session.getSnapshot().phase).toBe('active');
  });
});
