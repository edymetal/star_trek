import { describe, expect, it, vi } from 'vitest';

import type { BuildAssetEnvironment } from './build-asset-loader';
import { createBuildAssetController } from './build-asset-loader';

const ASSET_BYTES = new TextEncoder().encode('<svg></svg>');
const ASSET_HASH = 'a'.repeat(64);

function manifest(assetOverrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    assets: [
      {
        attribution: {
          author: 'Projeto Comando Estelar',
          createdAt: '2026-09-02',
          license: 'LicenseRef-Project-Authored',
          origin: 'Criação original no repositório',
          title: 'Emblema original',
        },
        dependencies: [],
        id: 'ui.brand-mark',
        path: 'assets/stellar-command-mark.svg',
        sha256: ASSET_HASH,
        sizeBytes: ASSET_BYTES.byteLength,
        type: 'image/svg+xml',
        ...assetOverrides,
      },
    ],
    auditedAt: '2026-09-02',
    schemaVersion: 1,
  };
}

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    headers: { 'content-type': 'application/json' },
    status,
  });
}

function assetResponse(bytes = ASSET_BYTES, status = 200): Response {
  return new Response(bytes, {
    headers: { 'content-type': 'image/svg+xml' },
    status,
  });
}

function createEnvironment(
  fetchResource: BuildAssetEnvironment['fetchResource'],
  computeSha256: BuildAssetEnvironment['computeSha256'] = vi.fn(async () => ASSET_HASH),
) {
  const createObjectUrl = vi.fn(() => 'blob:brand-mark');
  const revokeObjectUrl = vi.fn(() => undefined);
  const environment = {
    computeSha256,
    createObjectUrl,
    fetchResource,
    revokeObjectUrl,
  } satisfies BuildAssetEnvironment;
  return { createObjectUrl, environment, revokeObjectUrl };
}

describe('build asset loader', () => {
  it('resolve caminhos sob subdiretório, valida e publica todos os recursos atomicamente', async () => {
    const requestedUrls: string[] = [];
    const testEnvironment = createEnvironment(async (url) => {
      requestedUrls.push(url);
      return url.endsWith('asset-manifest.json') ? jsonResponse(manifest()) : assetResponse();
    });
    const snapshots: string[] = [];
    const controller = createBuildAssetController({
      baseUrl: 'https://example.test/jogo/',
      environment: testEnvironment.environment,
      onChange: ({ state }) => snapshots.push(state),
    });

    const snapshot = await controller.load();

    expect(requestedUrls).toEqual([
      'https://example.test/jogo/assets/asset-manifest.json',
      'https://example.test/jogo/assets/stellar-command-mark.svg',
    ]);
    expect(snapshot.state).toBe('ready');
    expect(snapshot.assetUrls.get('ui.brand-mark')).toBe('blob:brand-mark');
    expect(snapshot.loadedBytes).toBe(ASSET_BYTES.byteLength);
    expect(snapshots).toEqual(['loading', 'ready']);
    expect(testEnvironment.createObjectUrl).toHaveBeenCalledTimes(1);
  });

  it('mantém fallback seguro quando manifesto ou asset falha e permite nova tentativa', async () => {
    let failManifest = true;
    const testEnvironment = createEnvironment(async (url) => {
      if (url.endsWith('asset-manifest.json')) {
        return failManifest ? jsonResponse({}, 503) : jsonResponse(manifest());
      }
      return assetResponse();
    });
    const controller = createBuildAssetController({
      baseUrl: 'https://example.test/jogo/',
      environment: testEnvironment.environment,
    });

    const fallback = await controller.load();
    expect(fallback.state).toBe('fallback');
    expect(fallback.detail).toContain('HTTP 503');
    expect(testEnvironment.createObjectUrl).not.toHaveBeenCalled();

    failManifest = false;
    const recovered = await controller.load();
    expect(recovered.state).toBe('ready');
    expect(recovered.loadedAssetCount).toBe(1);
  });

  it('rejeita tamanho, tipo ou hash divergente antes de criar URL utilizável', async () => {
    for (const failure of ['size', 'type', 'hash'] as const) {
      const testEnvironment = createEnvironment(
        async (url) => {
          if (url.endsWith('asset-manifest.json')) return jsonResponse(manifest());
          if (failure === 'size') return assetResponse(new Uint8Array([1]));
          if (failure === 'type') {
            return new Response(ASSET_BYTES, {
              headers: { 'content-type': 'image/png' },
              status: 200,
            });
          }
          return assetResponse();
        },
        failure === 'hash' ? vi.fn(async () => 'b'.repeat(64)) : undefined,
      );
      const controller = createBuildAssetController({
        baseUrl: 'https://example.test/jogo/',
        environment: testEnvironment.environment,
      });

      expect((await controller.load()).state).toBe('fallback');
      expect(testEnvironment.createObjectUrl).not.toHaveBeenCalled();
    }
  });

  it('compartilha tentativas concorrentes e revoga recursos uma única vez no descarte', async () => {
    let resolveManifest: ((response: Response) => void) | undefined;
    const manifestPromise = new Promise<Response>((resolve) => {
      resolveManifest = resolve;
    });
    const testEnvironment = createEnvironment(async (url) =>
      url.endsWith('asset-manifest.json') ? manifestPromise : assetResponse(),
    );
    const controller = createBuildAssetController({
      baseUrl: 'https://example.test/jogo/',
      environment: testEnvironment.environment,
    });

    const firstLoad = controller.load();
    const secondLoad = controller.load();
    expect(firstLoad).toBe(secondLoad);
    resolveManifest?.(jsonResponse(manifest()));
    await firstLoad;

    controller.dispose();
    controller.dispose();
    expect(testEnvironment.revokeObjectUrl).toHaveBeenCalledOnce();
    expect(controller.getSnapshot().state).toBe('disposed');
  });
});
