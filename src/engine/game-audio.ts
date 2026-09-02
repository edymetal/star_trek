import type { GameAudioAmbienceMode, GameAudioCue } from '../application/audio-cue-router';

export interface GameAudioPreferences {
  readonly ambienceVolumePercent: number;
  readonly audioMuted: boolean;
  readonly effectsVolumePercent: number;
  readonly masterVolumePercent: number;
}

export type GameAudioState =
  'disposed' | 'error' | 'locked' | 'muted' | 'ready' | 'suspended' | 'unavailable';

export interface GameAudioTelemetry {
  readonly activeEffectVoices: number;
  readonly state: GameAudioState;
}

export interface AudioVoiceHandle {
  stop(): void;
}

export interface GameAudioBackend {
  close(): Promise<void>;
  playAmbience(
    mode: Exclude<GameAudioAmbienceMode, 'silent'>,
    onEnded: () => void,
  ): AudioVoiceHandle;
  playEffect(cue: GameAudioCue, onEnded: () => void): AudioVoiceHandle;
  resume(): Promise<void>;
  setPreferences(preferences: GameAudioPreferences): void;
  suspend(): Promise<void>;
}

export interface GameAudioAdapter {
  dispose(): Promise<void>;
  play(cues: readonly GameAudioCue[]): void;
  setAmbienceMode(mode: GameAudioAmbienceMode): void;
  setPaused(paused: boolean): Promise<void>;
  setPreferences(preferences: GameAudioPreferences): void;
  unlock(): Promise<boolean>;
}

export interface GameAudioAdapterOptions {
  readonly createBackend: () => GameAudioBackend | undefined;
  readonly initialPreferences: GameAudioPreferences;
  readonly maximumEffectVoices?: number;
  readonly onTelemetry: (telemetry: GameAudioTelemetry) => void;
}

interface ActiveVoice {
  readonly handle: AudioVoiceHandle;
  readonly id: number;
}

export function createGameAudioAdapter(options: GameAudioAdapterOptions): GameAudioAdapter {
  const maximumEffectVoices = Math.max(1, options.maximumEffectVoices ?? 10);
  let preferences = options.initialPreferences;
  let backend: GameAudioBackend | undefined;
  let ambienceMode: GameAudioAmbienceMode = 'silent';
  let ambienceVoice: AudioVoiceHandle | undefined;
  let paused = false;
  let disposed = false;
  let state: GameAudioState = preferences.audioMuted ? 'muted' : 'locked';
  let nextVoiceId = 0;
  const effectVoices: ActiveVoice[] = [];

  const publish = (): void => {
    options.onTelemetry({ activeEffectVoices: effectVoices.length, state });
  };
  const stopEffects = (): void => {
    const active = effectVoices.splice(0);
    for (const voice of active) voice.handle.stop();
  };
  const stopAmbience = (): void => {
    const voice = ambienceVoice;
    ambienceVoice = undefined;
    voice?.stop();
  };
  const reportFailure = (): void => {
    stopEffects();
    stopAmbience();
    state = 'error';
    publish();
  };
  const startAmbience = (): void => {
    stopAmbience();
    if (
      backend === undefined ||
      paused ||
      preferences.audioMuted ||
      ambienceMode === 'silent' ||
      state === 'error' ||
      state === 'unavailable'
    ) {
      return;
    }
    try {
      const startedMode = ambienceMode;
      ambienceVoice = backend.playAmbience(startedMode, () => {
        ambienceVoice = undefined;
        publish();
      });
    } catch {
      reportFailure();
    }
  };

  publish();
  return {
    async dispose() {
      if (disposed) return;
      disposed = true;
      stopEffects();
      stopAmbience();
      const activeBackend = backend;
      backend = undefined;
      if (activeBackend !== undefined) {
        try {
          await activeBackend.close();
        } catch {
          // A sessão já está encerrada; falha de fechamento não pode reabrir áudio.
        }
      }
      state = 'disposed';
      publish();
    },
    play(cues) {
      if (
        disposed ||
        backend === undefined ||
        paused ||
        preferences.audioMuted ||
        state !== 'ready'
      ) {
        return;
      }
      try {
        for (const cue of cues) {
          while (effectVoices.length >= maximumEffectVoices) {
            effectVoices.shift()?.handle.stop();
          }
          nextVoiceId += 1;
          const id = nextVoiceId;
          const handle = backend.playEffect(cue, () => {
            const index = effectVoices.findIndex((voice) => voice.id === id);
            if (index >= 0) effectVoices.splice(index, 1);
            publish();
          });
          effectVoices.push({ handle, id });
        }
        publish();
      } catch {
        reportFailure();
      }
    },
    setAmbienceMode(mode) {
      if (ambienceMode === mode) return;
      ambienceMode = mode;
      startAmbience();
      publish();
    },
    async setPaused(nextPaused) {
      if (disposed || paused === nextPaused) return;
      paused = nextPaused;
      if (backend === undefined) return;
      if (paused) {
        stopEffects();
        stopAmbience();
        try {
          await backend.suspend();
          state = 'suspended';
          publish();
        } catch {
          reportFailure();
        }
        return;
      }
      try {
        await backend.resume();
        state = preferences.audioMuted ? 'muted' : 'ready';
        startAmbience();
        publish();
      } catch {
        reportFailure();
      }
    },
    setPreferences(nextPreferences) {
      preferences = nextPreferences;
      if (backend === undefined) {
        state = preferences.audioMuted ? 'muted' : 'locked';
        publish();
        return;
      }
      try {
        backend.setPreferences(preferences);
      } catch {
        reportFailure();
        return;
      }
      if (preferences.audioMuted) {
        stopEffects();
        stopAmbience();
        if (backend !== undefined && !paused && state !== 'error') state = 'muted';
      } else if (backend !== undefined && !paused && state !== 'error') {
        state = 'ready';
        startAmbience();
      }
      publish();
    },
    async unlock() {
      if (disposed) return false;
      try {
        backend ??= options.createBackend();
        if (backend === undefined) {
          state = 'unavailable';
          publish();
          return false;
        }
        backend.setPreferences(preferences);
        await backend.resume();
        if (paused) await backend.suspend();
        state = paused ? 'suspended' : preferences.audioMuted ? 'muted' : 'ready';
        if (!paused) startAmbience();
        publish();
        return true;
      } catch {
        reportFailure();
        return false;
      }
    },
  };
}
