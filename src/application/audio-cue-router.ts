import type { EncounterSnapshot } from './encounter-session';
import type { TutorialCampaignSnapshot } from '../domain/missions/tutorial-campaign';
import type { SystemNavigationSnapshot } from '../domain/navigation/system-navigation';

export type GameAudioCue =
  | 'base-arrival'
  | 'beam'
  | 'departure'
  | 'defeat'
  | 'energy-warning'
  | 'hull-impact'
  | 'objective-complete'
  | 'recharge-warning'
  | 'return'
  | 'scan-complete'
  | 'shield-impact'
  | 'target-select'
  | 'torpedo-impact'
  | 'torpedo-launch'
  | 'tractor'
  | 'travel'
  | 'ui-confirm'
  | 'victory';

export type GameAudioAmbienceMode = 'base' | 'encounter' | 'silent' | 'travel';

export interface GameAudioFrame {
  readonly encounter: Pick<
    EncounterSnapshot,
    | 'contact'
    | 'effect'
    | 'enemy'
    | 'feedback'
    | 'phase'
    | 'playerHullPercent'
    | 'playerShieldPercent'
    | 'selectedContactId'
    | 'torpedoAmmo'
  >;
  readonly mission: TutorialCampaignSnapshot;
  readonly navigation: SystemNavigationSnapshot;
  readonly reservePercent: number;
  readonly weaponCapacitorPercent: number;
}

export interface GameAudioCueRouter {
  reset(frame?: GameAudioFrame): void;
  update(frame: GameAudioFrame): readonly GameAudioCue[];
}

const LOW_ENERGY_PERCENT = 20;
const LOW_CAPACITOR_PERCENT = 15;

function isRechargeFeedback(value: string): boolean {
  return value === 'Capacitor de armas insuficiente.' || value === 'Equipamento em recarga.';
}

export function ambienceModeForNavigation(
  navigation: SystemNavigationSnapshot,
): GameAudioAmbienceMode {
  if (navigation.mode === 'encounter') return 'encounter';
  if (navigation.mode === 'travel') return 'travel';
  if (navigation.mode === 'base' || navigation.mode === 'map') return 'base';
  return 'silent';
}

export function createGameAudioCueRouter(): GameAudioCueRouter {
  let previous: GameAudioFrame | undefined;

  return {
    reset(frame) {
      previous = frame;
    },
    update(frame) {
      const before = previous;
      previous = frame;
      if (before === undefined) return [];

      const cues = new Set<GameAudioCue>();
      const effect = frame.encounter.effect;
      const previousEffect = before.encounter.effect;
      if (
        effect !== undefined &&
        (previousEffect === undefined ||
          effect.serial !== previousEffect.serial ||
          effect.kind !== previousEffect.kind)
      ) {
        if (effect.kind === 'beam' || effect.kind === 'enemy-beam') cues.add('beam');
        else if (effect.kind === 'torpedo') cues.add('torpedo-impact');
        else cues.add('tractor');
      }

      if (
        frame.encounter.selectedContactId !== undefined &&
        frame.encounter.selectedContactId !== before.encounter.selectedContactId
      ) {
        cues.add('target-select');
      }
      if (
        before.encounter.contact.awareness !== 'identified' &&
        frame.encounter.contact.awareness === 'identified'
      ) {
        cues.add('scan-complete');
      }
      if (frame.encounter.torpedoAmmo < before.encounter.torpedoAmmo) {
        cues.add('torpedo-launch');
      }

      const shieldDamaged =
        frame.encounter.playerShieldPercent < before.encounter.playerShieldPercent ||
        frame.encounter.enemy.shieldPercent < before.encounter.enemy.shieldPercent;
      const hullDamaged =
        frame.encounter.playerHullPercent < before.encounter.playerHullPercent ||
        frame.encounter.enemy.hullPercent < before.encounter.enemy.hullPercent;
      if (shieldDamaged) cues.add('shield-impact');
      if (hullDamaged) cues.add('hull-impact');

      if (
        frame.reservePercent <= LOW_ENERGY_PERCENT &&
        before.reservePercent > LOW_ENERGY_PERCENT
      ) {
        cues.add('energy-warning');
      }
      if (
        (frame.weaponCapacitorPercent <= LOW_CAPACITOR_PERCENT &&
          before.weaponCapacitorPercent > LOW_CAPACITOR_PERCENT) ||
        (frame.encounter.feedback !== before.encounter.feedback &&
          isRechargeFeedback(frame.encounter.feedback))
      ) {
        cues.add('recharge-warning');
      }

      if (!before.mission.objectiveCompleted && frame.mission.objectiveCompleted) {
        cues.add('objective-complete');
      }
      if (before.encounter.phase !== frame.encounter.phase) {
        if (frame.encounter.phase === 'victory') cues.add('victory');
        if (frame.encounter.phase === 'defeat') cues.add('defeat');
      }

      if (before.mission.phase !== frame.mission.phase) {
        if (frame.mission.phase === 'outbound') cues.add('departure');
        if (frame.mission.phase === 'returning') cues.add('return');
        if (frame.mission.phase === 'completed') cues.add('base-arrival');
      }
      if (before.navigation.mode !== 'travel' && frame.navigation.mode === 'travel') {
        cues.add('travel');
      }

      return [...cues];
    },
  };
}
