import type { PublicContact } from '../domain/combat/sensors';
import type { Vector3Value } from '../domain/flight/ship-flight';
import type { CombatEffectKind, CombatEffectSnapshot } from './encounter-session';

export type HullVisualState = 'critical' | 'damaged' | 'intact';
export type RemoteHullVisualState = HullVisualState | 'hidden';

export interface CombatVisualPresentationDto {
  readonly effectKind: CombatEffectKind | 'none';
  readonly playerHullState: HullVisualState;
  readonly remoteHullState: RemoteHullVisualState;
  readonly shieldImpactTarget: 'none' | 'player' | 'remote';
}

interface CombatVisualEncounterView {
  readonly effect?: CombatEffectSnapshot;
  readonly enemy: {
    readonly hullPercent: number;
    readonly shieldPercent: number;
  };
  readonly playerHullPercent: number;
  readonly playerShieldPercent: number;
}

export interface TargetMarkerPresentationDto {
  readonly mode: 'observed' | 'remembered';
  readonly screenX: number;
  readonly screenY: number;
  readonly visible: boolean;
}

export interface ArenaPresentationDto {
  readonly combatVisuals: CombatVisualPresentationDto;
  readonly targetMarker: TargetMarkerPresentationDto;
}

export interface RemoteVesselPresentationDto {
  readonly position?: Vector3Value;
  readonly visible: boolean;
}

export function deriveRemoteVesselPresentation(
  contact: Pick<PublicContact, 'lastObservation' | 'observedNow'>,
): RemoteVesselPresentationDto {
  if (!contact.observedNow || contact.lastObservation === undefined) {
    return { visible: false };
  }
  return { position: contact.lastObservation.position, visible: true };
}

export function classifyHullVisualState(hullPercent: number): HullVisualState {
  if (!Number.isFinite(hullPercent) || hullPercent <= 33) return 'critical';
  if (hullPercent <= 66) return 'damaged';
  return 'intact';
}

export function deriveCombatVisualPresentation(
  encounter: CombatVisualEncounterView,
  remoteObserved: boolean,
): CombatVisualPresentationDto {
  const effectKind = encounter.effect?.kind ?? 'none';
  let shieldImpactTarget: CombatVisualPresentationDto['shieldImpactTarget'] = 'none';
  if (effectKind === 'enemy-beam' && encounter.playerShieldPercent > 0) {
    shieldImpactTarget = 'player';
  } else if (
    remoteObserved &&
    (effectKind === 'beam' || effectKind === 'torpedo') &&
    encounter.enemy.shieldPercent > 0
  ) {
    shieldImpactTarget = 'remote';
  }

  return {
    effectKind,
    playerHullState: classifyHullVisualState(encounter.playerHullPercent),
    remoteHullState: remoteObserved
      ? classifyHullVisualState(encounter.enemy.hullPercent)
      : 'hidden',
    shieldImpactTarget,
  };
}
