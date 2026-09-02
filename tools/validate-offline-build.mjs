import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { stdout } from 'node:process';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distributionRoot = resolve(projectRoot, 'dist');
const indexPath = resolve(distributionRoot, 'index.html');
const maximumInitialBuildBytes = 60 * 1024 * 1024;

function fail(message) {
  throw new Error(`Falha na validação offline: ${message}`);
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

function localReferencePath(reference) {
  if (reference.startsWith('data:') || reference.startsWith('#')) return undefined;
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(reference))
    fail(`index.html referencia uma origem externa: ${reference}.`);
  const normalizedReference = reference.split(/[?#]/, 1)[0];
  if (normalizedReference === '') return undefined;
  const absolutePath = resolve(distributionRoot, normalizedReference.replace(/^\.\//, ''));
  const relativePath = relative(distributionRoot, absolutePath);
  if (relativePath === '..' || relativePath.startsWith(`..${sep}`))
    fail(`index.html contém caminho fora de dist: ${reference}.`);
  return absolutePath;
}

const files = await listFiles(distributionRoot);
if (files.length === 0) fail('dist está vazio.');
const totalBytes = (
  await Promise.all(files.map(async (filePath) => (await stat(filePath)).size))
).reduce((total, size) => total + size, 0);
if (totalBytes > maximumInitialBuildBytes) fail('o build inicial excede o orçamento de 60 MB.');

const indexHtml = await readFile(indexPath, 'utf8');
const references = [...indexHtml.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)].map(
  (match) => match[1],
);
let localReferenceCount = 0;
let embeddedReferenceCount = 0;
for (const reference of references) {
  const absolutePath = localReferencePath(reference);
  if (absolutePath === undefined) {
    embeddedReferenceCount += 1;
    continue;
  }
  localReferenceCount += 1;
  const fileStats = await stat(absolutePath).catch(() => undefined);
  if (fileStats === undefined || !fileStats.isFile())
    fail(`a referência ${reference} não existe no build.`);
}

const executableText = (
  await Promise.all(
    files
      .filter((filePath) => /\.(?:html|js)$/i.test(filePath))
      .map((filePath) => readFile(filePath, 'utf8')),
  )
).join('\n');
if (/\bserviceWorker\s*\.\s*register\s*\(/.test(executableText))
  fail('o build registrou service worker sem decisão de cache aprovada.');

stdout.write(
  `Build offline validado: ${files.length} arquivo(s), ${totalBytes} byte(s), ${localReferenceCount} referência(s) local(is), ${embeddedReferenceCount} incorporada(s) e nenhum service worker.\n`,
);
