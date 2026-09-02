import { parseAssetManifest, type AssetManifestEntry } from '../content/asset-manifest';

export type BuildAssetState = 'disposed' | 'fallback' | 'loading' | 'ready';

export interface BuildAssetSnapshot {
  readonly assetUrls: ReadonlyMap<string, string>;
  readonly detail: string;
  readonly loadedAssetCount: number;
  readonly loadedBytes: number;
  readonly manifestVersion?: number;
  readonly state: BuildAssetState;
}

interface AssetFetchResponse {
  readonly headers: { get(name: string): string | null };
  readonly ok: boolean;
  readonly status: number;
  arrayBuffer(): Promise<ArrayBuffer>;
  json(): Promise<unknown>;
}

export interface BuildAssetEnvironment {
  readonly computeSha256: (data: ArrayBuffer) => Promise<string>;
  readonly createObjectUrl: (data: Blob) => string;
  readonly fetchResource: (url: string) => Promise<AssetFetchResponse>;
  readonly revokeObjectUrl: (url: string) => void;
}

export interface BuildAssetController {
  dispose(): void;
  getSnapshot(): BuildAssetSnapshot;
  load(): Promise<BuildAssetSnapshot>;
}

export interface BuildAssetControllerOptions {
  readonly baseUrl: string;
  readonly environment?: BuildAssetEnvironment;
  readonly manifestPath?: string;
  readonly onChange?: (snapshot: BuildAssetSnapshot) => void;
}

interface LoadedAsset {
  readonly bytes: ArrayBuffer;
  readonly definition: AssetManifestEntry;
}

const MANIFEST_PATH = 'assets/asset-manifest.json';

async function computeBrowserSha256(data: ArrayBuffer): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join(
    '',
  );
}

function createBrowserEnvironment(): BuildAssetEnvironment {
  return {
    computeSha256: computeBrowserSha256,
    createObjectUrl: (data) => URL.createObjectURL(data),
    fetchResource: (url) => fetch(url, { cache: 'no-cache' }),
    revokeObjectUrl: (url) => URL.revokeObjectURL(url),
  };
}

function errorDetail(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'Falha desconhecida ao validar os assets.';
}

async function fetchManifest(
  environment: BuildAssetEnvironment,
  manifestUrl: string,
): Promise<ReturnType<typeof parseAssetManifest>> {
  const response = await environment.fetchResource(manifestUrl);
  if (!response.ok) {
    throw new Error(`O manifesto não respondeu corretamente (HTTP ${response.status}).`);
  }
  return parseAssetManifest(await response.json());
}

async function fetchAsset(
  environment: BuildAssetEnvironment,
  baseUrl: string,
  definition: AssetManifestEntry,
): Promise<LoadedAsset> {
  const assetUrl = new URL(definition.path, baseUrl).href;
  const response = await environment.fetchResource(assetUrl);
  if (!response.ok) {
    throw new Error(
      `O asset ${definition.id} não respondeu corretamente (HTTP ${response.status}).`,
    );
  }
  const receivedType = response.headers.get('content-type')?.split(';')[0]?.trim();
  if (receivedType !== undefined && receivedType !== '' && receivedType !== definition.type) {
    throw new Error(`O asset ${definition.id} retornou o tipo incompatível ${receivedType}.`);
  }
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== definition.sizeBytes) {
    throw new Error(
      `O tamanho de ${definition.id} diverge do manifesto: ${bytes.byteLength} de ${definition.sizeBytes} bytes.`,
    );
  }
  const hash = (await environment.computeSha256(bytes)).toLowerCase();
  if (hash !== definition.sha256) {
    throw new Error(`A integridade SHA-256 de ${definition.id} não confere.`);
  }
  return { bytes, definition };
}

export function createBuildAssetController(
  options: BuildAssetControllerOptions,
): BuildAssetController {
  const environment = options.environment ?? createBrowserEnvironment();
  const manifestUrl = new URL(options.manifestPath ?? MANIFEST_PATH, options.baseUrl).href;
  let disposed = false;
  let activeObjectUrls = new Map<string, string>();
  let pendingLoad: Promise<BuildAssetSnapshot> | undefined;
  let snapshot: BuildAssetSnapshot = {
    assetUrls: activeObjectUrls,
    detail: 'Aguardando validação do catálogo local.',
    loadedAssetCount: 0,
    loadedBytes: 0,
    state: 'loading',
  };

  const publish = (nextSnapshot: BuildAssetSnapshot): BuildAssetSnapshot => {
    snapshot = nextSnapshot;
    options.onChange?.(snapshot);
    return snapshot;
  };

  const revokeAll = (urls: ReadonlyMap<string, string>): void => {
    for (const url of urls.values()) environment.revokeObjectUrl(url);
  };

  const performLoad = async (): Promise<BuildAssetSnapshot> => {
    publish({
      assetUrls: activeObjectUrls,
      detail: 'Validando manifesto, tamanho, tipo e integridade dos assets locais…',
      loadedAssetCount: activeObjectUrls.size,
      loadedBytes: 0,
      state: 'loading',
    });
    const candidateUrls = new Map<string, string>();
    try {
      const manifest = await fetchManifest(environment, manifestUrl);
      const loadedAssets = await Promise.all(
        manifest.assets.map((definition) => fetchAsset(environment, options.baseUrl, definition)),
      );
      if (disposed) {
        return snapshot;
      }
      for (const { bytes, definition } of loadedAssets) {
        const objectUrl = environment.createObjectUrl(new Blob([bytes], { type: definition.type }));
        candidateUrls.set(definition.id, objectUrl);
      }
      const previousUrls = activeObjectUrls;
      activeObjectUrls = candidateUrls;
      revokeAll(previousUrls);
      return publish({
        assetUrls: activeObjectUrls,
        detail: `${loadedAssets.length} asset local validado; origem e licença registradas.`,
        loadedAssetCount: loadedAssets.length,
        loadedBytes: loadedAssets.reduce((total, asset) => total + asset.bytes.byteLength, 0),
        manifestVersion: manifest.schemaVersion,
        state: 'ready',
      });
    } catch (cause: unknown) {
      revokeAll(candidateUrls);
      if (disposed) return snapshot;
      return publish({
        assetUrls: activeObjectUrls,
        detail: `${errorDetail(cause)} O símbolo procedural seguro permanece ativo.`,
        loadedAssetCount: activeObjectUrls.size,
        loadedBytes: 0,
        state: 'fallback',
      });
    }
  };

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      revokeAll(activeObjectUrls);
      activeObjectUrls = new Map();
      publish({
        assetUrls: activeObjectUrls,
        detail: 'Recursos do build descartados.',
        loadedAssetCount: 0,
        loadedBytes: 0,
        state: 'disposed',
      });
    },
    getSnapshot: () => snapshot,
    load() {
      if (disposed || snapshot.state === 'ready') return Promise.resolve(snapshot);
      if (pendingLoad !== undefined) return pendingLoad;
      pendingLoad = performLoad().finally(() => {
        pendingLoad = undefined;
      });
      return pendingLoad;
    },
  };
}
