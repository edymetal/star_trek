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

export type RemappableTacticalInputAction = Extract<
  TacticalInputAction,
  'beam' | 'select-target' | 'toggle-scan' | 'torpedo' | 'tractor'
>;

export interface FlightInputPreferences {
  readonly controlBindings: Readonly<Record<RemappableTacticalInputAction, string>>;
  readonly invertVerticalLook: boolean;
  readonly mouseSensitivity: number;
}

const DEFAULT_TACTICAL_BINDINGS: Readonly<Record<RemappableTacticalInputAction, string>> = {
  beam: 'Digit1',
  'select-target': 'KeyT',
  'toggle-scan': 'KeyR',
  torpedo: 'Digit2',
  tractor: 'Digit3',
};

export function tacticalActionForCode(
  code: string,
  bindings: Readonly<Record<RemappableTacticalInputAction, string>> = DEFAULT_TACTICAL_BINDINGS,
): TacticalInputAction | undefined {
  const fixedActions: Readonly<Record<string, TacticalInputAction>> = {
    KeyN: 'restart-encounter',
    KeyX: 'clear-target',
  };
  const remappableAction = Object.entries(bindings).find(
    ([, boundCode]) => boundCode === code,
  )?.[0];
  return (remappableAction as RemappableTacticalInputAction | undefined) ?? fixedActions[code];
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
    yaw: axis(['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight']),
  };
}

export function pointerPixelsToLookDelta(
  pointerDelta: PointerFlightDelta,
  sensitivity = 1,
  invertVerticalLook = false,
): PointerLookDelta {
  const clamp = (value: number): number => Math.max(-12, Math.min(12, value));
  const verticalDirection = invertVerticalLook ? 1 : -1;
  return {
    pitchDegrees: clamp(pointerDelta.y * verticalDirection * 0.08 * sensitivity),
    yawDegrees: clamp(-pointerDelta.x * 0.08 * sensitivity),
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
  setPreferences(preferences: FlightInputPreferences): void;
  toggleFullscreen(): Promise<boolean>;
}

export interface FlightInputControllerOptions {
  readonly canvas: HTMLCanvasElement;
  readonly fullscreenTarget: HTMLElement;
  readonly onControlFeedback: (message: string) => void;
  readonly onFocusLost: () => void;
  readonly onFullscreenChange: (active: boolean) => void;
  readonly onPauseToggle: () => void;
  readonly onPointerCaptureLost: () => void;
  readonly onPointerCaptureChange: (active: boolean) => void;
  readonly onTacticalAction: (action: TacticalInputAction) => void;
  readonly preferences?: FlightInputPreferences;
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
  let pointerCaptured = document.pointerLockElement === options.canvas;
  let pointerReleaseRequested = false;
  let preferences: FlightInputPreferences = options.preferences ?? {
    controlBindings: DEFAULT_TACTICAL_BINDINGS,
    invertVerticalLook: false,
    mouseSensitivity: 1,
  };

  const releaseInput = (): void => {
    pressedCodes.clear();
    pointerDelta = { x: 0, y: 0 };
  };
  const releasePointer = (): void => {
    if (document.pointerLockElement === options.canvas) {
      pointerReleaseRequested = true;
      document.exitPointerLock();
    }
  };
  const handleKeyDown = (event: KeyboardEvent): void => {
    const pauseKey = event.code === 'Escape' || event.code === 'KeyP';
    if (
      pauseKey &&
      !event.repeat &&
      (event.code === 'Escape' || !isInteractiveTarget(event.target))
    ) {
      event.preventDefault();
      releaseInput();
      releasePointer();
      options.onPauseToggle();
      return;
    }
    if (isInteractiveTarget(event.target)) {
      return;
    }
    if (event.code === 'KeyF' && !event.repeat) {
      event.preventDefault();
      void controller.toggleFullscreen();
      return;
    }
    const tacticalAction = tacticalActionForCode(event.code, preferences.controlBindings);
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
    const active = document.pointerLockElement === options.canvas;
    const unexpectedlyLost = pointerCaptured && !active && !pointerReleaseRequested;
    pointerCaptured = active;
    pointerReleaseRequested = false;
    if (!active) {
      pointerDelta = { x: 0, y: 0 };
    }
    if (unexpectedlyLost) {
      releaseInput();
      options.onPointerCaptureLost();
    }
    options.onPointerCaptureChange(active);
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
      const delta = pointerPixelsToLookDelta(
        pointerDelta,
        preferences.mouseSensitivity,
        preferences.invertVerticalLook,
      );
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
      options.canvas.focus();
      if (document.pointerLockElement === options.canvas) {
        return true;
      }
      return attemptControlRequest(
        () => options.canvas.requestPointerLock(),
        () => options.onControlFeedback('Não foi possível capturar o mouse. Use o teclado.'),
      );
    },
    setPreferences(nextPreferences) {
      preferences = nextPreferences;
      releaseInput();
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
