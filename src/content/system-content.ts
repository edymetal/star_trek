import {
  validateStarSystemDefinition,
  type StarSystemDefinition,
  type StarSystemNodeDefinition,
  type StarSystemRouteDefinition,
} from '../domain/navigation/system-navigation';

export const TRAINING_BASE_NODE_ID = 'aurora-base';

export const TRAINING_SYSTEM: StarSystemDefinition = {
  baseNodeId: TRAINING_BASE_NODE_ID,
  id: 'helios-training-system',
  label: 'Sistema Hélios',
  nodes: [
    {
      id: TRAINING_BASE_NODE_ID,
      kind: 'base',
      label: 'Base Aurora',
      summary: 'Doca segura de reparo, reabastecimento e comando do treinamento.',
    },
    {
      id: 'nereida-corridor',
      kind: 'mission',
      label: 'Corredor de Nereida',
      summary: 'Faixa externa de levantamento com sinais de uma sonda científica.',
    },
    {
      id: 'iris-ring',
      kind: 'mission',
      label: 'Anel de Íris',
      summary: 'Campo de detritos onde uma nave de pesquisa perdeu propulsão.',
    },
    {
      id: 'aurora-defense-corridor',
      kind: 'mission',
      label: 'Corredor Aurora',
      summary: 'Rota de defesa da base com atividade hostil confirmada.',
    },
    {
      id: 'iris-prime',
      kind: 'point-of-interest',
      label: 'Íris Prime',
      summary: 'Gigante azul observado em escala artística pelos sensores de longo alcance.',
    },
    {
      id: 'caligo-veil',
      kind: 'point-of-interest',
      label: 'Véu de Caligo',
      summary: 'Anomalia luminosa catalogada; ainda não possui missão disponível.',
    },
  ],
  routes: [
    {
      distanceUnits: 18,
      durationSeconds: 1.8,
      fromNodeId: TRAINING_BASE_NODE_ID,
      id: 'route-nereida',
      toNodeId: 'nereida-corridor',
    },
    {
      distanceUnits: 27,
      durationSeconds: 2.1,
      fromNodeId: TRAINING_BASE_NODE_ID,
      id: 'route-iris-ring',
      toNodeId: 'iris-ring',
    },
    {
      distanceUnits: 32,
      durationSeconds: 2.4,
      fromNodeId: TRAINING_BASE_NODE_ID,
      id: 'route-aurora-defense',
      toNodeId: 'aurora-defense-corridor',
    },
    {
      distanceUnits: 35,
      durationSeconds: 2.6,
      fromNodeId: TRAINING_BASE_NODE_ID,
      id: 'route-iris-prime',
      toNodeId: 'iris-prime',
    },
    {
      distanceUnits: 41,
      durationSeconds: 2.9,
      fromNodeId: TRAINING_BASE_NODE_ID,
      id: 'route-caligo',
      toNodeId: 'caligo-veil',
    },
  ],
};

validateStarSystemDefinition(TRAINING_SYSTEM);

export function getTrainingSystemNode(nodeId: string): StarSystemNodeDefinition {
  const node = TRAINING_SYSTEM.nodes.find(({ id }) => id === nodeId);
  if (node === undefined) throw new Error(`Destino desconhecido no Sistema Hélios: ${nodeId}.`);
  return node;
}

export function getTrainingRouteFromBase(destinationNodeId: string): StarSystemRouteDefinition {
  const route = TRAINING_SYSTEM.routes.find(
    ({ fromNodeId, toNodeId }) =>
      (fromNodeId === TRAINING_BASE_NODE_ID && toNodeId === destinationNodeId) ||
      (toNodeId === TRAINING_BASE_NODE_ID && fromNodeId === destinationNodeId),
  );
  if (route === undefined) {
    throw new Error(`Nenhuma rota liga a Base Aurora ao destino ${destinationNodeId}.`);
  }
  return route;
}
