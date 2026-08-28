import {
  Application,
  BoundingBox,
  type CameraComponent,
  Color,
  createGraphicsDevice,
  DEVICETYPE_WEBGL2,
  DEVICETYPE_WEBGPU,
  Entity,
  FILLMODE_FILL_WINDOW,
  type GraphicsDevice,
  Mat4,
  Quat,
  RESOLUTION_AUTO,
  type RenderComponent,
  StandardMaterial,
  Vec3,
  VertexBuffer,
  VertexFormat,
} from 'playcanvas';

import type { FlightSessionSnapshot } from '../application/flight-session';
import type { CombatEffectSnapshot } from '../application/encounter-session';
import {
  deriveCombatVisualPresentation,
  deriveRemoteVesselPresentation,
  type ArenaPresentationDto,
  type HullSectionVisualState,
  type HullVisualState,
  type TargetMarkerPresentationDto,
} from '../application/arena-presentation';
import type { GraphicsPreset } from '../content/graphics-presets';
import { TRAINING_ARENA } from '../content/arena-content';
import { ENEMY_DAMAGE_DEFINITION, PLAYER_DAMAGE_DEFINITION } from '../content/combat-content';
import { HULL_SECTIONS, type HullSectionId, type SubsystemId } from '../domain/combat/damage';
import { FpsMeter } from '../platform/fps-meter';
import { FrameTimeProfiler, type FrameTimeProfile } from '../platform/frame-time-profiler';
import { createResourceTransaction } from './resource-transaction';

const COMBAT_VISUAL_CAPACITIES = {
  enemyHullCapacityPerSection: ENEMY_DAMAGE_DEFINITION.hullCapacityPerSection,
  playerHullCapacityPerSection: PLAYER_DAMAGE_DEFINITION.hullCapacityPerSection,
} as const;

export interface EngineTelemetry {
  readonly activeVfxCount: number;
  readonly drawCalls: number;
  readonly frameTimeMs: number;
  readonly instancedObjects: number;
  readonly lodLabel: string;
}

export interface ArenaSceneHandlers {
  readonly onBenchmarkTelemetry?: (telemetry: BenchmarkTelemetry) => void;
  readonly onFpsSample: (fps: number) => void;
  readonly onPresentationFrame: (presentation: ArenaPresentationDto) => void;
  readonly onUpdate: (
    deltaSeconds: number,
    getTelemetry: () => EngineTelemetry,
  ) => ArenaRenderSnapshot;
}

export interface ArenaSceneOptions {
  readonly benchmark?: {
    readonly durationSeconds: number;
    readonly warmupSeconds: number;
  };
  readonly preferredBackend?: 'webgpu';
}

export interface BenchmarkTelemetry {
  readonly asteroidCount: number;
  readonly elapsedSeconds: number;
  readonly fleetShipCount: number;
  readonly frameTimeProfile?: FrameTimeProfile;
  readonly presetId: GraphicsPreset['id'];
  readonly starCount: number;
  readonly state: 'complete' | 'sampling' | 'warmup';
  readonly targetDurationSeconds: number;
}

export interface ArenaRenderSnapshot extends FlightSessionSnapshot {
  readonly presentationEffects?: readonly CombatEffectSnapshot[];
}

export interface ArenaScene {
  readonly backendLabel: 'WebGL 2' | 'WebGPU';
  dispose(): void;
}

