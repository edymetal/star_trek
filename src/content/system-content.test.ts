import { describe, expect, it } from 'vitest';

import { INITIAL_TUTORIAL_MISSIONS } from './mission-content';
import {
  getTrainingRouteFromBase,
  getTrainingSystemNode,
  TRAINING_BASE_NODE_ID,
  TRAINING_SYSTEM,
} from './system-content';

describe('training system content', () => {
  it('define base, destinos de missão e ao menos dois pontos de interesse', () => {
    expect(getTrainingSystemNode(TRAINING_BASE_NODE_ID).kind).toBe('base');
    expect(TRAINING_SYSTEM.nodes.filter(({ kind }) => kind === 'point-of-interest')).toHaveLength(
      2,
    );
    expect(new Set(TRAINING_SYSTEM.nodes.map(({ id }) => id)).size).toBe(
      TRAINING_SYSTEM.nodes.length,
    );
  });

  it('liga cada missão à base com duração coerente com a campanha', () => {
    for (const mission of INITIAL_TUTORIAL_MISSIONS) {
      const route = getTrainingRouteFromBase(mission.destinationNodeId);
      expect(route.durationSeconds).toBe(mission.travelDurationSeconds);
      expect(getTrainingSystemNode(mission.destinationNodeId).kind).toBe('mission');
    }
  });

  it('produz erros acionáveis para destino ou rota ausente', () => {
    expect(() => getTrainingSystemNode('unknown')).toThrow('Destino desconhecido');
    expect(() => getTrainingRouteFromBase(TRAINING_BASE_NODE_ID)).toThrow('Nenhuma rota');
  });
});
