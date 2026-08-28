export type GraphicsPresetId = 'high' | 'low' | 'medium';

export interface GraphicsPreset {
  readonly antialias: boolean;
  readonly asteroidCount: number;
  readonly benchmarkShipCount: number;
  readonly id: GraphicsPresetId;
  readonly label: string;
  readonly lodDistanceUnits: number;
  readonly maxPixelRatio: number;
  readonly maxVisualDamageBursts: number;
  readonly resolutionScale: number;
  readonly starCount: number;
}

const graphicsPresets: Readonly<Record<GraphicsPresetId, GraphicsPreset>> = {
  low: {
    antialias: false,
    asteroidCount: 96,
    benchmarkShipCount: 4,
    id: 'low',
    label: 'Baixo · segurança',
    lodDistanceUnits: 26,
    maxPixelRatio: 1,
    maxVisualDamageBursts: 1,
    resolutionScale: 0.75,
    starCount: 680,
  },
  medium: {
    antialias: true,
    asteroidCount: 144,
    benchmarkShipCount: 6,
    id: 'medium',
    label: 'Médio · recomendado',
    lodDistanceUnits: 38,
    maxPixelRatio: 1.1,
    maxVisualDamageBursts: 2,
    resolutionScale: 0.9,
    starCount: 900,
  },
  high: {
    antialias: true,
    asteroidCount: 192,
    benchmarkShipCount: 8,
    id: 'high',
    label: 'Alto · qualidade',
    lodDistanceUnits: 52,
    maxPixelRatio: 1.35,
    maxVisualDamageBursts: 3,
    resolutionScale: 1,
    starCount: 1_200,
  },
};

export function getGraphicsPreset(id: GraphicsPresetId): GraphicsPreset {
  return graphicsPresets[id];
}
