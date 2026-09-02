import type { GameAudioCue } from '../application/audio-cue-router';
import type { AudioVoiceHandle, GameAudioBackend, GameAudioPreferences } from './game-audio';

interface ToneStep {
  readonly durationSeconds: number;
  readonly endFrequencyHz?: number;
  readonly frequencyHz: number;
  readonly gain: number;
  readonly offsetSeconds: number;
  readonly type: OscillatorType;
}

const CUE_TONES: Readonly<Record<GameAudioCue, readonly ToneStep[]>> = {
  'base-arrival': [tone(0, 0.18, 196, 0.2, 'sine'), tone(0.15, 0.32, 294, 0.18, 'sine')],
  beam: [tone(0, 0.2, 760, 0.2, 'sawtooth', 220)],
  departure: [tone(0, 0.42, 110, 0.18, 'triangle', 330)],
  defeat: [tone(0, 0.5, 180, 0.2, 'sawtooth', 58), tone(0.32, 0.55, 82, 0.18, 'sine', 41)],
  'energy-warning': [tone(0, 0.12, 240, 0.22, 'square'), tone(0.2, 0.12, 240, 0.22, 'square')],
  'hull-impact': [tone(0, 0.28, 92, 0.3, 'sawtooth', 42)],
  'objective-complete': [
    tone(0, 0.14, 330, 0.17, 'sine'),
    tone(0.12, 0.14, 440, 0.17, 'sine'),
    tone(0.24, 0.24, 660, 0.16, 'sine'),
  ],
  'recharge-warning': [tone(0, 0.1, 520, 0.16, 'square'), tone(0.14, 0.18, 360, 0.15, 'square')],
  return: [tone(0, 0.34, 294, 0.16, 'triangle', 147)],
  'scan-complete': [tone(0, 0.12, 440, 0.15, 'sine'), tone(0.1, 0.22, 880, 0.14, 'sine')],
  'shield-impact': [tone(0, 0.24, 310, 0.23, 'triangle', 120)],
  'target-select': [tone(0, 0.1, 620, 0.13, 'sine'), tone(0.08, 0.08, 930, 0.1, 'sine')],
  'torpedo-impact': [tone(0, 0.34, 170, 0.3, 'square', 48)],
  'torpedo-launch': [tone(0, 0.36, 130, 0.24, 'sawtooth', 520)],
  tractor: [tone(0, 0.42, 98, 0.2, 'square', 147)],
  travel: [tone(0, 0.45, 220, 0.14, 'sine', 660)],
  'ui-confirm': [tone(0, 0.12, 523, 0.14, 'sine'), tone(0.1, 0.14, 784, 0.12, 'sine')],
  victory: [
    tone(0, 0.18, 262, 0.18, 'triangle'),
    tone(0.16, 0.18, 392, 0.18, 'triangle'),
    tone(0.32, 0.34, 523, 0.18, 'triangle'),
  ],
};

function tone(
  offsetSeconds: number,
  durationSeconds: number,
  frequencyHz: number,
  gain: number,
  type: OscillatorType,
  endFrequencyHz?: number,
): ToneStep {
  return {
    durationSeconds,
    ...(endFrequencyHz === undefined ? {} : { endFrequencyHz }),
    frequencyHz,
    gain,
    offsetSeconds,
    type,
  };
}

function volumeGain(percent: number): number {
  const fraction = Math.max(0, Math.min(100, percent)) / 100;
  return fraction * fraction;
}

