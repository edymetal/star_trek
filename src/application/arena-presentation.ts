import type { PublicContact } from '../domain/combat/sensors';
import {
  SUBSYSTEMS,
  type DamageState,
  type HullSectionId,
  type HullSectionState,
  type ShieldSectorId,
  type SubsystemId,
  type SubsystemIntegrity,
} from '../domain/combat/damage';
import type { Vector3Value } from '../domain/flight/ship-flight';
import type { CombatEffectKind, CombatEffectSnapshot } from './encounter-session';

export type HullVisualState = 'critical' | 'damaged' | 'intact';
export type RemoteHullVisualState = HullVisualState | 'hidden';
export type HullSectionVisualState = Readonly<Record<HullSectionId, HullVisualState>>;
export type RemoteHullSectionVisualState = HullSectionVisualState | 'hidden';

export interface CombatVisualPresentationDto {
  readonly effectKind: CombatEffectKind | 'none';
  readonly impactSector: ShieldSectorId | 'none';
  readonly playerDisabledSubsystems: readonly SubsystemId[];
  readonly playerHullSections: HullSectionVisualState;
  readonly playerHullState: HullVisualState;
  readonly remoteDisabledSubsystems: readonly SubsystemId[];
  readonly remoteHullSections: RemoteHullSectionVisualState;
  readonly remoteHullState: RemoteHullVisualState;
  readonly shieldImpactTarget: 'none' | 'player' | 'remote';
}

interface CombatVisualEncounterView {
  readonly effect?: CombatEffectSnapshot;
  readonly enemy: {
    readonly damage: DamageState;
    readonly hullPercent: number;
    readonly shieldPercent: number;
  };
  readonly playerDamage: DamageState;
  readonly playerHullPercent: number;
  readonly playerShieldPercent: number;
}

export interface CombatVisualDamageCapacities {
  readonly enemyHullCapacityPerSection: number;
  readonly playerHullCapacityPerSection: number;
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

export function classifyHullSectionVisualStates(
  hull: HullSectionState,
  capacityPerSection: number,
): HullSectionVisualState {
  const safeCapacity =
    Number.isFinite(capacityPerSection) && capacityPerSection > 0 ? capacityPerSection : 1;
  const classify = (section: HullSectionId): HullVisualState =>
    classifyHullVisualState((hull[section] / safeCapacity) * 100);
  return {
    bow: classify('bow'),
    port: classify('port'),
    starboard: classify('starboard'),
    stern: classify('stern'),
  };
}

function disabledSubsystems(integrity: SubsystemIntegrity): readonly SubsystemId[] {
  return SUBSYSTEMS.filter((subsystem) => integrity[subsystem] <= Number.EPSILON);
}

export function deriveCombatVisualPresentation(
  encounter: CombatVisualEncounterView,
  remoteObserved: boolean,
  capacities: CombatVisualDamageCapacities,
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
    impactSector: encounter.effect?.impactSector ?? 'none',
    playerDisabledSubsystems: disabledSubsystems(encounter.playerDamage.subsystems),
    playerHullSections: classifyHullSectionVisualStates(
      encounter.playerDamage.hull,
      capacities.playerHullCapacityPerSection,
    ),
    playerHullState: classifyHullVisualState(encounter.playerHullPercent),
    remoteDisabledSubsystems: remoteObserved
      ? disabledSubsystems(encounter.enemy.damage.subsystems)
      : [],
    remoteHullSections: remoteObserved
      ? classifyHullSectionVisualStates(
          encounter.enemy.damage.hull,
          capacities.enemyHullCapacityPerSection,
        )
      : 'hidden',
    remoteHullState: remoteObserved
      ? classifyHullVisualState(encounter.enemy.hullPercent)
      : 'hidden',
    shieldImpactTarget,
  };
}