interface SceneMaterials {
  readonly asteroid: StandardMaterial;
  readonly combatBeam: StandardMaterial;
  readonly combatBeamCore: StandardMaterial;
  readonly combatEnemyBeam: StandardMaterial;
  readonly combatEnemyBeamCore: StandardMaterial;
  readonly combatImpact: StandardMaterial;
  readonly combatTorpedo: StandardMaterial;
  readonly combatTractor: StandardMaterial;
  readonly damageCritical: StandardMaterial;
  readonly damageScorched: StandardMaterial;
  readonly darkHull: StandardMaterial;
  readonly engine: StandardMaterial;
  readonly engineCritical: StandardMaterial;
  readonly hostileHull: StandardMaterial;
  readonly hull: StandardMaterial;
  readonly moon: StandardMaterial;
  readonly planet: StandardMaterial;
  readonly station: StandardMaterial;
  readonly star: StandardMaterial;
  readonly starfield: StandardMaterial;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function createMaterial(
  diffuse: Color,
  options: { readonly emissive?: Color; readonly metalness?: number; readonly gloss?: number } = {},
): StandardMaterial {
  const material = new StandardMaterial();
  material.diffuse = diffuse;
  material.emissive = options.emissive ?? Color.BLACK;
  material.emissiveIntensity = options.emissive === undefined ? 0 : 2;
  material.metalness = options.metalness ?? 0.2;
  material.gloss = options.gloss ?? 0.45;
  material.update();
  return material;
}

function createMaterials(): SceneMaterials {
  return {
    asteroid: createMaterial(new Color(0.14, 0.17, 0.22), { gloss: 0.16, metalness: 0.28 }),
    combatBeam: createMaterial(new Color(0.02, 0.32, 0.58), {
      emissive: new Color(0.02, 0.55, 1),
      gloss: 0.9,
    }),
    combatBeamCore: createMaterial(new Color(0.65, 0.93, 1), {
      emissive: new Color(0.4, 0.9, 1),
      gloss: 0.96,
    }),
    combatEnemyBeam: createMaterial(new Color(0.7, 0.08, 0.12), {
      emissive: new Color(1, 0.08, 0.24),
      gloss: 0.9,
    }),
    combatEnemyBeamCore: createMaterial(new Color(1, 0.72, 0.62), {
      emissive: new Color(1, 0.32, 0.22),
      gloss: 0.96,
    }),
    combatImpact: createMaterial(new Color(0.12, 0.72, 0.92), {
      emissive: new Color(0.05, 0.86, 1),
      gloss: 0.86,
    }),
    combatTorpedo: createMaterial(new Color(0.92, 0.29, 0.025), {
      emissive: new Color(1, 0.2, 0.015),
      gloss: 0.8,
    }),
    combatTractor: createMaterial(new Color(0.32, 0.08, 0.66), {
      emissive: new Color(0.54, 0.11, 1),
      gloss: 0.75,
    }),
    damageCritical: createMaterial(new Color(0.09, 0.055, 0.04), {
      emissive: new Color(0.9, 0.11, 0.018),
      gloss: 0.18,
      metalness: 0.72,
    }),
    damageScorched: createMaterial(new Color(0.1, 0.14, 0.17), {
      emissive: new Color(0.15, 0.025, 0.006),
      gloss: 0.24,
      metalness: 0.7,
    }),
    darkHull: createMaterial(new Color(0.018, 0.045, 0.075), {
      gloss: 0.7,
      metalness: 0.86,
    }),
    engine: createMaterial(new Color(0.025, 0.18, 0.3), {
      emissive: new Color(0.015, 0.68, 1),
      gloss: 0.8,
      metalness: 0.45,
    }),
    engineCritical: createMaterial(new Color(0.2, 0.04, 0.015), {
      emissive: new Color(1, 0.12, 0.015),
      gloss: 0.6,
      metalness: 0.35,
    }),
    hostileHull: createMaterial(new Color(0.46, 0.09, 0.15), {
      emissive: new Color(0.18, 0.018, 0.045),
      gloss: 0.67,
      metalness: 0.78,
    }),
    hull: createMaterial(new Color(0.18, 0.34, 0.5), { gloss: 0.76, metalness: 0.82 }),
    moon: createMaterial(new Color(0.27, 0.3, 0.36), { gloss: 0.12, metalness: 0.18 }),
    planet: createMaterial(new Color(0.025, 0.16, 0.29), { gloss: 0.5, metalness: 0.12 }),
    station: createMaterial(new Color(0.25, 0.3, 0.39), { gloss: 0.62, metalness: 0.84 }),
    star: createMaterial(new Color(1, 0.55, 0.12), {
      emissive: new Color(1, 0.26, 0.025),
      gloss: 0.15,
    }),
    starfield: createMaterial(new Color(0.66, 0.81, 0.96), {
      emissive: new Color(0.48, 0.74, 1),
      gloss: 0,
    }),
  };
}

function addPrimitive(
  parent: Entity,
  name: string,
  type: 'box' | 'capsule' | 'cone' | 'cylinder' | 'sphere' | 'torus',
  material: StandardMaterial,
  scale: readonly [number, number, number],
  position: readonly [number, number, number] = [0, 0, 0],
  rotation: readonly [number, number, number] = [0, 0, 0],
): Entity {
  const entity = new Entity(name);
  const render = entity.addComponent('render', {
    castShadows: false,
    receiveShadows: false,
    type,
  }) as RenderComponent;
  render.material = material;
  entity.setLocalScale(...scale);
  entity.setLocalPosition(...position);
  entity.setLocalEulerAngles(...rotation);
  parent.addChild(entity);
  return entity;
}

interface ShipVisual {
  readonly damageAccents: Readonly<Record<HullSectionId, Entity>>;
  readonly damageSparks: readonly Entity[];
  readonly engineRenders: readonly RenderComponent[];
  readonly intactHullMaterial: StandardMaterial;
  readonly root: Entity;
  readonly sectionRenders: Readonly<Record<HullSectionId, readonly RenderComponent[]>>;
  readonly subsystemRenders: Readonly<Record<SubsystemId, readonly RenderComponent[]>>;
}

interface RemoteShipVisual {
  readonly detailed: ShipVisual;
  readonly low: Entity;
  readonly lowRender: RenderComponent;
  readonly root: Entity;
}

function requireRender(entity: Entity): RenderComponent {
  const render = entity.findComponent('render') as RenderComponent | null;
  if (render === null) throw new Error(`A entidade visual ${entity.name} não possui render.`);
  return render;
}

function createDetailedShip(
  name: string,
  materials: SceneMaterials,
  intactHullMaterial: StandardMaterial,
): ShipVisual {
  const root = new Entity(name);
  const hull = addPrimitive(
    root,
    `${name} fuselage`,
    'capsule',
    intactHullMaterial,
    [1.7, 2.8, 1.7],
    [0, 0, 0.35],
    [90, 0, 0],
  );
  const prow = addPrimitive(
    root,
    `${name} prow`,
    'cone',
    intactHullMaterial,
    [1.28, 2.15, 1.28],
    [0, 0, -3.25],
    [90, 0, 0],
  );
  const bridge = addPrimitive(
    root,
    `${name} bridge`,
    'sphere',
    intactHullMaterial,
    [0.72, 0.38, 1.18],
    [0, 0.82, -1.2],
  );
  const portPylon = addPrimitive(
    root,
    `${name} pylon port`,
    'box',
    materials.darkHull,
    [2.55, 0.15, 0.72],
    [-1.8, -0.08, 1.15],
    [0, -8, -8],
  );
  const starboardPylon = addPrimitive(
    root,
    `${name} pylon starboard`,
    'box',
    materials.darkHull,
    [2.55, 0.15, 0.72],
    [1.8, -0.08, 1.15],
    [0, 8, 8],
  );
  const leftEngine = addPrimitive(
    root,
    `${name} engine left`,
    'capsule',
    intactHullMaterial,
    [0.48, 2.15, 0.48],
    [-3.1, 0.03, 1.5],
    [90, 0, 0],
  );
  const rightEngine = addPrimitive(
    root,
    `${name} engine right`,
    'capsule',
    intactHullMaterial,
    [0.48, 2.15, 0.48],
    [3.1, 0.03, 1.5],
    [90, 0, 0],
  );
  const leftExhaust = addPrimitive(
    root,
    `${name} exhaust left`,
    'sphere',
    materials.engine,
    [0.42, 0.42, 0.2],
    [-3.1, 0.03, 3.6],
  );
  const rightExhaust = addPrimitive(
    root,
    `${name} exhaust right`,
    'sphere',
    materials.engine,
    [0.42, 0.42, 0.2],
    [3.1, 0.03, 3.6],
  );
  const damageAccents: Record<HullSectionId, Entity> = {
    bow: addPrimitive(
      root,
      `${name} bow damage decal`,
      'box',
      materials.damageCritical,
      [0.62, 0.08, 0.92],
      [0.58, 0.66, -2.2],
      [0, -12, 0],
    ),
    port: addPrimitive(
      root,
      `${name} port damage decal`,
      'box',
      materials.damageCritical,
      [0.7, 0.08, 0.76],
      [-2.15, 0.3, 0.92],
      [0, 8, -6],
    ),
    starboard: addPrimitive(
      root,
      `${name} starboard damage decal`,
      'box',
      materials.damageCritical,
      [0.7, 0.08, 0.76],
      [2.15, 0.3, 0.92],
      [0, -8, 6],
    ),
    stern: addPrimitive(
      root,
      `${name} stern damage decal`,
      'box',
      materials.damageCritical,
      [0.72, 0.08, 0.88],
      [-0.58, 0.66, 1.85],
      [0, 14, 0],
    ),
  };
  Object.values(damageAccents).forEach((accent) => (accent.enabled = false));
  const damageSparks = Array.from({ length: 3 }, (_, index) => {
    const spark = addPrimitive(
      root,
      `${name} pooled damage spark ${index + 1}`,
      'sphere',
      materials.damageCritical,
      [0.1, 0.1, 0.1],
    );
    spark.enabled = false;
    return spark;
  });
  return {
    damageAccents,
    damageSparks,
    engineRenders: [requireRender(leftExhaust), requireRender(rightExhaust)],
    intactHullMaterial,
    root,
    sectionRenders: {
      bow: [requireRender(prow), requireRender(bridge)],
      port: [requireRender(leftEngine), requireRender(portPylon)],
      starboard: [requireRender(rightEngine), requireRender(starboardPylon)],
      stern: [requireRender(hull)],
    },
    subsystemRenders: {
      engines: [requireRender(leftExhaust), requireRender(rightExhaust)],
      sensors: [requireRender(bridge)],
      shields: [requireRender(portPylon), requireRender(starboardPylon)],
      weapons: [requireRender(prow)],
    },
  };
}

const DAMAGE_ACCENT_POSITIONS: Readonly<Record<HullSectionId, readonly [number, number, number]>> =
  {
    bow: [0.58, 0.78, -2.2],
    port: [-2.15, 0.42, 0.92],
    starboard: [2.15, 0.42, 0.92],
    stern: [-0.58, 0.78, 1.85],
  };

function applyHullSectionVisualStates(
  ship: ShipVisual,
  sectionStates: HullSectionVisualState,
  disabledSubsystems: readonly SubsystemId[],
  materials: SceneMaterials,
  maximumDamageBursts: number,
  elapsedSeconds: number,
): void {
  const damagedSections: HullSectionId[] = [];
  for (const section of HULL_SECTIONS) {
    const state = sectionStates[section];
    const hullMaterial =
      state === 'intact'
        ? ship.intactHullMaterial
        : state === 'damaged'
          ? materials.damageScorched
          : materials.damageCritical;
    ship.sectionRenders[section].forEach((render) => {
      if (render.material !== hullMaterial) render.material = hullMaterial;
    });
    const accent = ship.damageAccents[section];
    const accentRender = requireRender(accent);
    accentRender.material =
      state === 'damaged' ? materials.damageScorched : materials.damageCritical;
    accent.enabled = state !== 'intact';
    if (state !== 'intact') damagedSections.push(section);
  }

  ship.damageSparks.forEach((spark, index) => {
    const section = damagedSections[index % Math.max(1, damagedSections.length)];
    const enabled = section !== undefined && index < maximumDamageBursts;
    spark.enabled = enabled;
    if (!enabled || section === undefined) return;
    const [x, y, z] = DAMAGE_ACCENT_POSITIONS[section];
    const phase = elapsedSeconds * (4.2 + index * 0.7) + index * 1.9;
    const pulse = 0.08 + (Math.sin(phase) * 0.5 + 0.5) * 0.16;
    spark.setLocalPosition(x + Math.sin(phase) * 0.16, y + Math.cos(phase * 1.3) * 0.18, z);
    spark.setLocalScale(pulse, pulse, pulse);
  });

  const disabled = new Set(disabledSubsystems);
  const engineMaterial = disabled.has('engines')
    ? materials.darkHull
    : sectionStates.stern === 'critical'
      ? materials.engineCritical
      : materials.engine;
  ship.subsystemRenders.engines.forEach((render) => {
    if (render.material !== engineMaterial) render.material = engineMaterial;
  });
  for (const subsystem of ['shields', 'weapons'] as const) {
    if (!disabled.has(subsystem)) continue;
    ship.subsystemRenders[subsystem].forEach((render) => (render.material = materials.darkHull));
  }
  if (disabled.has('sensors')) {
    ship.subsystemRenders.sensors.forEach((render) => (render.material = materials.darkHull));
  }
}

function countActiveDamageVfx(ship: ShipVisual): number {
  return [...Object.values(ship.damageAccents), ...ship.damageSparks].filter(
    (entity) => entity.enabled,
  ).length;
}

function applyHullVisualState(
  ship: ShipVisual,
  state: HullVisualState,
  materials: SceneMaterials,
): void {
  const sectionStates: HullSectionVisualState = {
    bow: state,
    port: state,
    starboard: state,
    stern: state,
  };
  applyHullSectionVisualStates(ship, sectionStates, [], materials, 0, 0);
  if (state === 'critical') {
    ship.engineRenders.forEach((render) => (render.material = materials.engineCritical));
  }
}

function createRemoteShip(materials: SceneMaterials): RemoteShipVisual {
  const root = new Entity('Remote vessel');
  root.setPosition(
    TRAINING_ARENA.enemyPosition.x,
    TRAINING_ARENA.enemyPosition.y,
    TRAINING_ARENA.enemyPosition.z,
  );
  root.setEulerAngles(8, 145, -4);
  const detailed = createDetailedShip('Remote vessel detail', materials, materials.hostileHull);
  detailed.root.setLocalScale(0.92, 0.92, 1);
  root.addChild(detailed.root);
  const low = addPrimitive(
    root,
    'Remote vessel low LOD',
    'cone',
    materials.hostileHull,
    [2.25, 4.2, 2.25],
    [0, 0, 0],
    [90, 0, 0],
  );
  return { detailed, low, lowRender: requireRender(low), root };
}

function createBenchmarkFleet(
  root: Entity,
  materials: SceneMaterials,
  shipCount: number,
  maximumDamagedShips: number,
): readonly ShipVisual[] {
  const fleet = Array.from({ length: shipCount }, (_, index) => {
    const ship = createDetailedShip(
      `Benchmark vessel ${index + 1}`,
      materials,
      index % 2 === 0 ? materials.hostileHull : materials.hull,
    );
    ship.root.setLocalScale(0.48, 0.48, 0.48);
    applyHullVisualState(
      ship,
      index < maximumDamagedShips ? (index === 0 ? 'critical' : 'damaged') : 'intact',
      materials,
    );
    if (index < maximumDamagedShips) {
      const state: HullVisualState = index === 0 ? 'critical' : 'damaged';
      applyHullSectionVisualStates(
        ship,
        { bow: state, port: state, starboard: state, stern: state },
        index === 0 ? ['engines'] : [],
        materials,
        maximumDamagedShips,
        index,
      );
    }
    root.addChild(ship.root);
    return ship;
  });
  return fleet;
}

function updateBenchmarkFleet(fleet: readonly ShipVisual[], elapsedSeconds: number): void {
  fleet.forEach((ship, index) => {
    const lane = index % 2 === 0 ? -1 : 1;
    const row = Math.floor(index / 2);
    const phase = elapsedSeconds * (0.16 + index * 0.006) + index * 0.73;
    ship.root.setPosition(
      lane * (9 + row * 6) + Math.sin(phase) * 2.5,
      -1 + ((index * 7) % 5) + Math.cos(phase * 0.7) * 1.6,
      -32 - row * 18 + Math.sin(phase * 0.5) * 4,
    );
    ship.root.setEulerAngles(
      4 + Math.sin(phase) * 5,
      lane < 0 ? 165 + Math.cos(phase) * 12 : 195 + Math.cos(phase) * 12,
      lane * 5,
    );
  });
}

function createCelestialBodies(root: Entity, materials: SceneMaterials): void {
  const planet = addPrimitive(root, 'Planet', 'sphere', materials.planet, [18, 18, 18]);
  planet.setPosition(
    TRAINING_ARENA.planetPosition.x,
    TRAINING_ARENA.planetPosition.y,
    TRAINING_ARENA.planetPosition.z,
  );
  const moon = addPrimitive(root, 'Moon', 'sphere', materials.moon, [5, 5, 5]);
  moon.setPosition(
    TRAINING_ARENA.moonPosition.x,
    TRAINING_ARENA.moonPosition.y,
    TRAINING_ARENA.moonPosition.z,
  );
  const star = addPrimitive(root, 'Star', 'sphere', materials.star, [10, 10, 10]);
  star.setPosition(
    TRAINING_ARENA.starPosition.x,
    TRAINING_ARENA.starPosition.y,
    TRAINING_ARENA.starPosition.z,
  );
}

function createStarbase(root: Entity, materials: SceneMaterials): void {
  const station = new Entity('Orbital starbase');
  station.setPosition(
    TRAINING_ARENA.starbasePosition.x,
    TRAINING_ARENA.starbasePosition.y,
    TRAINING_ARENA.starbasePosition.z,
  );
  addPrimitive(station, 'Starbase ring', 'torus', materials.station, [10, 2.5, 10]);
  addPrimitive(station, 'Starbase core', 'cylinder', materials.darkHull, [1.4, 7, 1.4]);
  addPrimitive(
    station,
    'Starbase beacon',
    'sphere',
    materials.engine,
    [1.1, 1.1, 1.1],
    [0, 4.2, 0],
  );
  root.addChild(station);
}

function createInstancedAsteroids(
  root: Entity,
  graphicsDevice: GraphicsDevice,
  material: StandardMaterial,
  asteroidCount: number,
): VertexBuffer {
  const asteroid = new Entity('Instanced asteroid field');
  const render = asteroid.addComponent('render', {
    castShadows: false,
    receiveShadows: false,
    type: 'sphere',
  }) as RenderComponent;
  render.material = material;
  render.customAabb = new BoundingBox(
    Vec3.ZERO,
    new Vec3(TRAINING_ARENA.radiusUnits, TRAINING_ARENA.radiusUnits, TRAINING_ARENA.radiusUnits),
  );
  root.addChild(asteroid);

  const matrices = new Float32Array(asteroidCount * 16);
  const matrix = new Mat4();
  const rotation = new Quat();
  for (let index = 0; index < asteroidCount; index += 1) {
    const angle = index * 2.399963;
    const radius = 48 + ((index * 29) % 102);
    const height = ((index * 17) % 35) - 17;
    const scale = 0.65 + ((index * 11) % 18) / 10;
    matrix.setTRS(
      new Vec3(Math.cos(angle) * radius, height, Math.sin(angle) * radius),
      rotation.setFromEulerAngles(index * 13, index * 29, index * 7),
      new Vec3(scale * 1.35, scale, scale * 0.82),
    );
    matrices.set(matrix.data, index * 16);
  }

  const buffer = new VertexBuffer(
    graphicsDevice,
    VertexFormat.getDefaultInstancingFormat(graphicsDevice),
    asteroidCount,
    { data: matrices.buffer },
  );
  const meshInstance = render.meshInstances[0];
  if (meshInstance === undefined) {
    buffer.destroy();
    throw new Error('Não foi possível criar a malha instanciada de asteroides.');
  }
  meshInstance.setInstancing(buffer, true);
  return buffer;
}

function createInstancedStarfield(
  root: Entity,
  graphicsDevice: GraphicsDevice,
  material: StandardMaterial,
  starCount: number,
): VertexBuffer {
  const starfield = new Entity('Deterministic instanced starfield');
  const render = starfield.addComponent('render', {
    castShadows: false,
    receiveShadows: false,
    type: 'box',
  }) as RenderComponent;
  render.material = material;
  render.customAabb = new BoundingBox(Vec3.ZERO, new Vec3(490, 490, 490));
  root.addChild(starfield);

  const matrices = new Float32Array(starCount * 16);
  const matrix = new Mat4();
  const rotation = new Quat();
  for (let index = 0; index < starCount; index += 1) {
    const longitude = index * 2.399963;
    const latitudeSample = (((index * 73) % starCount) + 0.5) / starCount;
    const y = 1 - latitudeSample * 2;
    const horizontal = Math.sqrt(Math.max(0, 1 - y * y));
    const radius = 285 + ((index * 47) % 170);
    const size = 0.42 + ((index * 19) % 13) * 0.072;
    matrix.setTRS(
      new Vec3(
        Math.cos(longitude) * horizontal * radius,
        y * radius,
        Math.sin(longitude) * horizontal * radius,
      ),
      rotation.setFromEulerAngles(index * 17, index * 31, index * 7),
      new Vec3(size, size, size),
    );
    matrices.set(matrix.data, index * 16);
  }

  const buffer = new VertexBuffer(
    graphicsDevice,
    VertexFormat.getDefaultInstancingFormat(graphicsDevice),
    starCount,
    { data: matrices.buffer },
  );
  const meshInstance = render.meshInstances[0];
  if (meshInstance === undefined) {
    buffer.destroy();
    throw new Error('Não foi possível criar o starfield instanciado.');
  }
  meshInstance.setInstancing(buffer, true);
  return buffer;
}

interface CombatEffectVfxSlot {
  readonly beamCore: Entity;
  readonly beamCoreRender: RenderComponent;
  readonly beamOuter: Entity;
  readonly beamOuterRender: RenderComponent;
  readonly impactCore: Entity;
  readonly impactCoreRender: RenderComponent;
  readonly impactPrimary: Entity;
  readonly impactPrimaryRender: RenderComponent;
  readonly impactSecondary: Entity;
  readonly impactSecondaryRender: RenderComponent;
}

interface CombatVfxVisual {
  readonly effectSlots: readonly CombatEffectVfxSlot[];
  readonly pooledEntities: readonly Entity[];
  readonly projectileCore: Entity;
  readonly projectileHalo: Entity;
  readonly scratchDirection: Vec3;
  readonly scratchMidpoint: Vec3;
  readonly scratchSource: Vec3;
  readonly scratchTarget: Vec3;
}

function createCombatEffectVfxSlot(
  root: Entity,
  materials: SceneMaterials,
  slotNumber: number,
): CombatEffectVfxSlot {
  const label = `Pooled effect ${slotNumber}`;
  const beamOuter = addPrimitive(
    root,
    `${label} beam outer`,
    'box',
    materials.combatBeam,
    [0.1, 0.1, 1],
  );
  const beamCore = addPrimitive(
    root,
    `${label} beam core`,
    'box',
    materials.combatBeamCore,
    [0.035, 0.035, 1],
  );
  const impactPrimary = addPrimitive(
    root,
    `${label} shield impact primary`,
    'torus',
    materials.combatImpact,
    [1, 0.12, 1],
    [0, 0, 0],
    [90, 0, 0],
  );
  const impactSecondary = addPrimitive(
    root,
    `${label} shield impact cross`,
    'torus',
    materials.combatImpact,
    [1, 0.1, 1],
    [0, 0, 0],
    [0, 0, 90],
  );
  const impactCore = addPrimitive(
    root,
    `${label} impact core`,
    'sphere',
    materials.combatImpact,
    [0.36, 0.36, 0.36],
  );
  return {
    beamCore,
    beamCoreRender: requireRender(beamCore),
    beamOuter,
    beamOuterRender: requireRender(beamOuter),
    impactCore,
    impactCoreRender: requireRender(impactCore),
    impactPrimary,
    impactPrimaryRender: requireRender(impactPrimary),
    impactSecondary,
    impactSecondaryRender: requireRender(impactSecondary),
  };
}

function createCombatVfx(root: Entity, materials: SceneMaterials): CombatVfxVisual {
  const effectSlots = [
    createCombatEffectVfxSlot(root, materials, 1),
    createCombatEffectVfxSlot(root, materials, 2),
  ];
  const projectileCore = addPrimitive(
    root,
    'Pooled torpedo core',
    'sphere',
    materials.combatTorpedo,
    [0.44, 0.44, 0.72],
  );
  const projectileHalo = addPrimitive(
    root,
    'Pooled torpedo halo',
    'torus',
    materials.combatTorpedo,
    [0.78, 0.16, 0.78],
    [0, 0, 0],
    [90, 0, 0],
  );
  const pooledEntities = [
    ...effectSlots.flatMap((slot) => [
      slot.beamOuter,
      slot.beamCore,
      slot.impactPrimary,
      slot.impactSecondary,
      slot.impactCore,
    ]),
    projectileCore,
    projectileHalo,
  ];
  pooledEntities.forEach((entity) => (entity.enabled = false));
  return {
    effectSlots,
    pooledEntities,
    projectileCore,
    projectileHalo,
    scratchDirection: new Vec3(),
    scratchMidpoint: new Vec3(),
    scratchSource: new Vec3(),
    scratchTarget: new Vec3(),
  };
}

function setLineBetween(
  entity: Entity,
  source: Vec3,
  target: Vec3,
  width: number,
  scratchDirection: Vec3,
  scratchMidpoint: Vec3,
): boolean {
  scratchDirection.copy(target).sub(source);
  const length = scratchDirection.length();
  if (length <= 0.01) return false;
  scratchMidpoint.copy(source).add(target).mulScalar(0.5);
  entity.setPosition(scratchMidpoint);
  entity.lookAt(target);
  entity.setLocalScale(width, width, length);
  entity.enabled = true;
  return true;
}

function updateCombatVfx(
  vfx: CombatVfxVisual,
  snapshot: ArenaRenderSnapshot,
  player: ShipVisual,
  remote: RemoteShipVisual,
  remoteObserved: boolean,
  materials: SceneMaterials,
): number {
  vfx.pooledEntities.forEach((entity) => (entity.enabled = false));
  const encounter = snapshot.encounter;
  if (encounter.projectilePosition !== undefined) {
    const projectile = encounter.projectilePosition;
    vfx.projectileCore.setPosition(projectile.x, projectile.y, projectile.z);
    vfx.projectileHalo.setPosition(projectile.x, projectile.y, projectile.z);
    vfx.projectileCore.enabled = true;
    vfx.projectileHalo.enabled = true;
  }

  const effects =
    snapshot.presentationEffects ?? (encounter.effect === undefined ? [] : [encounter.effect]);
  effects.slice(0, vfx.effectSlots.length).forEach((effect, index) => {
    const slot = vfx.effectSlots[index]!;
    if (effect.remainingSeconds <= 0) return;

    vfx.scratchTarget.set(
      effect.targetPosition.x,
      effect.targetPosition.y,
      effect.targetPosition.z,
    );
    const visuals = deriveCombatVisualPresentation(
      { ...encounter, effect },
      remoteObserved,
      COMBAT_VISUAL_CAPACITIES,
    );
    if (effect.impactSector !== undefined) {
      const targetRoot = effect.kind === 'enemy-beam' ? player.root : remote.root;
      const impactRadius = effect.kind === 'enemy-beam' ? 3.2 : 2.5;
      const localImpactOffset =
        effect.impactSector === 'front'
          ? vfx.scratchDirection.set(0, 0, -impactRadius)
          : effect.impactSector === 'rear'
            ? vfx.scratchDirection.set(0, 0, impactRadius)
            : effect.impactSector === 'port'
              ? vfx.scratchDirection.set(-impactRadius, 0, 0)
              : vfx.scratchDirection.set(impactRadius, 0, 0);
      targetRoot.getRotation().transformVector(localImpactOffset, vfx.scratchMidpoint);
      vfx.scratchTarget.add(vfx.scratchMidpoint);
    }
    const isPlayerBeam = effect.kind === 'beam' || effect.kind === 'tractor';
    const canShowEnemyBeam = effect.kind === 'enemy-beam' && remoteObserved;
    if (isPlayerBeam) {
      player.root
        .getRotation()
        .transformVector(vfx.scratchSource.set(0, 0.05, -3.5), vfx.scratchDirection);
      vfx.scratchSource.copy(player.root.getPosition()).add(vfx.scratchDirection);
    } else if (canShowEnemyBeam) {
      vfx.scratchSource.copy(remote.root.getPosition());
    }

    if (isPlayerBeam || canShowEnemyBeam) {
      const outerMaterial =
        effect.kind === 'tractor'
          ? materials.combatTractor
          : effect.kind === 'enemy-beam'
            ? materials.combatEnemyBeam
            : materials.combatBeam;
      const coreMaterial =
        effect.kind === 'enemy-beam' ? materials.combatEnemyBeamCore : materials.combatBeamCore;
      slot.beamOuterRender.material = outerMaterial;
      slot.beamCoreRender.material = coreMaterial;
      const outerWidth = effect.kind === 'tractor' ? 0.13 : 0.07;
      const coreWidth = effect.kind === 'tractor' ? 0.042 : 0.024;
      setLineBetween(
        slot.beamOuter,
        vfx.scratchSource,
        vfx.scratchTarget,
        outerWidth,
        vfx.scratchDirection,
        vfx.scratchMidpoint,
      );
      setLineBetween(
        slot.beamCore,
        vfx.scratchSource,
        vfx.scratchTarget,
        coreWidth,
        vfx.scratchDirection,
        vfx.scratchMidpoint,
      );
    }

    const shieldImpact = visuals.shieldImpactTarget !== 'none';
    const showImpact = shieldImpact || effect.kind === 'torpedo' || effect.kind === 'tractor';
    if (showImpact) {
      const impactMaterial =
        effect.kind === 'torpedo'
          ? materials.combatTorpedo
          : effect.kind === 'tractor'
            ? materials.combatTractor
            : effect.kind === 'enemy-beam'
              ? materials.combatEnemyBeam
              : materials.combatImpact;
      slot.impactPrimaryRender.material = impactMaterial;
      slot.impactSecondaryRender.material = impactMaterial;
      slot.impactCoreRender.material = impactMaterial;
      const elapsedFraction = clamp(1 - effect.remainingSeconds / 0.22, 0, 1);
      const baseScale =
        visuals.shieldImpactTarget === 'player'
          ? 3.15
          : visuals.shieldImpactTarget === 'remote'
            ? 2.35
            : effect.kind === 'torpedo'
              ? 1.9
              : 1.35;
      const scale = baseScale + elapsedFraction * (effect.kind === 'torpedo' ? 1.8 : 0.9);
      for (const entity of [slot.impactPrimary, slot.impactCore]) {
        entity.setPosition(vfx.scratchTarget);
        entity.enabled = true;
      }
      slot.impactPrimary.setEulerAngles(90, effect.serial * 31, 0);
      slot.impactPrimary.setLocalScale(scale, 0.12, scale);
      slot.impactCore.setLocalScale(scale * 0.32, scale * 0.32, scale * 0.32);
    } else if (effect.kind === 'beam' || effect.kind === 'enemy-beam') {
      const impactMaterial =
        effect.kind === 'enemy-beam' ? materials.combatEnemyBeam : materials.combatBeamCore;
      slot.impactCoreRender.material = impactMaterial;
      slot.impactCore.setPosition(vfx.scratchTarget);
      slot.impactCore.setLocalScale(0.4, 0.4, 0.4);
      slot.impactCore.enabled = true;
    }
  });

  return vfx.pooledEntities.filter((entity) => entity.enabled).length;
}

export async function createArenaScene(
  canvas: HTMLCanvasElement,
  preset: GraphicsPreset,
  handlers: ArenaSceneHandlers,
  options: ArenaSceneOptions = {},
): Promise<ArenaScene> {
  const resources = createResourceTransaction();
  try {
    const graphicsDevice: GraphicsDevice = await createGraphicsDevice(canvas, {
      antialias: preset.antialias,
      depth: true,
      deviceTypes:
        options.preferredBackend === 'webgpu'
          ? [DEVICETYPE_WEBGPU, DEVICETYPE_WEBGL2]
          : [DEVICETYPE_WEBGL2],
      powerPreference: 'high-performance',
      stencil: false,
    });
    const cancelDeviceCleanup = resources.defer(() => graphicsDevice.destroy());
    const app = new Application(canvas, { graphicsDevice });
    cancelDeviceCleanup();
    resources.defer(() => app.destroy());
    if (
      app.graphicsDevice.deviceType !== DEVICETYPE_WEBGL2 &&
      app.graphicsDevice.deviceType !== DEVICETYPE_WEBGPU
    ) {
      throw new Error(`Backend inesperado: ${app.graphicsDevice.deviceType}`);
    }

    app.graphicsDevice.maxPixelRatio = Math.min(
      window.devicePixelRatio * preset.resolutionScale,
      preset.maxPixelRatio,
    );
    app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(RESOLUTION_AUTO);
    app.scene.ambientLight = new Color(0.035, 0.055, 0.105);

    const materials = createMaterials();
    resources.defer(() => Object.values(materials).forEach((material) => material.destroy()));
    const camera = new Entity('External chase camera');
    const cameraComponent = camera.addComponent('camera', {
      clearColor: new Color(0.003, 0.007, 0.018),
      farClip: 520,
      fov: 57,
      nearClip: 0.15,
    }) as CameraComponent;
    app.root.addChild(camera);

    const keyLight = new Entity('Starlight');
    keyLight.addComponent('light', {
      castShadows: false,
      color: new Color(0.78, 0.87, 1),
      intensity: 1.25,
      type: 'directional',
    });
    keyLight.setEulerAngles(28, 132, 8);
    app.root.addChild(keyLight);

    const rimLight = new Entity('Cold rim light');
    rimLight.addComponent('light', {
      castShadows: false,
      color: new Color(0.12, 0.42, 0.78),
      intensity: 0.52,
      type: 'directional',
    });
    rimLight.setEulerAngles(-32, -42, -10);
    app.root.addChild(rimLight);

    const player = createDetailedShip('Player Aurora', materials, materials.hull);
    app.root.addChild(player.root);
    const remote = createRemoteShip(materials);
    app.root.addChild(remote.root);
    remote.root.enabled = false;
    const benchmarkFleet =
      options.benchmark === undefined
        ? []
        : createBenchmarkFleet(
            app.root,
            materials,
            preset.benchmarkShipCount,
            preset.maxVisualDamageBursts,
          );
    const combatVfx = createCombatVfx(app.root, materials);
    createStarbase(app.root, materials);
    createCelestialBodies(app.root, materials);
    const instanceBuffer = createInstancedAsteroids(
      app.root,
      graphicsDevice,
      materials.asteroid,
      preset.asteroidCount,
    );
    resources.defer(() => instanceBuffer.destroy());
    const starfieldBuffer = createInstancedStarfield(
      app.root,
      graphicsDevice,
      materials.starfield,
      preset.starCount,
    );
    resources.defer(() => starfieldBuffer.destroy());

    const fpsMeter = new FpsMeter();
    const cameraOffset = new Vec3();
    const cameraPosition = new Vec3();
    const cameraTarget = new Vec3();
    const projectedTarget = new Vec3();
    const targetWorldPosition = new Vec3();
    const targetFromCamera = new Vec3();
    let targetMarkerPresentation: TargetMarkerPresentationDto = {
      mode: 'observed',
      screenX: 0,
      screenY: 0,
      visible: false,
    };
    let lodLabel = 'Nave remota · silhueta';
    let benchmarkElapsedSeconds = 0;
    let benchmarkFrameStartedAtMs: number | undefined;
    let lastBenchmarkPublishAtMs = Number.NEGATIVE_INFINITY;
    let benchmarkCompleted = false;
    const benchmarkProfiler = new FrameTimeProfiler();
    const renderedTelemetry = {
      activeVfxCount: 0,
      drawCalls: 0,
      frameTimeMs: 0,
      instancedObjects: preset.asteroidCount,
      lodLabel,
    };
    const getTelemetry = (): EngineTelemetry => renderedTelemetry;

    const createBenchmarkTelemetry = (
      state: BenchmarkTelemetry['state'],
    ): BenchmarkTelemetry | undefined => {
      if (options.benchmark === undefined) return undefined;
      const elapsedSeconds = Math.max(0, benchmarkElapsedSeconds - options.benchmark.warmupSeconds);
      const frameTimeProfile = state === 'warmup' ? undefined : benchmarkProfiler.snapshot();
      return {
        asteroidCount: preset.asteroidCount,
        elapsedSeconds: Math.min(elapsedSeconds, options.benchmark.durationSeconds),
        fleetShipCount: benchmarkFleet.length,
        ...(frameTimeProfile === undefined ? {} : { frameTimeProfile }),
        presetId: preset.id,
        starCount: preset.starCount,
        state,
        targetDurationSeconds: options.benchmark.durationSeconds,
      };
    };

    if (options.benchmark !== undefined) {
      handlers.onBenchmarkTelemetry?.(createBenchmarkTelemetry('warmup')!);
    }

    app.on('update', (deltaSeconds: number) => {
      renderedTelemetry.lodLabel = lodLabel;
      const baseSnapshot = handlers.onUpdate(deltaSeconds, getTelemetry);
      benchmarkElapsedSeconds += Math.max(0, deltaSeconds);
      updateBenchmarkFleet(benchmarkFleet, benchmarkElapsedSeconds);
      const benchmarkTarget = benchmarkFleet[0]?.root.getPosition();
      const benchmarkCycle = Math.floor(benchmarkElapsedSeconds * 8);
      const benchmarkProjectileProgress = (benchmarkElapsedSeconds * 0.3) % 1;
      const snapshot: ArenaRenderSnapshot =
        options.benchmark === undefined || benchmarkTarget === undefined
          ? baseSnapshot
          : {
              ...baseSnapshot,
              encounter: {
                ...baseSnapshot.encounter,
                projectileCount: 1,
                projectilePosition: {
                  x: benchmarkTarget.x * benchmarkProjectileProgress,
                  y: benchmarkTarget.y * benchmarkProjectileProgress,
                  z:
                    baseSnapshot.ship.position.z +
                    (benchmarkTarget.z - baseSnapshot.ship.position.z) *
                      benchmarkProjectileProgress,
                },
              },
              presentationEffects: [
                {
                  kind: 'beam',
                  remainingSeconds: 0.22,
                  serial: 1_000_000 + benchmarkCycle,
                  targetPosition: {
                    x: benchmarkTarget.x,
                    y: benchmarkTarget.y,
                    z: benchmarkTarget.z,
                  },
                },
                {
                  kind: 'tractor',
                  remainingSeconds: 0.22,
                  serial: 2_000_000 + benchmarkCycle,
                  targetPosition: {
                    x: benchmarkTarget.x + 8,
                    y: benchmarkTarget.y - 2,
                    z: benchmarkTarget.z - 9,
                  },
                },
              ],
            };
      const { orientationDegrees, position } = snapshot.ship;
      player.root.setPosition(position.x, position.y, position.z);
      player.root.setEulerAngles(orientationDegrees.x, orientationDegrees.y, orientationDegrees.z);
      const encounter = snapshot.encounter;
      const remoteVessel = deriveRemoteVesselPresentation(encounter.contact);
      const presentationEffect = snapshot.presentationEffects?.at(-1);
      const combatVisuals = deriveCombatVisualPresentation(
        presentationEffect === undefined ? encounter : { ...encounter, effect: presentationEffect },
        remoteVessel.visible,
        COMBAT_VISUAL_CAPACITIES,
      );
      applyHullSectionVisualStates(
        player,
        combatVisuals.playerHullSections,
        combatVisuals.playerDisabledSubsystems,
        materials,
        preset.maxVisualDamageBursts,
        benchmarkElapsedSeconds,
      );
      remote.root.enabled = remoteVessel.visible;
      if (remoteVessel.visible && remoteVessel.position !== undefined) {
        remote.root.setPosition(
          remoteVessel.position.x,
          remoteVessel.position.y,
          remoteVessel.position.z,
        );
        remote.root.setEulerAngles(
          encounter.enemy.orientationDegrees.x,
          encounter.enemy.orientationDegrees.y,
          encounter.enemy.orientationDegrees.z,
        );
        if (
          combatVisuals.remoteHullState !== 'hidden' &&
          combatVisuals.remoteHullSections !== 'hidden'
        ) {
          applyHullSectionVisualStates(
            remote.detailed,
            combatVisuals.remoteHullSections,
            combatVisuals.remoteDisabledSubsystems,
            materials,
            preset.maxVisualDamageBursts,
            benchmarkElapsedSeconds,
          );
          remote.lowRender.material =
            combatVisuals.remoteHullState === 'intact'
              ? materials.hostileHull
              : combatVisuals.remoteHullState === 'damaged'
                ? materials.damageScorched
                : materials.damageCritical;
        }
      }
      const combatVfxCount = updateCombatVfx(
        combatVfx,
        snapshot,
        player,
        remote,
        remoteVessel.visible,
        materials,
      );
      renderedTelemetry.activeVfxCount =
        combatVfxCount +
        countActiveDamageVfx(player) +
        (remote.root.enabled ? countActiveDamageVfx(remote.detailed) : 0) +
        benchmarkFleet.reduce((total, ship) => total + countActiveDamageVfx(ship), 0);

      const playerRotation = player.root.getRotation();
      playerRotation.transformVector(cameraOffset.set(0, 5.3, 14.8), cameraPosition);
      cameraPosition.add(player.root.getPosition());
      camera.setPosition(cameraPosition);
      playerRotation.transformVector(cameraTarget.set(0, 0.5, -8.5), cameraOffset);
      cameraTarget.copy(player.root.getPosition()).add(cameraOffset);
      camera.lookAt(cameraTarget);

      const selectedContact =
        encounter.selectedContactId !== undefined &&
        encounter.selectedContactId === encounter.contact.contactId;
      if (
        encounter.phase !== 'active' ||
        !selectedContact ||
        encounter.contact.awareness === 'unknown' ||
        encounter.contact.lastObservation === undefined
      ) {
        targetMarkerPresentation = {
          mode: 'observed',
          screenX: 0,
          screenY: 0,
          visible: false,
        };
      } else if (encounter.contact.observedNow) {
        const publicPosition = encounter.contact.lastObservation.position;
        targetWorldPosition.set(publicPosition.x, publicPosition.y, publicPosition.z);
        targetFromCamera.copy(targetWorldPosition).sub(camera.getPosition());
        const inFront = camera.forward.dot(targetFromCamera) > 0;
        if (inFront) {
          cameraComponent.worldToScreen(targetWorldPosition, projectedTarget);
          const viewportWidth = graphicsDevice.clientRect.width;
          const viewportHeight = graphicsDevice.clientRect.height;
          targetMarkerPresentation = {
            mode: 'observed',
            screenX: clamp(projectedTarget.x, 32, viewportWidth - 32),
            screenY: clamp(projectedTarget.y, 32, viewportHeight - 32),
            visible: true,
          };
        } else {
          targetMarkerPresentation = {
            mode: 'observed',
            screenX: 0,
            screenY: 0,
            visible: false,
          };
        }
      } else if (targetMarkerPresentation.visible) {
        targetMarkerPresentation = {
          ...targetMarkerPresentation,
          mode: 'remembered',
        };
      }
      handlers.onPresentationFrame({ combatVisuals, targetMarker: targetMarkerPresentation });

      const distanceToRemote = remoteVessel.visible
        ? player.root.getPosition().distance(remote.root.getPosition())
        : Number.POSITIVE_INFINITY;
      const detailedLod = remoteVessel.visible && distanceToRemote < preset.lodDistanceUnits;
      remote.detailed.root.enabled = detailedLod;
      remote.low.enabled = remoteVessel.visible && !detailedLod;
      lodLabel = remoteVessel.visible
        ? detailedLod
          ? 'Nave remota · detalhada'
          : 'Nave remota · silhueta'
        : 'Nave remota · oculta sem percepção';

      const fps = fpsMeter.recordFrame(performance.now());
      if (fps !== undefined) {
        handlers.onFpsSample(fps);
      }
    });
    app.scene.on('postrender', () => {
      renderedTelemetry.drawCalls = app.stats.drawCalls.total;
      renderedTelemetry.frameTimeMs = app.stats.frame.ms;
      renderedTelemetry.lodLabel = lodLabel;

      if (options.benchmark === undefined || benchmarkCompleted) return;
      const nowMs = performance.now();
      if (benchmarkFrameStartedAtMs !== undefined) {
        const frameTimeMs = nowMs - benchmarkFrameStartedAtMs;
        if (benchmarkElapsedSeconds >= options.benchmark.warmupSeconds) {
          benchmarkProfiler.record(frameTimeMs);
        }
      }
      benchmarkFrameStartedAtMs = nowMs;

      const measurementElapsedSeconds = benchmarkElapsedSeconds - options.benchmark.warmupSeconds;
      const state: BenchmarkTelemetry['state'] =
        measurementElapsedSeconds < 0
          ? 'warmup'
          : measurementElapsedSeconds < options.benchmark.durationSeconds
            ? 'sampling'
            : 'complete';
      if (state === 'complete') benchmarkCompleted = true;
      if (benchmarkCompleted || nowMs - lastBenchmarkPublishAtMs >= 250) {
        const telemetry = createBenchmarkTelemetry(state);
        if (telemetry !== undefined) handlers.onBenchmarkTelemetry?.(telemetry);
        lastBenchmarkPublishAtMs = nowMs;
      }
    });

    app.start();
    const disposeResources = resources.commit();

    return {
      backendLabel: app.graphicsDevice.deviceType === DEVICETYPE_WEBGPU ? 'WebGPU' : 'WebGL 2',
      dispose: disposeResources,
    };
  } catch (cause: unknown) {
    try {
      resources.rollback();
    } catch (cleanupCause: unknown) {
      throw new AggregateError(
        [cause, cleanupCause],
        'A montagem da cena falhou e a liberação de recursos também encontrou erro.',
      );
    }
    throw cause;
  }
}
