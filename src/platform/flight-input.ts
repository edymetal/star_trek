import type { ContinuousFlightInput, PointerLookDelta } from '../domain/flight/ship-flight';

export interface PointerFlightDelta {
  readonly x: number;
  readonly y: number;
}

export type TacticalInputAction =
  | 'select-target'
  | 'clear-target'
  | 'toggle-scan'
  | 'beam'
  | 'torpedo'
  | 'tractor'
  | 'restart-encounter';

export function tacticalActionForCode(code: string): TacticalInputAction | undefined {
  const actions: Readonly<Record<string, TacticalInputAction>> = {
    Digit1: 'beam',
    Digit2: 'torpedo',
    Digit3: 'tractor',
    KeyN: 'restart-encounter',
    KeyR: 'toggle-scan',
    KeyT: 'select-target',
    KeyX: 'clear-target',
  };
  return actions[code];
}

export function deriveContinuousFlightInput(
  pressedCodes: ReadonlySet<string>,
): ContinuousFlightInput {
  const axis = (positiveCodes: readonly string[], negativeCodes: readonly string[]): number => {
    const positive = positiveCodes.some((code) => pressedCodes.has(code)) ? 1 : 0;
    const negative = negativeCodes.some((code) => pressedCodes.has(code)) ? 1 : 0;
    return positive - negative;
  };
  return {
    boost: pressedCodes.has('ShiftLeft') || pressedCodes.has('ShiftRight'),
    brake: pressedCodes.has('Space'),
    pitch: axis(['ArrowUp'], ['ArrowDown']),
    roll: axis(['KeyE'], ['KeyQ']),
    throttle: axis(['KeyW'], ['KeyS']),
    yaw: axis(['KeyD', 'ArrowRight'], ['KeyA', 'ArrowLeft']),
  };
}

export function pointerPixelsToLookDelta(pointerDelta: PointerFlightDelta): PointerLookDelta {
  const clamp = (value: number): number => Math.max(-12, Math.min(12, value));
  return {
    pitchDegrees: clamp(-pointerDelta.y * 0.08),
    yawDegrees: clamp(-pointerDelta.x * 0.08),
  };
}

export async function attemptControlRequest(
  request: () => Promise<void> | void,
  onRejected: () => void,
): Promise<boolean> {
  try {
    await request();
    return true;
  } catch {
    onRejected();
    return false;
  }
}

export interface FlightInputController {
  consumePointerDelta(): PointerLookDelta;
  dispose(): void;
  isPointerCaptured(): boolean;
  readContinuousInput(): ContinuousFlightInput;
  releaseControls(): void;
  requestPointerCapture(): Promise<boolean>;
  toggleFullscreen(): Promise<boolean>;
}

export interface FlightInputControllerOptions {
  readonly canvas: HTMLCanvasElement;
  readonly fullscreenTarget: HTMLElement;
  readonly onControlFeedback: (message: string) => void;
  readonly onFocusLost: () => void;
  readonly onFullscreenChange: (active: boolean) => void;
  readonly onPauseToggle: () => void;
  readonly onPointerCaptureChange: (active: boolean) => void;
  readonly onTacticalAction: (action: TacticalInputAction) => void;
}

const FLIGHT_CODES = new Set([
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'KeyA',
  'KeyD',
  'KeyE',
  'KeyQ',
  'KeyS',
  'KeyW',
  'ShiftLeft',
  'ShiftRight',
  'Space',
]);

function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.matches('button, input, select, textarea, a[href]') || target.isContentEditable)
  );
}

export function createFlightInputController(
  options: FlightInputControllerOptions,
): FlightInputController {
  const pressedCodes = new Set<string>();
  let pointerDelta: PointerFlightDelta = { x: 0, y: 0 };

  const releaseInput = (): void => {
    pressedCodes.clear();
    pointerDelta = { x: 0, y: 0 };
  };
  const releasePointer = (): void => {
    if (document.pointerLockElement === options.canvas) {
      document.exitPointerLock();
    }
  };
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (isInteractiveTarget(event.target)) {
      return;
    }
    if (event.code === 'Escape' && document.pointerLockElement === options.canvas) {
      releaseInput();
      releasePointer();
      return;
    }
    if (event.code === 'KeyP' && !event.repeat) {
      event.preventDefault();
      releaseInput();
      releasePointer();
      options.onPauseToggle();
      return;
    }
    if (event.code === 'KeyF' && !event.repeat) {
      event.preventDefault();
      void controller.toggleFullscreen();
      return;
    }
    const tacticalAction = tacticalActionForCode(event.code);
    if (tacticalAction !== undefined && !event.repeat) {
      event.preventDefault();
      options.onTacticalAction(tacticalAction);
      return;
    }
    if (FLIGHT_CODES.has(event.code)) {
      event.preventDefault();
      pressedCodes.add(event.code);
    }
  };
  const handleKeyUp = (event: KeyboardEvent): void => {
    pressedCodes.delete(event.code);
  };
  const handleMouseMove = (event: MouseEvent): void => {
    if (document.pointerLockElement !== options.canvas) {
      return;
    }
    pointerDelta = {
      x: pointerDelta.x + event.movementX,
      y: pointerDelta.y + event.movementY,
    };
  };
  const handleFocusLost = (): void => {
    releaseInput();
    releasePointer();
    options.onFocusLost();
  };
  const handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      handleFocusLost();
    }
  };
  const handlePointerLockChange = (): void => {
    if (document.pointerLockElement !== options.canvas) {
      pointerDelta = { x: 0, y: 0 };
    }
    options.onPointerCaptureChange(document.pointerLockElement === options.canvas);
  };
  const handleFullscreenChange = (): void => {
    options.onFullscreenChange(document.fullscreenElement === options.fullscreenTarget);
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', handleFocusLost);
  window.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  document.addEventListener('pointerlockchange', handlePointerLockChange);
  document.addEventListener('fullscreenchange', handleFullscreenChange);

  const controller: FlightInputController = {
    consumePointerDelta() {
      const delta = pointerPixelsToLookDelta(pointerDelta);
      pointerDelta = { x: 0, y: 0 };
      return delta;
    },
    dispose() {
      releaseInput();
      releasePointer();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleFocusLost);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    },
    isPointerCaptured() {
      return document.pointerLockElement === options.canvas;
    },
    readContinuousInput() {
      return deriveContinuousFlightInput(pressedCodes);
    },
    releaseControls() {
      releaseInput();
      releasePointer();
    },
    async requestPointerCapture() {
      if (document.pointerLockElement === options.canvas) {
        return true;
      }
      return attemptControlRequest(
        () => options.canvas.requestPointerLock(),
        () => options.onControlFeedback('Não foi possível capturar o mouse. Use o teclado.'),
      );
    },
    async toggleFullscreen() {
      const entering = document.fullscreenElement !== options.fullscreenTarget;
      return attemptControlRequest(
        () => (entering ? options.fullscreenTarget.requestFullscreen() : document.exitFullscreen()),
        () =>
          options.onControlFeedback(
            entering
              ? 'Não foi possível ativar a tela cheia.'
              : 'Não foi possível sair da tela cheia.',
          ),
      );
    },
  };

  return controller;
}
