import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lockPath = resolve(projectRoot, 'package-lock.json');
const markerPath = resolve(projectRoot, 'node_modules', '.package-lock.sha256');
const lockHash = createHash('sha256')
  .update(await readFile(lockPath))
  .digest('hex');

await writeFile(markerPath, `${lockHash}\n`, 'utf8');
