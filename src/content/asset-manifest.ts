export const ASSET_MANIFEST_SCHEMA_VERSION = 1;
export const MAXIMUM_INITIAL_ASSET_BYTES = 60 * 1024 * 1024;

const SUPPORTED_ASSET_TYPES = new Set(['image/svg+xml']);

export interface AssetAttribution {
  readonly author: string;
  readonly createdAt: string;
  readonly license: string;
  readonly origin: string;
  readonly title: string;
}

export interface AssetManifestEntry {
  readonly attribution: AssetAttribution;
  readonly dependencies: readonly string[];
  readonly id: string;
  readonly path: string;
  readonly sha256: string;
  readonly sizeBytes: number;
  readonly type: string;
}

export interface AssetManifest {
  readonly assets: readonly AssetManifestEntry[];
  readonly auditedAt: string;
  readonly schemaVersion: typeof ASSET_MANIFEST_SCHEMA_VERSION;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, context: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`${context} deve ser um objeto.`);
  }
  return value;
}

function requireExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
  context: string,
): void {
  const actualKeys = Object.keys(value).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  if (
    actualKeys.length !== sortedExpectedKeys.length ||
    actualKeys.some((key, index) => key !== sortedExpectedKeys[index])
  ) {
    throw new Error(`${context} contém campos ausentes ou desconhecidos.`);
  }
}

function requireNonEmptyString(value: unknown, context: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${context} deve ser um texto não vazio.`);
  }
  return value;
}

function requireIsoDate(value: unknown, context: string): string {
  const date = requireNonEmptyString(value, context);
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsedDate.valueOf()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    throw new Error(`${context} deve usar a data ISO AAAA-MM-DD.`);
  }
  return date;
}

function parseAttribution(value: unknown, assetId: string): AssetAttribution {
  const context = `A atribuição de ${assetId}`;
  const record = requireRecord(value, context);
  requireExactKeys(record, ['author', 'createdAt', 'license', 'origin', 'title'], context);
  return Object.freeze({
    author: requireNonEmptyString(record.author, `${context}.author`),
    createdAt: requireIsoDate(record.createdAt, `${context}.createdAt`),
    license: requireNonEmptyString(record.license, `${context}.license`),
    origin: requireNonEmptyString(record.origin, `${context}.origin`),
    title: requireNonEmptyString(record.title, `${context}.title`),
  });
}

function parseDependencies(value: unknown, assetId: string): readonly string[] {
  if (!Array.isArray(value)) {
    throw new Error(`As dependências de ${assetId} devem formar uma lista.`);
  }
  const dependencies = value.map((dependency, index) =>
    requireNonEmptyString(dependency, `A dependência ${index + 1} de ${assetId}`),
  );
  if (new Set(dependencies).size !== dependencies.length) {
    throw new Error(`O asset ${assetId} contém dependências duplicadas.`);
  }
  return Object.freeze(dependencies);
}

function parseEntry(value: unknown, index: number): AssetManifestEntry {
  const context = `O asset ${index + 1}`;
  const record = requireRecord(value, context);
  requireExactKeys(
    record,
    ['attribution', 'dependencies', 'id', 'path', 'sha256', 'sizeBytes', 'type'],
    context,
  );
  const id = requireNonEmptyString(record.id, `${context}.id`);
  if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(id)) {
    throw new Error(`O ID ${id} não é um identificador lógico válido.`);
  }
  const path = requireNonEmptyString(record.path, `${context}.path`);
  const pathSegments = path.split('/');
  if (
    !path.startsWith('assets/') ||
    !/^assets\/[a-z0-9][a-z0-9._/-]*$/.test(path) ||
    path.includes('\\') ||
    path.includes('?') ||
    path.includes('#') ||
    pathSegments.some((segment) => segment === '' || segment === '.' || segment === '..')
  ) {
    throw new Error(`O caminho de ${id} deve ser relativo, local e contido em assets/.`);
  }
  const type = requireNonEmptyString(record.type, `${context}.type`);
  if (!SUPPORTED_ASSET_TYPES.has(type)) {
    throw new Error(`O tipo ${type} de ${id} não é suportado pelo build.`);
  }
  if (!Number.isSafeInteger(record.sizeBytes) || (record.sizeBytes as number) <= 0) {
    throw new Error(`O tamanho declarado de ${id} deve ser um inteiro positivo.`);
  }
  const sha256 = requireNonEmptyString(record.sha256, `${context}.sha256`).toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(sha256)) {
    throw new Error(`O hash SHA-256 de ${id} é inválido.`);
  }
  return Object.freeze({
    attribution: parseAttribution(record.attribution, id),
    dependencies: parseDependencies(record.dependencies, id),
    id,
    path,
    sha256,
    sizeBytes: record.sizeBytes as number,
    type,
  });
}

function validateDependencyGraph(assets: readonly AssetManifestEntry[]): void {
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
  const state = new Map<string, 'active' | 'complete'>();

  const visit = (assetId: string): void => {
    const currentState = state.get(assetId);
    if (currentState === 'complete') return;
    if (currentState === 'active') {
      throw new Error(`O manifesto contém um ciclo de dependências em ${assetId}.`);
    }
    const asset = assetsById.get(assetId);
    if (asset === undefined) {
      throw new Error(`O manifesto referencia a dependência desconhecida ${assetId}.`);
    }
    state.set(assetId, 'active');
    for (const dependencyId of asset.dependencies) {
      visit(dependencyId);
    }
    state.set(assetId, 'complete');
  };

  for (const asset of assets) visit(asset.id);
}

export function parseAssetManifest(value: unknown): AssetManifest {
  const record = requireRecord(value, 'O manifesto de assets');
  requireExactKeys(record, ['assets', 'auditedAt', 'schemaVersion'], 'O manifesto de assets');
  if (record.schemaVersion !== ASSET_MANIFEST_SCHEMA_VERSION) {
    throw new Error(`A versão ${String(record.schemaVersion)} do manifesto não é suportada.`);
  }
  if (!Array.isArray(record.assets) || record.assets.length === 0) {
    throw new Error('O manifesto deve registrar pelo menos um asset distribuído.');
  }
  const assets = record.assets.map(parseEntry);
  if (new Set(assets.map(({ id }) => id)).size !== assets.length) {
    throw new Error('O manifesto contém IDs de asset duplicados.');
  }
  const totalBytes = assets.reduce((total, asset) => total + asset.sizeBytes, 0);
  if (totalBytes > MAXIMUM_INITIAL_ASSET_BYTES) {
    throw new Error('O manifesto excede o orçamento inicial de 60 MB.');
  }
  validateDependencyGraph(assets);
  return Object.freeze({
    assets: Object.freeze(assets),
    auditedAt: requireIsoDate(record.auditedAt, 'O campo auditedAt'),
    schemaVersion: ASSET_MANIFEST_SCHEMA_VERSION,
  });
}
