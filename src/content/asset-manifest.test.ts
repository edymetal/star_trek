import { describe, expect, it } from 'vitest';

import { MAXIMUM_INITIAL_ASSET_BYTES, parseAssetManifest } from './asset-manifest';

function validEntry(id = 'ui.brand-mark'): Record<string, unknown> {
  return {
    attribution: {
      author: 'Projeto Comando Estelar',
      createdAt: '2026-09-02',
      license: 'LicenseRef-Project-Authored',
      origin: 'Criação original no repositório',
      title: 'Emblema original',
    },
    dependencies: [],
    id,
    path: `assets/${id.replace('.', '-')}.svg`,
    sha256: 'a'.repeat(64),
    sizeBytes: 1107,
    type: 'image/svg+xml',
  };
}

function validManifest(): Record<string, unknown> {
  return {
    assets: [validEntry()],
    auditedAt: '2026-09-02',
    schemaVersion: 1,
  };
}

describe('asset manifest', () => {
  it('valida metadados, atribuição e orçamento do catálogo atual', () => {
    const manifest = parseAssetManifest(validManifest());

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.assets).toHaveLength(1);
    expect(manifest.assets[0]).toMatchObject({
      id: 'ui.brand-mark',
      path: 'assets/ui-brand-mark.svg',
      sizeBytes: 1107,
      type: 'image/svg+xml',
    });
    expect(manifest.assets[0]?.attribution.license).toBe('LicenseRef-Project-Authored');
  });

  it('rejeita versão futura, campos desconhecidos e catálogo vazio', () => {
    expect(() => parseAssetManifest({ ...validManifest(), schemaVersion: 2 })).toThrow(
      'não é suportada',
    );
    expect(() => parseAssetManifest({ ...validManifest(), extra: true })).toThrow(
      'campos ausentes ou desconhecidos',
    );
    expect(() => parseAssetManifest({ ...validManifest(), assets: [] })).toThrow(
      'pelo menos um asset',
    );
  });

  it('rejeita caminho externo ou traversal e hash inválido', () => {
    expect(() =>
      parseAssetManifest({
        ...validManifest(),
        assets: [{ ...validEntry(), path: '../fora.svg' }],
      }),
    ).toThrow('contido em assets/');
    expect(() =>
      parseAssetManifest({
        ...validManifest(),
        assets: [{ ...validEntry(), path: 'https://example.test/fora.svg' }],
      }),
    ).toThrow('contido em assets/');
    expect(() =>
      parseAssetManifest({
        ...validManifest(),
        assets: [{ ...validEntry(), path: 'assets/%2e%2e/fora.svg' }],
      }),
    ).toThrow('contido em assets/');
    expect(() =>
      parseAssetManifest({
        ...validManifest(),
        assets: [{ ...validEntry(), sha256: 'incompleto' }],
      }),
    ).toThrow('SHA-256');
  });

  it('rejeita IDs duplicados, dependência ausente e ciclos', () => {
    expect(() =>
      parseAssetManifest({
        ...validManifest(),
        assets: [validEntry(), validEntry()],
      }),
    ).toThrow('IDs de asset duplicados');

    const dependent = { ...validEntry('ui.overlay'), dependencies: ['ui.missing'] };
    expect(() => parseAssetManifest({ ...validManifest(), assets: [dependent] })).toThrow(
      'dependência desconhecida ui.missing',
    );

    const first = { ...validEntry('ui.first'), dependencies: ['ui.second'] };
    const second = { ...validEntry('ui.second'), dependencies: ['ui.first'] };
    expect(() => parseAssetManifest({ ...validManifest(), assets: [first, second] })).toThrow(
      'ciclo de dependências',
    );
  });

  it('rejeita tamanho inválido ou catálogo acima de 60 MB', () => {
    expect(() =>
      parseAssetManifest({
        ...validManifest(),
        assets: [{ ...validEntry(), sizeBytes: 0 }],
      }),
    ).toThrow('inteiro positivo');
    expect(() =>
      parseAssetManifest({
        ...validManifest(),
        assets: [{ ...validEntry(), sizeBytes: MAXIMUM_INITIAL_ASSET_BYTES + 1 }],
      }),
    ).toThrow('orçamento inicial de 60 MB');
  });

  it('exige autoria, origem, licença e datas explícitas', () => {
    const entry = validEntry();
    const attribution = { ...(entry.attribution as Record<string, unknown>), license: '' };
    expect(() =>
      parseAssetManifest({
        ...validManifest(),
        assets: [{ ...entry, attribution }],
      }),
    ).toThrow('license deve ser um texto não vazio');
    expect(() =>
      parseAssetManifest({
        ...validManifest(),
        auditedAt: '2026-02-31',
      }),
    ).toThrow('data ISO');
  });
});
