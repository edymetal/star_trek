export type GraphicsPresetId = 'low' | 'medium';

export interface GraphicsPreset {
  readonly antialias: boolean;
  readonly id: GraphicsPresetId;
  readonly label: string;
  readonly maxPixelRatio: number;
  readonly resolutionScale: number;
}

const graphicsPresets: Readonly<Record<GraphicsPresetId, GraphicsPreset>> = {
  low: {
    antialias: false,
    id: 'low',
    label: 'Baixo · segurança',
    maxPixelRatio: 1,
    resolutionScale: 0.75,
  },
  medium: {
    antialias: true,
    id: 'medium',
    label: 'Médio · recomendado',
    maxPixelRatio: 1.1,
    resolutionScale: 0.9,
  },
};

export function getGraphicsPreset(id: GraphicsPresetId): GraphicsPreset {
  return graphicsPresets[id];
}
