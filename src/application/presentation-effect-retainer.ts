import type { CombatEffectSnapshot, EncounterPhase } from './encounter-session';

export type PlayerPresentationEquipmentId = 'beam' | 'torpedo' | 'tractor';

export interface PlayerEffectResultView {
  readonly enemyHullPercent: number;
  readonly enemyShieldPercent: number;
  readonly torpedoAmmo: number;
  readonly tractorActive: boolean;
}

export function didPlayerEquipmentActivate(
  equipmentId: PlayerPresentationEquipmentId,
  before: PlayerEffectResultView,
  after: PlayerEffectResultView,
): boolean {
  if (equipmentId === 'beam') {
    return (
      after.enemyHullPercent < before.enemyHullPercent ||
      after.enemyShieldPercent < before.enemyShieldPercent
    );
  }
  if (equipmentId === 'torpedo') return after.torpedoAmmo < before.torpedoAmmo;
  return !before.tractorActive && after.tractorActive;
}

export function combinePresentationEffects(
  authoritativeEffect: CombatEffectSnapshot | undefined,
  retainedEffects: readonly CombatEffectSnapshot[],
  maximumEffects = 2,
): readonly CombatEffectSnapshot[] {
  const limit = Math.max(1, maximumEffects);
  if (authoritativeEffect === undefined) return retainedEffects.slice(-limit);
  const retainedWithoutDuplicate = retainedEffects.filter(
    (effect) =>
      effect.serial !== authoritativeEffect.serial || effect.kind !== authoritativeEffect.kind,
  );
  const retainedSlots = limit - 1;
  return retainedSlots === 0
    ? [authoritativeEffect]
    : [authoritativeEffect, ...retainedWithoutDuplicate.slice(-retainedSlots)];
}

export interface PresentationEffectRetainer {
  capture(
    equipmentId: PlayerPresentationEquipmentId,
    effect: CombatEffectSnapshot | undefined,
  ): void;
  clear(): void;
  step(
    deltaSeconds: number,
    paused: boolean,
    phase: EncounterPhase,
  ): readonly CombatEffectSnapshot[];
}

export function createPresentationEffectRetainer(
  holdSeconds = 1.5,
  maximumEffects = 3,
): PresentationEffectRetainer {
  const retained: Array<{
    kind: CombatEffectSnapshot['kind'];
    remainingSeconds: number;
    serial: number;
    targetPosition: CombatEffectSnapshot['targetPosition'];
  }> = [];
  return {
    capture(equipmentId, effect) {
      if (effect !== undefined && effect.kind === equipmentId) {
        const existing = retained.find(
          (candidate) => candidate.kind === effect.kind && candidate.serial === effect.serial,
        );
        if (existing !== undefined) {
          existing.remainingSeconds = holdSeconds;
          return;
        }
        retained.push({ ...effect, remainingSeconds: holdSeconds });
        while (retained.length > Math.max(1, maximumEffects)) retained.shift();
      }
    },
    clear() {
      retained.length = 0;
    },
    step(deltaSeconds, paused, phase) {
      if (phase !== 'active') retained.length = 0;
      if (retained.length === 0) return retained;
      if (!paused) {
        const elapsedSeconds = Math.max(0, deltaSeconds);
        for (const effect of retained) {
          effect.remainingSeconds = Math.max(0, effect.remainingSeconds - elapsedSeconds);
        }
      }
      for (let index = retained.length - 1; index >= 0; index -= 1) {
        if (retained[index]!.remainingSeconds === 0) retained.splice(index, 1);
      }
      return retained;
    },
  };
}
