export type NavigationNodeKind = 'base' | 'mission' | 'point-of-interest';

export interface StarSystemNodeDefinition {
  readonly id: string;
  readonly kind: NavigationNodeKind;
  readonly label: string;
  readonly summary: string;
}

export interface StarSystemRouteDefinition {
  readonly distanceUnits: number;
  readonly durationSeconds: number;
  readonly fromNodeId: string;
  readonly id: string;
  readonly toNodeId: string;
}

export interface StarSystemDefinition {
  readonly baseNodeId: string;
  readonly id: string;
  readonly label: string;
  readonly nodes: readonly StarSystemNodeDefinition[];
  readonly routes: readonly StarSystemRouteDefinition[];
}

export type NavigationMode = 'base' | 'map' | 'travel' | 'encounter';
export type TravelDirection = 'outbound' | 'returning';

export interface PlannedRouteSnapshot {
  readonly destinationNodeId: string;
  readonly direction: TravelDirection;
  readonly distanceUnits: number;
  readonly durationSeconds: number;
  readonly originNodeId: string;
  readonly routeId: string;
}

export interface SystemNavigationSnapshot {
  readonly activeRoute?: PlannedRouteSnapshot;
  readonly currentNodeId: string;
  readonly mode: NavigationMode;
  readonly selectedRoute?: PlannedRouteSnapshot;
}

export type NavigationFailureReason =
  'destination-required' | 'invalid-state' | 'route-unavailable' | 'unknown-destination';

export type NavigationCommandResult =
  | { readonly accepted: true }
  | { readonly accepted: false; readonly reason: NavigationFailureReason };

export interface SystemNavigationSession {
  arrive(): NavigationCommandResult;
  beginOutboundTravel(): NavigationCommandResult;
  beginReturnTravel(): NavigationCommandResult;
  closeMap(): NavigationCommandResult;
  getSnapshot(): SystemNavigationSnapshot;
  openMap(): NavigationCommandResult;
  selectDestination(destinationNodeId: string): NavigationCommandResult;
}

function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function validateStarSystemDefinition(definition: StarSystemDefinition): void {
  if (!isNonEmpty(definition.id) || !isNonEmpty(definition.label)) {
    throw new Error('O sistema estelar requer ID e nome não vazios.');
  }
  if (definition.nodes.length < 4) {
    throw new Error('O sistema estelar requer uma base e ao menos três destinos.');
  }

  const nodeIds = new Set<string>();
  for (const node of definition.nodes) {
    if (
      !isNonEmpty(node.id) ||
      !isNonEmpty(node.label) ||
      !isNonEmpty(node.summary) ||
      nodeIds.has(node.id)
    ) {
      throw new Error(`Nó inválido ou duplicado no sistema: ${node.id || '(sem ID)'}.`);
    }
    nodeIds.add(node.id);
  }

  const base = definition.nodes.find(({ id }) => id === definition.baseNodeId);
  if (base === undefined || base.kind !== 'base') {
    throw new Error(`A base do sistema é inválida: ${definition.baseNodeId}.`);
  }

  const routeIds = new Set<string>();
  for (const route of definition.routes) {
    if (!isNonEmpty(route.id) || routeIds.has(route.id)) {
      throw new Error(`Rota inválida ou duplicada no sistema: ${route.id || '(sem ID)'}.`);
    }
    if (
      !nodeIds.has(route.fromNodeId) ||
      !nodeIds.has(route.toNodeId) ||
      route.fromNodeId === route.toNodeId
    ) {
      throw new Error(`A rota ${route.id} referencia origem ou destino inválido.`);
    }
    if (
      !Number.isFinite(route.distanceUnits) ||
      route.distanceUnits <= 0 ||
      !Number.isFinite(route.durationSeconds) ||
      route.durationSeconds <= 0
    ) {
      throw new Error(`A rota ${route.id} requer distância e duração positivas.`);
    }
    routeIds.add(route.id);
  }
}

function connectedRoute(
  definition: StarSystemDefinition,
  originNodeId: string,
  destinationNodeId: string,
): StarSystemRouteDefinition | undefined {
  return definition.routes.find(
    (route) =>
      (route.fromNodeId === originNodeId && route.toNodeId === destinationNodeId) ||
      (route.toNodeId === originNodeId && route.fromNodeId === destinationNodeId),
  );
}

function routeSnapshot(
  route: StarSystemRouteDefinition,
  originNodeId: string,
  destinationNodeId: string,
  direction: TravelDirection,
): PlannedRouteSnapshot {
  return {
    destinationNodeId,
    direction,
    distanceUnits: route.distanceUnits,
    durationSeconds: route.durationSeconds,
    originNodeId,
    routeId: route.id,
  };
}

export function createSystemNavigation(definition: StarSystemDefinition): SystemNavigationSession {
  validateStarSystemDefinition(definition);
  let activeRoute: PlannedRouteSnapshot | undefined;
  let currentNodeId = definition.baseNodeId;
  let mode: NavigationMode = 'base';
  let selectedRoute: PlannedRouteSnapshot | undefined;

  function snapshot(): SystemNavigationSnapshot {
    return {
      ...(activeRoute === undefined ? {} : { activeRoute: { ...activeRoute } }),
      currentNodeId,
      mode,
      ...(selectedRoute === undefined ? {} : { selectedRoute: { ...selectedRoute } }),
    };
  }

  return {
    arrive() {
      if (mode !== 'travel' || activeRoute === undefined) {
        return { accepted: false, reason: 'invalid-state' };
      }
      currentNodeId = activeRoute.destinationNodeId;
      mode = activeRoute.direction === 'outbound' ? 'encounter' : 'base';
      activeRoute = undefined;
      selectedRoute = undefined;
      return { accepted: true };
    },
    beginOutboundTravel() {
      if (mode !== 'map') return { accepted: false, reason: 'invalid-state' };
      if (selectedRoute === undefined) {
        return { accepted: false, reason: 'destination-required' };
      }
      activeRoute = { ...selectedRoute, direction: 'outbound' };
      mode = 'travel';
      return { accepted: true };
    },
    beginReturnTravel() {
      if (mode !== 'encounter') return { accepted: false, reason: 'invalid-state' };
      const route = connectedRoute(definition, currentNodeId, definition.baseNodeId);
      if (route === undefined) return { accepted: false, reason: 'route-unavailable' };
      activeRoute = routeSnapshot(route, currentNodeId, definition.baseNodeId, 'returning');
      selectedRoute = undefined;
      mode = 'travel';
      return { accepted: true };
    },
    closeMap() {
      if (mode !== 'map') return { accepted: false, reason: 'invalid-state' };
      mode = 'base';
      selectedRoute = undefined;
      return { accepted: true };
    },
    getSnapshot: snapshot,
    openMap() {
      if (mode !== 'base') return { accepted: false, reason: 'invalid-state' };
      mode = 'map';
      selectedRoute = undefined;
      return { accepted: true };
    },
    selectDestination(destinationNodeId) {
      if (mode !== 'map') return { accepted: false, reason: 'invalid-state' };
      if (!definition.nodes.some(({ id }) => id === destinationNodeId)) {
        return { accepted: false, reason: 'unknown-destination' };
      }
      const route = connectedRoute(definition, currentNodeId, destinationNodeId);
      if (route === undefined) return { accepted: false, reason: 'route-unavailable' };
      selectedRoute = routeSnapshot(route, currentNodeId, destinationNodeId, 'outbound');
      return { accepted: true };
    },
  };
}
