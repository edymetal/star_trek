import { describe, expect, it } from 'vitest';

import { createThrottledPublisher } from './throttled-publisher';

describe('createThrottledPublisher', () => {
  it('limita publicações periódicas a 8 Hz sem limitar chamadas da simulação', () => {
    const published: number[] = [];
    const publisher = createThrottledPublisher<number>(1 / 8, (value) => published.push(value));
    let simulationCalls = 0;
    let telemetryCollections = 0;

    for (let frame = 0; frame < 144; frame += 1) {
      simulationCalls += 1;
      publisher.publishIfDue(1 / 144, () => {
        telemetryCollections += 1;
        return frame;
      });
    }

    expect(simulationCalls).toBe(144);
    expect(published).toHaveLength(9);
    expect(telemetryCollections).toBe(published.length);
    expect(published[0]).toBe(0);
  });

  it('permite publicação imediata para mudanças de pausa', () => {
    const published: string[] = [];
    const publisher = createThrottledPublisher<string>(0.125, (value) => published.push(value));

    publisher.publishIfDue(0, () => 'inicial');
    publisher.publishNow('pausada');
    publisher.publishIfDue(0.1, () => 'não publicada');

    expect(published).toEqual(['inicial', 'pausada']);
  });

  it('rejeita intervalo inválido', () => {
    expect(() => createThrottledPublisher(0, () => undefined)).toThrow(/maior que zero/);
  });
});
