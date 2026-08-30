import { describe, expect, it } from 'vitest';

import {
  createSystemNavigation,
  validateStarSystemDefinition,
  type StarSystemDefinition,
} from './system-navigation';

const definition: StarSystemDefinition = {
  baseNodeId: 'base',
  id: 'test-system',
  label: 'Sistema de teste',
  nodes: [
    { id: 'base', kind: 'base', label: 'Base', summary: 'Ponto seguro.' },
    { id: 'mission-a', kind: 'mission', label: 'Missão A', summary: 'Destino tático.' },
    { id: 'poi-a', kind: 'point-of-interest', label: 'POI A', summary: 'Planeta.' },
    { id: 'poi-b', kind: 'point-of-interest', label: 'POI B', summary: 'Anomalia.' },
  ],
  routes: [
    {
      distanceUnits: 12,
      durationSeconds: 2,
      fromNodeId: 'base',
      id: 'route-a',
      toNodeId: 'mission-a',
    },
  ],
};

describe('createSystemNavigation', () => {
  it('conduz base, mapa, viagem, encontro e retorno pela mesma rota', () => {
    const navigation = createSystemNavigation(definition);

    expect(navigation.getSnapshot()).toMatchObject({ currentNodeId: 'base', mode: 'base' });
    expect(navigation.openMap()).toEqual({ accepted: true });
    expect(navigation.selectDestination('mission-a')).toEqual({ accepted: true });
    expect(navigation.getSnapshot().selectedRoute).toMatchObject({
      destinationNodeId: 'mission-a',
      distanceUnits: 12,
      durationSeconds: 2,
    });
    expect(navigation.beginOutboundTravel()).toEqual({ accepted: true });
    expect(navigation.getSnapshot()).toMatchObject({ mode: 'travel' });
    expect(navigation.arrive()).toEqual({ accepted: true });
    expect(navigation.getSnapshot()).toMatchObject({
      currentNodeId: 'mission-a',
      mode: 'encounter',
    });

    expect(navigation.beginReturnTravel()).toEqual({ accepted: true });
    expect(navigation.getSnapshot().activeRoute).toMatchObject({
      destinationNodeId: 'base',
      direction: 'returning',
      originNodeId: 'mission-a',
    });
    expect(navigation.arrive()).toEqual({ accepted: true });
    expect(navigation.getSnapshot()).toMatchObject({ currentNodeId: 'base', mode: 'base' });
  });

  it('rejeita destino desconhecido, rota ausente e comandos fora de estado', () => {
    const navigation = createSystemNavigation(definition);

    expect(navigation.beginOutboundTravel()).toEqual({
      accepted: false,
      reason: 'invalid-state',
    });
    navigation.openMap();
    expect(navigation.beginOutboundTravel()).toEqual({
      accepted: false,
      reason: 'destination-required',
    });
    expect(navigation.selectDestination('unknown')).toEqual({
      accepted: false,
      reason: 'unknown-destination',
    });
    expect(navigation.selectDestination('poi-a')).toEqual({
      accepted: false,
      reason: 'route-unavailable',
    });
    expect(navigation.arrive()).toEqual({ accepted: false, reason: 'invalid-state' });
  });

  it('fecha o mapa sem criar uma viagem', () => {
    const navigation = createSystemNavigation(definition);
    navigation.openMap();
    navigation.selectDestination('mission-a');

    expect(navigation.closeMap()).toEqual({ accepted: true });
    expect(navigation.getSnapshot()).toEqual({ currentNodeId: 'base', mode: 'base' });
  });
});

describe('validateStarSystemDefinition', () => {
  it('valida IDs, base, referências e medidas das rotas', () => {
    expect(() => validateStarSystemDefinition({ ...definition, nodes: [] })).toThrow(
      'ao menos três destinos',
    );
    expect(() =>
      validateStarSystemDefinition({
        ...definition,
        nodes: [...definition.nodes, definition.nodes[0]!],
      }),
    ).toThrow('duplicado');
    expect(() => validateStarSystemDefinition({ ...definition, baseNodeId: 'mission-a' })).toThrow(
      'base do sistema',
    );
    expect(() =>
      validateStarSystemDefinition({
        ...definition,
        routes: [{ ...definition.routes[0]!, durationSeconds: 0 }],
      }),
    ).toThrow('positivas');
    expect(() =>
      validateStarSystemDefinition({
        ...definition,
        routes: [{ ...definition.routes[0]!, toNodeId: 'unknown' }],
      }),
    ).toThrow('referencia');
  });
});
