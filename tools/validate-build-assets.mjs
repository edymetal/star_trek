import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { stdout } from 'node:process';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = resolve(projectRoot, 'public');
const assetRoot = resolve(publicRoot, 'assets');
const manifestPath = resolve(assetRoot, 'asset-manifest.json');
const maximumInitialAssetBytes = 60 * 1024 * 1024;
const supportedTypesByExtension = new Map([['.svg', 'image/svg+xml']]);
const compatibleRuntimeLicenses = new Set([
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  'MIT',
]);

function fail(message) {
  throw new Error(`Falha na auditoria de assets: ${message}`);
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireText(value, context) {
  if (typeof value !== 'string' || value.trim() === '') fail(`${context} não foi informado.`);
  return value;
}

function requireExactKeys(value, expectedKeys, context) {
  const actualKeys = Object.keys(value).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  if (
    actualKeys.length !== sortedExpectedKeys.length ||
    actualKeys.some((key, index) => key !== sortedExpectedKeys[index])
  ) {
    fail(`${context} contém campos ausentes ou desconhecidos.`);
  }
}

function requireIsoDate(value, context) {
  const date = requireText(value, context);
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsedDate.valueOf()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    fail(`${context} deve usar a data ISO AAAA-MM-DD.`);
  }
  return date;
}

function extensionOf(path) {
  const match = /\.[a-z0-9]+$/i.exec(path);
  return match?.[0].toLowerCase();
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(entryPath)));
    else if (entry.isFile()) files.push(entryPath);
  }
  return files;
}

async function validateRuntimeDependencies() {
  const packageJson = JSON.parse(await readFile(resolve(projectRoot, 'package.json'), 'utf8'));
  const dependencies = Object.entries(packageJson.dependencies ?? {});
  for (const [name, expectedVersion] of dependencies) {
    const dependencyPackagePath = resolve(
      projectRoot,
      'node_modules',
      ...name.split('/'),
      'package.json',
    );
    const dependencyPackage = JSON.parse(await readFile(dependencyPackagePath, 'utf8'));
    if (dependencyPackage.version !== expectedVersion) {
      fail(
        `${name} instalado em ${dependencyPackage.version}, mas o build fixa ${expectedVersion}.`,
      );
    }
    const license = requireText(dependencyPackage.license, `A licença de ${name}`);
    if (!compatibleRuntimeLicenses.has(license)) {
      fail(`a licença ${license} de ${name} requer revisão explícita.`);
    }
  }
  return dependencies.length;
}