export function createBrowserGameAudioBackend(): GameAudioBackend | undefined {
  if (typeof window.AudioContext !== 'function') return undefined;
  const context = new window.AudioContext({ latencyHint: 'interactive' });
  const masterGain = context.createGain();
  const effectsGain = context.createGain();
  const ambienceGain = context.createGain();
  effectsGain.connect(masterGain);
  ambienceGain.connect(masterGain);
  masterGain.connect(context.destination);

  function playSequence(steps: readonly ToneStep[], onEnded: () => void): AudioVoiceHandle {
    const voiceGain = context.createGain();
    voiceGain.gain.value = 1;
    voiceGain.connect(effectsGain);
    const oscillators: OscillatorNode[] = [];
    const envelopes: GainNode[] = [];
    let finished = false;
    const finalize = (): void => {
      if (finished) return;
      finished = true;
      for (const oscillator of oscillators) oscillator.disconnect();
      for (const envelope of envelopes) envelope.disconnect();
      voiceGain.disconnect();
      onEnded();
    };
    const startTime = context.currentTime + 0.005;
    let latestStopTime = startTime;
    let latestOscillator: OscillatorNode | undefined;
    for (const step of steps) {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      const toneStart = startTime + step.offsetSeconds;
      const toneEnd = toneStart + step.durationSeconds;
      oscillator.type = step.type;
      oscillator.frequency.setValueAtTime(step.frequencyHz, toneStart);
      if (step.endFrequencyHz !== undefined) {
        oscillator.frequency.exponentialRampToValueAtTime(step.endFrequencyHz, toneEnd);
      }
      envelope.gain.setValueAtTime(0.0001, toneStart);
      envelope.gain.exponentialRampToValueAtTime(step.gain, toneStart + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.0001, toneEnd);
      oscillator.connect(envelope);
      envelope.connect(voiceGain);
      oscillator.start(toneStart);
      oscillator.stop(toneEnd + 0.01);
      oscillators.push(oscillator);
      envelopes.push(envelope);
      if (toneEnd >= latestStopTime) {
        latestStopTime = toneEnd;
        latestOscillator = oscillator;
      }
    }
    if (latestOscillator === undefined) {
      finalize();
    } else {
      latestOscillator.addEventListener('ended', finalize, { once: true });
    }
    return {
      stop() {
        if (finished) return;
        for (const oscillator of oscillators) {
          try {
            oscillator.stop();
          } catch {
            // Uma voz pode já ter terminado entre a inspeção e o descarte.
          }
        }
        finalize();
      },
    };
  }

  return {
    async close() {
      if (context.state !== 'closed') await context.close();
    },
    playAmbience(mode, onEnded) {
      const voiceGain = context.createGain();
      const frequencies = mode === 'base' ? [72, 108] : mode === 'travel' ? [54, 216] : [61, 92];
      voiceGain.gain.value = mode === 'encounter' ? 0.045 : 0.035;
      voiceGain.connect(ambienceGain);
      const oscillators = frequencies.map((frequency, index) => {
        const oscillator = context.createOscillator();
        oscillator.type = index === 0 ? 'sine' : 'triangle';
        oscillator.frequency.value = frequency;
        oscillator.connect(voiceGain);
        oscillator.start();
        return oscillator;
      });
      let finished = false;
      return {
        stop() {
          if (finished) return;
          finished = true;
          for (const oscillator of oscillators) {
            try {
              oscillator.stop();
            } catch {
              // O contexto pode ter sido encerrado pelo navegador.
            }
            oscillator.disconnect();
          }
          voiceGain.disconnect();
          onEnded();
        },
      };
    },
    playEffect(cue, onEnded) {
      return playSequence(CUE_TONES[cue], onEnded);
    },
    async resume() {
      if (context.state === 'closed') throw new Error('Contexto de áudio encerrado.');
      if (context.state !== 'running') await context.resume();
      if (context.state !== 'running') throw new Error('O navegador manteve o áudio suspenso.');
    },
    setPreferences(preferences: GameAudioPreferences) {
      const now = context.currentTime;
      masterGain.gain.setTargetAtTime(volumeGain(preferences.masterVolumePercent), now, 0.015);
      effectsGain.gain.setTargetAtTime(volumeGain(preferences.effectsVolumePercent), now, 0.015);
      ambienceGain.gain.setTargetAtTime(volumeGain(preferences.ambienceVolumePercent), now, 0.015);
    },
    async suspend() {
      if (context.state === 'running') await context.suspend();
    },
  };
}
