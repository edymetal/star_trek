import { describe, expect, it } from 'vitest';

import {
  attemptControlRequest,
  deriveContinuousFlightInput,
  pointerPixelsToLookDelta,
  tacticalActionForCode,
} from './flight-input';

describe('deriveContinuousFlightInput', () => {
  it('mapeia teclado para voo e mantém eixos opostos neutros', () => {
    const input = deriveContinuousFlightInput(
      new Set(['KeyW', 'KeyA', 'KeyD', 'KeyQ', 'ShiftLeft', 'Space']),
    );

    expect(input).toEqual({
      boost: true,
      brake: true,
      pitch: 0,
      roll: -1,
      throttle: 1,
      yaw: 0,
    });
  });

  it('mantém deltas do mouse separados do input contínuo', () => {
    const input = deriveContinuousFlightInput(new Set(['ArrowUp']));
    const pointer = pointerPixelsToLookDelta({ x: 100, y: -100 });

    expect(input.pitch).toBe(1);
    expect(input.yaw).toBe(0);
    expect(pointer).toEqual({ pitchDegrees: 8, yawDegrees: -8 });
  });

  it('aplica sensibilidade e inversão vertical ao mouse com limite seguro', () => {
    const adjusted = pointerPixelsToLookDelta({ x: 20, y: -20 }, 1.5, true);
    expect(adjusted.pitchDegrees).toBeCloseTo(-2.4);
    expect(adjusted.yawDegrees).toBeCloseTo(-2.4);
    expect(pointerPixelsToLookDelta({ x: 1_000, y: 1_000 }, 2, false)).toEqual({
      pitchDegrees: -12,
      yawDegrees: -12,
    });
  });

  it('retorna entrada neutra depois de liberar todas as teclas', () => {
    expect(deriveContinuousFlightInput(new Set())).toEqual({
      boost: false,
      brake: false,
      pitch: 0,
      roll: 0,
      throttle: 0,
      yaw: 0,
    });
  });
});

describe('tacticalActionForCode', () => {
  it('mapeia seleção, scan, equipamentos e reinício sem conflitar com voo', () => {
    expect(tacticalActionForCode('KeyT')).toBe('select-target');
    expect(tacticalActionForCode('KeyR')).toBe('toggle-scan');
    expect(tacticalActionForCode('Digit1')).toBe('beam');
    expect(tacticalActionForCode('Digit2')).toBe('torpedo');
    expect(tacticalActionForCode('Digit3')).toBe('tractor');
    expect(tacticalActionForCode('KeyN')).toBe('restart-encounter');
    expect(tacticalActionForCode('KeyW')).toBeUndefined();
  });

  it('usa bindings táticos remapeados sem alterar os comandos fixos', () => {
    const bindings = {
      beam: 'KeyG',
      'select-target': 'KeyY',
      'toggle-scan': 'KeyH',
      torpedo: 'Digit5',
      tractor: 'Digit6',
    } as const;

    expect(tacticalActionForCode('KeyY', bindings)).toBe('select-target');
    expect(tacticalActionForCode('KeyT', bindings)).toBeUndefined();
    expect(tacticalActionForCode('KeyN', bindings)).toBe('restart-encounter');
  });
});

describe('attemptControlRequest', () => {
  it('conclui uma solicitação permitida sem feedback de erro', async () => {
    let rejected = false;
    await expect(
      attemptControlRequest(
        () => Promise.resolve(),
        () => {
          rejected = true;
        },
      ),
    ).resolves.toBe(true);
    expect(rejected).toBe(false);
  });

  it('absorve rejeição do navegador e publica feedback sem erro não tratado', async () => {
    let rejected = false;
    await expect(
      attemptControlRequest(
        () => Promise.reject(new DOMException('negado')),
        () => {
          rejected = true;
        },
      ),
    ).resolves.toBe(false);
    expect(rejected).toBe(true);
  });

  it('absorve erro síncrono da API do navegador e publica feedback', async () => {
    let rejected = false;
    await expect(
      attemptControlRequest(
        () => {
          throw new DOMException('indisponível');
        },
        () => {
          rejected = true;
        },
      ),
    ).resolves.toBe(false);
    expect(rejected).toBe(true);
  });
});