async function validateAssets() {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (!isRecord(manifest)) fail('manifesto ausente ou ilegível.');
  requireExactKeys(manifest, ['assets', 'auditedAt', 'schemaVersion'], 'O manifesto');
  if (manifest.schemaVersion !== 1) fail('manifesto em versão incompatível.');
  requireIsoDate(manifest.auditedAt, 'A auditoria do manifesto');
  if (!Array.isArray(manifest.assets)) fail('os assets do manifesto não são uma lista.');
  if (manifest.assets.length === 0) fail('o catálogo está vazio.');

  const ids = new Set();
  const registeredPaths = new Set();
  let totalBytes = 0;
  for (const entry of manifest.assets) {
    if (!isRecord(entry)) fail('uma entrada não é um objeto.');
    requireExactKeys(
      entry,
      ['attribution', 'dependencies', 'id', 'path', 'sha256', 'sizeBytes', 'type'],
      'Uma entrada do manifesto',
    );
    const id = requireText(entry.id, 'O ID lógico');
    if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(id))
      fail(`o ID ${id} não é um identificador lógico válido.`);
    const path = requireText(entry.path, `O caminho de ${id}`);
    if (ids.has(id)) fail(`o ID ${id} está duplicado.`);
    ids.add(id);
    const pathSegments = path.split('/');
    if (
      !path.startsWith('assets/') ||
      !/^assets\/[a-z0-9][a-z0-9._/-]*$/.test(path) ||
      path.includes('\\') ||
      path.includes('?') ||
      path.includes('#') ||
      pathSegments.some((segment) => segment === '' || segment === '.' || segment === '..')
    ) {
      fail(`o caminho ${path} não é local e seguro.`);
    }
    if (registeredPaths.has(path)) fail(`o caminho ${path} está duplicado.`);
    registeredPaths.add(path);
    const absolutePath = resolve(publicRoot, ...path.split('/'));
    if (!absolutePath.startsWith(`${assetRoot}${sep}`))
      fail(`o caminho ${path} saiu de public/assets.`);
    const fileStats = await stat(absolutePath);
    const bytes = await readFile(absolutePath);
    if (!Number.isSafeInteger(entry.sizeBytes) || entry.sizeBytes <= 0)
      fail(`o tamanho declarado de ${id} deve ser um inteiro positivo.`);
    if (fileStats.size !== entry.sizeBytes) {
      fail(`${id} possui ${fileStats.size} bytes; o manifesto declara ${entry.sizeBytes}.`);
    }
    const declaredHash = requireText(entry.sha256, `O SHA-256 de ${id}`).toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(declaredHash)) fail(`o SHA-256 declarado de ${id} é inválido.`);
    const hash = createHash('sha256').update(bytes).digest('hex');
    if (hash !== declaredHash) fail(`o SHA-256 de ${id} não confere.`);
    const expectedType = supportedTypesByExtension.get(extensionOf(path));
    if (expectedType === undefined || entry.type !== expectedType) {
      fail(`o tipo ${String(entry.type)} de ${id} não corresponde ao arquivo.`);
    }
    if (!Array.isArray(entry.dependencies)) fail(`as dependências de ${id} não são uma lista.`);
    for (const dependencyId of entry.dependencies)
      requireText(dependencyId, `Uma dependência de ${id}`);
    if (new Set(entry.dependencies).size !== entry.dependencies.length)
      fail(`as dependências de ${id} contêm IDs duplicados.`);
    if (!isRecord(entry.attribution)) fail(`a atribuição de ${id} não é um objeto.`);
    requireExactKeys(
      entry.attribution,
      ['author', 'createdAt', 'license', 'origin', 'title'],
      `A atribuição de ${id}`,
    );
    for (const field of ['author', 'createdAt', 'license', 'origin', 'title']) {
      requireText(entry.attribution[field], `${field} de ${id}`);
    }
    requireIsoDate(entry.attribution.createdAt, `createdAt de ${id}`);
    if (expectedType === 'image/svg+xml') {
      const svg = bytes.toString('utf8');
      if (!/<svg(?:\s|>)/i.test(svg)) fail(`${id} não contém uma raiz SVG.`);
      if (/<(?:script|foreignObject)(?:\s|>)/i.test(svg))
        fail(`${id} contém conteúdo SVG executável não permitido.`);
      if (/\b(?:href|src)\s*=\s*["'](?:https?:|\/\/|data:)/i.test(svg))
        fail(`${id} referencia conteúdo externo ou incorporado não permitido.`);
    }
    totalBytes += fileStats.size;
  }

  for (const entry of manifest.assets) {
    for (const dependencyId of entry.dependencies) {
      if (!ids.has(dependencyId)) fail(`${entry.id} depende do ID desconhecido ${dependencyId}.`);
    }
  }
  const assetsById = new Map(manifest.assets.map((entry) => [entry.id, entry]));
  const dependencyState = new Map();
  const visit = (assetId) => {
    if (dependencyState.get(assetId) === 'complete') return;
    if (dependencyState.get(assetId) === 'active')
      fail(`o manifesto contém um ciclo de dependências em ${assetId}.`);
    dependencyState.set(assetId, 'active');
    for (const dependencyId of assetsById.get(assetId).dependencies) visit(dependencyId);
    dependencyState.set(assetId, 'complete');
  };
  for (const assetId of ids) visit(assetId);
  if (totalBytes > maximumInitialAssetBytes)
    fail('o catálogo excede o orçamento inicial de 60 MB.');

  const distributedFiles = (await listFiles(assetRoot))
    .map((path) => `assets/${relative(assetRoot, path).split(sep).join('/')}`)
    .filter((path) => path !== 'assets/asset-manifest.json');
  const unregistered = distributedFiles.filter((path) => !registeredPaths.has(path));
  const missing = [...registeredPaths].filter((path) => !distributedFiles.includes(path));
  if (unregistered.length > 0) fail(`arquivos sem registro: ${unregistered.join(', ')}.`);
  if (missing.length > 0) fail(`registros sem arquivo: ${missing.join(', ')}.`);

  return { assetCount: manifest.assets.length, totalBytes };
}

const [{ assetCount, totalBytes }, runtimeDependencyCount] = await Promise.all([
  validateAssets(),
  validateRuntimeDependencies(),
]);

stdout.write(
  `Assets validados: ${assetCount} arquivo(s), ${totalBytes} byte(s), ${runtimeDependencyCount} dependência(s) de runtime com licença compatível.\n`,
);
