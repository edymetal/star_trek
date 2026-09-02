import { describe, expect, it } from 'vitest';

import type { GameAudioAmbienceMode, GameAudioCue } from '../application/audio-cue-router';
import {
  createGameAudioAdapter,
  type AudioVoiceHandle,
  type GameAudioBackend,
  type GameAudioPreferences,
  type GameAudioTelemetry,
} from './game-audio';

const DEFAULT_PREFERENCES: GameAudioPreferences = {
  ambienceVolumePercent: 60,
  audioMuted: false,
  effectsVolumePercent: 80,
  masterVolumePercent: 75,
};

class FakeAudioBackend implements GameAudioBackend {
  closed = false;
  readonly effects: Array<{ cue: GameAudioCue; finish: () => void; stopped: boolean }> = [];
  readonly ambience: Array<{
    finish: () => void;
    mode: Exclude<GameAudioAmbienceMode, 'silent'>;
    stopped: boolean;
  }> = [];
  preferences: GameAudioPreferences | undefined;
  resumeCount = 0;
  suspendCount = 0;
  failResume = false;

  async close(): Promise<void> {
    this.closed = true;
  }

  playAmbience(
    mode: Exclude<GameAudioAmbienceMode, 'silent'>,
    onEnded: () => void,
  ): AudioVoiceHandle {
    const voice = { finish: onEnded, mode, stopped: false };
    this.ambience.push(voice);
    return {
      stop: () => {
        if (voice.stopped) return;
        voice.stopped = true;
        voice.finish();
      },
    };
  }

  playEffect(cue: GameAudioCue, onEnded: () => void): AudioVoiceHandle {
    const voice = { cue, finish: onEnded, stopped: false };
    this.effects.push(voice);
    return {
      stop: () => {
        if (voice.stopped) return;
        voice.stopped = true;
        voice.finish();
      },
    };
  }

  async resume(): Promise<void> {
    this.resumeCount += 1;
    if (this.failResume) throw new Error('bloqueado');
  }

  setPreferences(preferences: GameAudioPreferences): void {
    this.preferences = preferences;
  }

  async suspend(): Promise<void> {
    this.suspendCount += 1;
  }
}

function fixture(maximumEffectVoices = 3): {
  readonly audio: ReturnType<typeof createGameAudioAdapter>;
  readonly backend: FakeAudioBackend;
  readonly telemetry: GameAudioTelemetry[];
} {
  const backend = new FakeAudioBackend();
  const telemetry: GameAudioTelemetry[] = [];
  const audio = createGameAudioAdapter({
    createBackend: () => backend,
    initialPreferences: DEFAULT_PREFERENCES,
    maximumEffectVoices,
    onTelemetry: (value) => telemetry.push(value),
  });
  return { audio, backend, telemetry };
}

describe('game audio adapter', () => {
  it('permanece bloqueado até unlock explícito e aplica volumes ao criar o backend', async () => {
    const { audio, backend, telemetry } = fixture();
    audio.play(['beam']);

    expect(backend.effects).toHaveLength(0);
    expect(telemetry.at(-1)).toEqual({ activeEffectVoices: 0, state: 'locked' });
    await expect(audio.unlock()).resolves.toBe(true);
    expect(backend.preferences).toEqual(DEFAULT_PREFERENCES);
    expect(telemetry.at(-1)?.state).toBe('ready');
  });

  it('limita vozes, descarta a mais antiga e remove vozes concluídas', async () => {
    const { audio, backend, telemetry } = fixture(2);
    await audio.unlock();

    audio.play(['beam', 'tractor', 'torpedo-launch']);
    expect(backend.effects).toHaveLength(3);
    expect(backend.effects[0]?.stopped).toBe(true);
    expect(telemetry.at(-1)?.activeEffectVoices).toBe(2);

    backend.effects[1]?.finish();
    expect(telemetry.at(-1)?.activeEffectVoices).toBe(1);
  });

  it('encerra efeitos e ambiente ao pausar, silenciar, trocar estado e descartar', async () => {
    const { audio, backend, telemetry } = fixture();
    await audio.unlock();
    audio.setAmbienceMode('encounter');
    audio.play(['beam']);

    await audio.setPaused(true);
    expect(backend.effects[0]?.stopped).toBe(true);
    expect(backend.ambience[0]?.stopped).toBe(true);
    expect(telemetry.at(-1)?.state).toBe('suspended');

    await audio.setPaused(false);
    expect(backend.ambience.at(-1)?.mode).toBe('encounter');
    audio.setPreferences({ ...DEFAULT_PREFERENCES, audioMuted: true });
    expect(backend.ambience.at(-1)?.stopped).toBe(true);
    expect(telemetry.at(-1)?.state).toBe('muted');

    await audio.dispose();
    expect(backend.closed).toBe(true);
    expect(telemetry.at(-1)).toEqual({ activeEffectVoices: 0, state: 'disposed' });
  });

  it('trata backend ausente ou falha de desbloqueio sem lançar', async () => {
    const unavailable: GameAudioTelemetry[] = [];
    const withoutBackend = createGameAudioAdapter({
      createBackend: () => undefined,
      initialPreferences: DEFAULT_PREFERENCES,
      onTelemetry: (value) => unavailable.push(value),
    });
    await expect(withoutBackend.unlock()).resolves.toBe(false);
    expect(unavailable.at(-1)?.state).toBe('unavailable');

    const { audio, backend, telemetry } = fixture();
    backend.failResume = true;
    await expect(audio.unlock()).resolves.toBe(false);
    expect(telemetry.at(-1)?.state).toBe('error');
  });
});
