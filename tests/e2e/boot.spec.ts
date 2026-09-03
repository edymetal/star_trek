import { expect, test, type Page } from '@playwright/test';
import { createGameSaveEnvelope, createGameSavePayload } from '../../src/application/game-save';
import { SETTINGS_STORAGE_KEY } from '../../src/platform/local-storage-settings-repository';

const SAVE_DATABASE_NAME = 'stellar-command-game-save';
const SAVE_METADATA_STORE = 'metadata';
const SAVE_SNAPSHOTS_STORE = 'snapshots';
const SAVE_ACTIVE_KEY = 'active-game-save';

async function corruptActiveSave(page: Page): Promise<void> {
  await page.evaluate(
    async ({ activeKey, databaseName, metadataStoreName, snapshotsStoreName }) => {
      const requestResult = <T>(request: IDBRequest<T>): Promise<T> =>
        new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () =>
            reject(request.error ?? new Error('Falha no IndexedDB do teste.'));
        });
      const transactionDone = (transaction: IDBTransaction): Promise<void> =>
        new Promise((resolve, reject) => {
          transaction.oncomplete = () => resolve();
          transaction.onerror = () =>
            reject(transaction.error ?? new Error('Transação IndexedDB falhou no teste.'));
          transaction.onabort = () =>
            reject(transaction.error ?? new Error('Transação IndexedDB cancelada no teste.'));
        });
      const isRecord = (value: unknown): value is Record<string, unknown> =>
        typeof value === 'object' && value !== null && !Array.isArray(value);

      const database = await requestResult(indexedDB.open(databaseName));
      const readTransaction = database.transaction(
        [metadataStoreName, snapshotsStoreName],
        'readonly',
      );
      const pointer: unknown = await requestResult(
        readTransaction.objectStore(metadataStoreName).get(activeKey),
      );
      if (!isRecord(pointer) || typeof pointer.snapshotId !== 'string') {
        throw new Error('Ponteiro de save não encontrado no teste.');
      }
      const snapshot: unknown = await requestResult(
        readTransaction.objectStore(snapshotsStoreName).get(pointer.snapshotId),
      );
      await transactionDone(readTransaction);
      if (!isRecord(snapshot) || !isRecord(snapshot.envelope)) {
        throw new Error('Snapshot de save não encontrado no teste.');
      }

      const writeTransaction = database.transaction(snapshotsStoreName, 'readwrite');
      writeTransaction.objectStore(snapshotsStoreName).put({
        ...snapshot,
        envelope: { ...snapshot.envelope, checksum: 'checksum-corrompido-pelo-teste' },
      });
      await transactionDone(writeTransaction);
      database.close();
    },
    {
      activeKey: SAVE_ACTIVE_KEY,
      databaseName: SAVE_DATABASE_NAME,
      metadataStoreName: SAVE_METADATA_STORE,
      snapshotsStoreName: SAVE_SNAPSHOTS_STORE,
    },
  );
}

async function countStoredSaveSnapshots(page: Page): Promise<number> {
  return page.evaluate(
    async ({ databaseName, snapshotsStoreName }) => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(databaseName);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('Falha ao abrir save no teste.'));
      });
      const transaction = database.transaction(snapshotsStoreName, 'readonly');
      const count = await new Promise<number>((resolve, reject) => {
        const request = transaction.objectStore(snapshotsStoreName).count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
          reject(request.error ?? new Error('Falha ao contar saves no teste.'));
      });
      database.close();
      return count;
    },
    { databaseName: SAVE_DATABASE_NAME, snapshotsStoreName: SAVE_SNAPSHOTS_STORE },
  );
}

async function seedMissionCheckpoint(
  page: Page,
  missionId: string,
  checkpoint: 'briefing' | 'completed',
): Promise<void> {
  await page.goto('/');
  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  await expect(root).toHaveAttribute('data-asset-state', 'ready');
  await expect(root).toHaveAttribute('data-asset-count', '1');
  await expect(root).toHaveAttribute('data-asset-bytes', '1107');
  await expect(page.locator('[data-brand-mark]')).toBeVisible();
  await expect(root).toHaveAttribute('data-save-state', /created|loaded/);
  const savedAtIso = '2026-08-30T12:00:00.000Z';
  const envelope = createGameSaveEnvelope(createGameSavePayload(missionId, checkpoint), savedAtIso);
  await page.evaluate(
    async ({ activeKey, envelope, metadataStoreName, missionId, snapshotsStoreName }) => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('stellar-command-game-save');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('Falha ao abrir save do teste.'));
      });
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(
          [metadataStoreName, snapshotsStoreName],
          'readwrite',
        );
        const snapshotId = `e2e-${missionId}`;
        transaction.objectStore(snapshotsStoreName).put({
          envelope,
          id: snapshotId,
          savedAtIso: envelope.savedAtIso,
        });
        transaction.objectStore(metadataStoreName).put({ key: activeKey, snapshotId });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
          reject(transaction.error ?? new Error('Falha ao preparar save do teste.'));
        transaction.onabort = () =>
          reject(transaction.error ?? new Error('Preparação de save cancelada no teste.'));
      });
      database.close();
    },
    {
      activeKey: SAVE_ACTIVE_KEY,
      envelope,
      metadataStoreName: SAVE_METADATA_STORE,
      missionId,
      snapshotsStoreName: SAVE_SNAPSHOTS_STORE,
    },
  );
  await page.reload();
  await expect(root).toHaveAttribute('data-save-state', 'loaded');
  await expect(root).toHaveAttribute('data-mission-id', missionId);
}

async function seedMissionBriefing(page: Page, missionId: string): Promise<void> {
  await seedMissionCheckpoint(page, missionId, 'briefing');
}

async function dismissMainMenu(page: Page): Promise<void> {
  const menu = page.locator('[data-main-menu]');
  await expect(menu).toBeVisible();
  const continueButton = page.locator('[data-main-menu-continue]');
  if (await continueButton.isEnabled()) {
    await continueButton.click();
  } else {
    await page.locator('[data-main-menu-new]').click();
  }
  await expect(menu).toBeHidden();
  await expect(page.locator('[data-base-dashboard]')).toBeVisible();
}

async function openSettings(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Configurações' }).click();
  await expect(page.locator('[data-app-root]')).toHaveAttribute('data-menu-state', 'settings');
  await expect(page.locator('[data-settings-form]')).toBeVisible();
}

async function enterBase(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('[data-app-root]')).toHaveAttribute('data-app-state', 'ready');
  await dismissMainMenu(page);
}

async function departCurrentMission(
  page: Page,
  options: { readonly waitForObjective?: boolean } = {},
): Promise<void> {
  const root = page.locator('[data-app-root]');
  await page.locator('[data-mission-action]').click();
  await expect(root).toHaveAttribute('data-navigation-state', 'map');
  const destination = page.locator(
    '[data-navigation-destination][data-mission-destination="true"]',
  );
  await expect(destination).toHaveCount(1);
  await destination.click();
  await expect(destination).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-navigation-confirm]').click();
  await expect(root).toHaveAttribute('data-navigation-state', 'travel');
  await expect(root).toHaveAttribute('data-mission-phase', 'outbound');
  if (options.waitForObjective !== false) {
    await expect(root).toHaveAttribute('data-navigation-state', 'encounter', { timeout: 5_000 });
    await expect(root).toHaveAttribute('data-mission-phase', 'objective');
  }
}

async function enterFirstMission(page: Page): Promise<void> {
  await enterBase(page);
  await departCurrentMission(page);
}

async function enterCombatMission(page: Page): Promise<void> {
  await seedMissionBriefing(page, 'vespa-combat-training');
  await dismissMainMenu(page);
  await departCurrentMission(page);
}

async function identifyEnemy(page: Page): Promise<void> {
  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-contact-awareness', 'detected');
  await page.keyboard.press('KeyT');
  await expect(root).toHaveAttribute('data-target-selected', 'true');
  await page.keyboard.press('KeyR');
  await expect(root).toHaveAttribute('data-scan-active', 'true');
  await expect(root).toHaveAttribute('data-contact-awareness', 'identified', { timeout: 8_000 });
}

async function openEnergyDrawer(page: Page): Promise<void> {
  const drawer = page.locator('[data-energy-panel]');
  if ((await drawer.getAttribute('open')) === null) {
    await drawer.locator('summary').click();
  }
  await expect(drawer).toHaveAttribute('open', '');
}

async function pauseFlightForUi(page: Page): Promise<void> {
  const root = page.locator('[data-app-root]');
  if ((await root.getAttribute('data-simulation-state')) === 'running') {
    await page.keyboard.press('Escape');
  }
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');
  await expect(root).toHaveAttribute('data-pointer-state', 'released');
}

async function resumeFlightFromUi(page: Page): Promise<void> {
  const root = page.locator('[data-app-root]');
  await page.getByRole('button', { name: /Retomar/ }).click();
  await expect(root).toHaveAttribute('data-simulation-state', 'running');
  await expect(root).toHaveAttribute('data-pointer-state', 'captured');
}

async function tabTo(page: Page, selector: string, maximumTabs = 30): Promise<void> {
  const target = page.locator(selector).first();
  for (let index = 0; index <= maximumTabs; index += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Não foi possível alcançar ${selector} somente com Tab.`);
}

async function approachAndBrake(page: Page, maximumDistance: number): Promise<void> {
  const root = page.locator('[data-app-root]');
  await page.locator('#game-canvas').focus();
  await page.keyboard.down('KeyW');
  await expect
    .poll(
      async () =>
        (await root.getAttribute('data-contact-observed')) === 'true' &&
        Number(await root.getAttribute('data-contact-distance')) < maximumDistance,
      { timeout: 12_000 },
    )
    .toBe(true);
  await page.keyboard.up('KeyW');
  await page.keyboard.down('Space');
  await expect
    .poll(async () => Number(await root.getAttribute('data-ship-speed')), { timeout: 8_000 })
    .toBeLessThan(3);
  await page.keyboard.up('Space');
}

async function alignSelectedTarget(page: Page): Promise<void> {
  const marker = page.locator('[data-target-tracker]');
  await expect(marker).toBeVisible();
  await page.locator('#game-canvas').focus();
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const box = await marker.boundingBox();
    if (box === null) throw new Error('Marcador de alvo deixou de estar visível.');
    const deltaX = box.x + box.width / 2 - page.viewportSize()!.width / 2;
    if (Math.abs(deltaX) < 80) return;
    const key = deltaX < 0 ? 'KeyA' : 'KeyD';
    await page.keyboard.down(key);
    await page.waitForTimeout(60);
    await page.keyboard.up(key);
  }
  throw new Error('Não foi possível centralizar o marcador de alvo.');
}

async function expectHudInsideViewport(page: Page): Promise<void> {
  const metrics = await page.evaluate(() => {
    const selectors = [
      '.objective-card',
      '.session-controls',
      '.player-status',
      '.target-card',
      '.combat-feedback',
      '.tactical-action-bar',
      '.energy-panel',
      '.diagnostics-drawer',
      '.terminal-banner',
      '.base-dashboard',
    ];
    const rectangles = selectors.flatMap((selector) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (element === null || element.hidden || getComputedStyle(element).visibility === 'hidden') {
        return [];
      }
      const rectangle = element.getBoundingClientRect();
      return [
        {
          bottom: rectangle.bottom,
          left: rectangle.left,
          right: rectangle.right,
          selector,
          top: rectangle.top,
        },
      ];
    });
    const overlaps: string[] = [];
    for (let leftIndex = 0; leftIndex < rectangles.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < rectangles.length; rightIndex += 1) {
        const left = rectangles[leftIndex];
        const right = rectangles[rightIndex];
        if (left === undefined || right === undefined) continue;
        if (
          left.left < right.right &&
          left.right > right.left &&
          left.top < right.bottom &&
          left.bottom > right.top
        ) {
          overlaps.push(`${left.selector} × ${right.selector}`);
        }
      }
    }
    return {
      outOfBounds: rectangles
        .filter(
          ({ bottom, left, right, top }) =>
            left < 0 || top < 0 || right > window.innerWidth || bottom > window.innerHeight,
        )
        .map(({ selector }) => selector),
      overlaps,
    };
  });
  expect(metrics.outOfBounds).toEqual([]);
  expect(metrics.overlaps).toEqual([]);
}

test('abre o menu principal acessível e entra na base preparada', async ({ page }, testInfo) => {
  await page.goto('/');

  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  const menu = page.locator('[data-main-menu]');
  const newTraining = page.locator('[data-main-menu-new]');
  await expect(menu).toBeVisible();
  await expect(root).toHaveAttribute('data-menu-state', 'home');
  await expect(newTraining).toBeFocused();
  await expect(page.locator('[data-main-menu-continue]')).toBeDisabled();
  await expect(page.locator('[data-main-menu-progress]')).toHaveText('Novo treinamento pronto');

  const initialZ = await root.getAttribute('data-ship-z');
  await page.keyboard.press('Digit2');
  await page.keyboard.press('KeyN');
  await page.keyboard.press('KeyW');
  await page.waitForTimeout(250);
  await expect(root).toHaveAttribute('data-ship-z', initialZ ?? '16.0000');
  await expect(root).toHaveAttribute('data-projectile-count', '0');

  await openSettings(page);
  await expect(menu).toContainText('Preferências da experiência');
  await page.keyboard.press('Escape');
  await expect(root).toHaveAttribute('data-menu-state', 'home');
  await expect(newTraining).toBeFocused();

  await page.getByRole('button', { name: 'Diagnóstico' }).click();
  await expect(page.locator('[data-main-menu-backend]')).toContainText('WebGL 2');
  await expect(page.locator('[data-main-menu-renderer]')).not.toHaveText('Verificando…');
  await page.getByRole('button', { name: /Voltar ao menu/ }).click();
  await page.getByRole('button', { name: 'Créditos e licenças' }).click();
  await expect(menu).toContainText('Nenhum asset, logo, música ou personagem de Star Trek');
  await expect(menu).toContainText('PlayCanvas Engine 2.21.4 · licença MIT');
  await expect(menu).toContainText('Manifesto v1: 1 asset, 1107 bytes');
  await page.keyboard.press('Escape');

  if (testInfo.project.name === 'Google Chrome') {
    await page.screenshot({ path: 'docs/screenshots/p1-main-menu-1280x720.png' });
  }
  await newTraining.click();
  await expect(menu).toBeHidden();
  const base = page.locator('[data-base-dashboard]');
  await expect(base).toBeVisible();
  await expect(base).toContainText('Reparo e suprimentos concluídos');
  await expect(base.locator('[data-base-mission-status]')).toHaveCount(3);
  await expect(base.locator('[data-base-mission-status="current"]')).toHaveCount(1);
  await expect(page.locator('[data-base-prepare]')).toBeFocused();
  await expect(page.locator('[data-diagnostic="backend"]')).toHaveText('WebGL 2');
  await expect(page.locator('[data-diagnostic="renderer"]')).not.toHaveText('Verificando…');
  await expect(page.locator('[data-diagnostic="preset"]')).toContainText(/Baixo|Médio/);
  await expect(page.locator('[data-diagnostic="fps"]')).toHaveText(/\d+/);
  await expect(page.locator('#game-canvas')).toBeVisible();
  await expect(page.locator('[data-flight-hud]')).toBeVisible();
  await expect(root).toHaveAttribute('data-navigation-state', 'base');
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');
  await expect(page.locator('[data-flight-lod]')).toContainText('Base Aurora');
  await expect(page.locator('[data-combat-panel]')).toBeHidden();
});

test('mantém fallback visível para asset ausente e recupera sem reiniciar o jogo', async ({
  page,
}) => {
  let manifestUnavailable = true;
  await page.route('**/assets/asset-manifest.json', async (route) => {
    if (manifestUnavailable) {
      await route.fulfill({
        body: '{"error":"falha simulada"}',
        contentType: 'application/json',
        status: 503,
      });
      return;
    }
    await route.continue();
  });

  await page.goto('/');
  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  await expect(root).toHaveAttribute('data-asset-state', 'fallback');
  await expect(page.locator('[data-asset-status]')).toContainText('Substituto seguro ativo');
  await expect(page.locator('[data-asset-status]')).toContainText('HTTP 503');
  await expect(page.locator('[data-brand-mark]')).toBeHidden();
  await expect(page.locator('[data-brand-mark-fallback]')).toBeVisible();

  manifestUnavailable = false;
  await page.locator('[data-asset-retry]').click();
  await expect(root).toHaveAttribute('data-asset-state', 'ready');
  await expect(root).toHaveAttribute('data-asset-count', '1');
  await expect(page.locator('[data-brand-mark]')).toBeVisible();
  await expect(page.locator('[data-asset-retry]')).toBeHidden();
});

test('permanece jogável sem internet após a carga e não instala service worker', async ({
  context,
  page,
}) => {
  const unexpectedErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') unexpectedErrors.push(message.text());
  });
  page.on('pageerror', (error) => unexpectedErrors.push(error.message));
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol !== 'blob:' && url.origin !== 'http://127.0.0.1:4173') {
      externalRequests.push(request.url());
    }
  });

  await page.goto('/');
  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  await expect(root).toHaveAttribute('data-asset-state', 'ready');
  expect(
    await page.evaluate(async () =>
      'serviceWorker' in navigator ? (await navigator.serviceWorker.getRegistrations()).length : 0,
    ),
  ).toBe(0);

  await context.setOffline(true);
  await dismissMainMenu(page);
  await departCurrentMission(page);
  await identifyEnemy(page);
  await expect(root).toHaveAttribute('data-mission-objective-completed', 'true');
  await pauseFlightForUi(page);
  await page.locator('[data-mission-action]').click();
  await expect(root).toHaveAttribute('data-mission-phase', 'completed', { timeout: 4_000 });
  await expect(root).toHaveAttribute('data-save-state', 'saved');
  await context.setOffline(false);

  await page.reload();
  await expect(root).toHaveAttribute('data-save-state', 'loaded');
  expect(externalRequests).toEqual([]);
  expect(unexpectedErrors).toEqual([]);
});

test('persiste configurações separadas do save e aplica HUD e teclas imediatamente', async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  await page.goto('/');
  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  const saveStateBefore = await root.getAttribute('data-save-state');
  const snapshotsBefore = await countStoredSaveSnapshots(page);
  const activePreset = await root.getAttribute('data-graphics-preset');
  const nextPreset = activePreset === 'high' ? 'low' : 'high';

  await openSettings(page);
  const settingsStatus = page.locator('[data-settings-status]');
  await expect(settingsStatus).toHaveAttribute('data-settings-status', 'defaulted');
  await page.locator('[data-setting="graphicsPresetId"]').selectOption(nextPreset);
  await page.locator('[data-setting="hudScalePercent"]').selectOption('110');
  await page.locator('[data-setting="reduceFlashes"]').check();
  await page.locator('[data-setting="reduceCameraShake"]').check();
  await page.locator('[data-setting="particleDensity"]').selectOption('minimal');
  await page.locator('[data-setting="masterVolumePercent"]').fill('55');
  await page.locator('[data-setting="masterVolumePercent"]').dispatchEvent('change');
  await page.locator('[data-setting="mouseSensitivity"]').fill('1.5');
  await page.locator('[data-setting="mouseSensitivity"]').dispatchEvent('change');
  await page.locator('[data-setting="invertVerticalLook"]').check();
  await page.locator('[data-setting="audioMuted"]').check();
  await page.locator('[data-setting-binding="select-target"]').selectOption('KeyY');

  await expect(settingsStatus).toHaveAttribute('data-settings-status', 'saved');
  await expect(settingsStatus).toHaveAttribute('data-requires-reload', 'true');
  await expect(settingsStatus).toContainText('Recarregue para aplicar o preset gráfico');
  await expect(root).toHaveAttribute('data-hud-scale', '110');
  await expect(root).toHaveAttribute('data-particle-density', 'minimal');
  await expect(root).toHaveAttribute('data-reduce-flashes', 'true');
  await expect(root).toHaveAttribute('data-reduce-camera-shake', 'true');
  await expect(page.locator('[data-setting-output="masterVolumePercent"]')).toHaveText('55%');
  await expect(page.locator('[data-setting-output="mouseSensitivity"]')).toHaveText('1,5×');
  await expect(page.locator('[data-combat-action="select"]')).toHaveText('Selecionar (Y)');
  await expect(page.locator('[data-combat-action="select"]')).toHaveAttribute(
    'aria-keyshortcuts',
    'Y',
  );
  expect(await root.getAttribute('data-save-state')).toBe(saveStateBefore);
  expect(await countStoredSaveSnapshots(page)).toBe(snapshotsBefore);

  if (testInfo.project.name === 'Google Chrome') {
    await page.screenshot({ path: 'docs/screenshots/p1-settings-1280x720.png' });
  }

  await page.reload();
  await expect(root).toHaveAttribute('data-settings-state', 'loaded');
  await expect(root).toHaveAttribute('data-graphics-preset', nextPreset);
  await expect(root).toHaveAttribute('data-hud-scale', '110');
  await openSettings(page);
  await expect(settingsStatus).toHaveAttribute('data-requires-reload', 'false');
  await expect(page.locator('[data-setting="hudScalePercent"]')).toHaveValue('110');
  await expect(page.locator('[data-setting="masterVolumePercent"]')).toHaveValue('55');
  await expect(page.locator('[data-setting="audioMuted"]')).toBeChecked();
  await expect(page.locator('[data-setting-binding="select-target"]')).toHaveValue('KeyY');

  await page.keyboard.press('Escape');
  await dismissMainMenu(page);
  await expect(page.locator('[data-base-dashboard]')).toBeVisible();
  for (const viewport of [
    { height: 720, width: 1280 },
    { height: 900, width: 1600 },
  ]) {
    await page.setViewportSize(viewport);
    await expectHudInsideViewport(page);
  }

  await departCurrentMission(page);
  await expect(page.locator('[data-objective-text]')).toContainText('Pressione Y para selecionar');
  await expect(root).toHaveAttribute('data-contact-awareness', 'detected');
  await page.keyboard.press('KeyT');
  await expect(root).toHaveAttribute('data-target-selected', 'false');
  await page.keyboard.press('KeyY');
  await expect(root).toHaveAttribute('data-target-selected', 'true');
  for (const viewport of [
    { height: 720, width: 1280 },
    { height: 900, width: 1600 },
  ]) {
    await page.setViewportSize(viewport);
    await expectHudInsideViewport(page);
  }
  if (testInfo.project.name === 'Google Chrome') {
    await page.setViewportSize({ height: 720, width: 1280 });
    await page.locator('[data-combat-action="scan"]').focus();
    await expectHudInsideViewport(page);
    await page.screenshot({ path: 'docs/screenshots/p1-accessibility-hud-1280x720.png' });
  }
  expect(await countStoredSaveSnapshots(page)).toBeGreaterThan(snapshotsBefore);
});

test('só inicia Web Audio após gesto explícito e limita sua sessão por mute', async ({ page }) => {
  await page.addInitScript(() => {
    const trackedWindow = window as Window & { __audioContextCreations?: number };
    trackedWindow.__audioContextCreations = 0;
    const NativeAudioContext = window.AudioContext;
    if (typeof NativeAudioContext !== 'function') return;
    class CountingAudioContext extends NativeAudioContext {
      constructor(options?: AudioContextOptions) {
        super(options);
        trackedWindow.__audioContextCreations = (trackedWindow.__audioContextCreations ?? 0) + 1;
      }
    }
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: CountingAudioContext,
    });
  });
  await page.goto('/');
  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  await expect(root).toHaveAttribute('data-audio-state', 'locked');
  expect(
    await page.evaluate(
      () => (window as Window & { __audioContextCreations?: number }).__audioContextCreations,
    ),
  ).toBe(0);

  await openSettings(page);
  expect(
    await page.evaluate(
      () => (window as Window & { __audioContextCreations?: number }).__audioContextCreations,
    ),
  ).toBe(0);
  await page.locator('[data-audio-enable]').click();
  await expect(root).toHaveAttribute('data-audio-state', 'ready');
  expect(
    await page.evaluate(
      () => (window as Window & { __audioContextCreations?: number }).__audioContextCreations,
    ),
  ).toBe(1);
  await expect(page.locator('[data-audio-status]')).toHaveText('Áudio ativo.');
  await expect
    .poll(async () => Number(await root.getAttribute('data-audio-voices')))
    .toBeLessThanOrEqual(10);

  await page.locator('[data-setting="audioMuted"]').check();
  await expect(root).toHaveAttribute('data-audio-state', 'muted');
  await expect(root).toHaveAttribute('data-audio-voices', '0');
  await page.reload();
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  await openSettings(page);
  await expect(page.locator('[data-setting="audioMuted"]')).toBeChecked();
  await page.locator('[data-audio-enable]').click();
  await expect(root).toHaveAttribute('data-audio-state', 'muted');
});

test('mantém o jogo utilizável quando Web Audio está indisponível', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: undefined });
  });
  await page.goto('/');
  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  await openSettings(page);
  await page.locator('[data-audio-enable]').click();
  await expect(root).toHaveAttribute('data-audio-state', 'unavailable');
  await expect(page.locator('[data-audio-status]')).toContainText('jogo continua sem som');
  await page.keyboard.press('Escape');
  await dismissMainMenu(page);
  await expect(page.locator('[data-base-dashboard]')).toBeVisible();
  await expect(root).toHaveAttribute('data-navigation-state', 'base');
});

test('preserva o save ao recuperar configuração inválida por ação explícita', async ({ page }) => {
  await page.goto('/');
  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  const missionIdBefore = await root.getAttribute('data-mission-id');
  const missionPhaseBefore = await root.getAttribute('data-mission-phase');
  const snapshotsBefore = await countStoredSaveSnapshots(page);
  await page.evaluate(
    ({ key }) =>
      localStorage.setItem(
        key,
        JSON.stringify({ schemaVersion: 99, settings: { hudScalePercent: 1_000 } }),
      ),
    { key: SETTINGS_STORAGE_KEY },
  );

  await page.reload();
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  await expect(root).toHaveAttribute('data-settings-state', 'invalid');
  await expect(root).toHaveAttribute('data-save-state', 'loaded');
  expect(await root.getAttribute('data-mission-id')).toBe(missionIdBefore);
  expect(await root.getAttribute('data-mission-phase')).toBe(missionPhaseBefore);
  expect(await countStoredSaveSnapshots(page)).toBe(snapshotsBefore);
  await openSettings(page);
  await expect(page.locator('[data-settings-status]')).toContainText(
    'Configuração inválida detectada',
  );
  await expect(page.locator('[data-setting="hudScalePercent"]')).toHaveValue('100');

  await page.locator('[data-settings-reset]').click();
  await expect(root).toHaveAttribute('data-settings-state', 'reset');
  const recovered = await page.evaluate(
    ({ key }) => JSON.parse(localStorage.getItem(key) ?? 'null') as unknown,
    { key: SETTINGS_STORAGE_KEY },
  );
  expect(recovered).toMatchObject({ schemaVersion: 2 });
  expect(await countStoredSaveSnapshots(page)).toBe(snapshotsBefore);
});

test('reduções visuais limitam os VFX reais do raio trator', async ({ page }) => {
  await seedMissionBriefing(page, 'iris-assistance');
  const root = page.locator('[data-app-root]');
  await openSettings(page);
  await page.locator('[data-setting="reduceFlashes"]').check();
  await page.locator('[data-setting="reduceCameraShake"]').check();
  await page.locator('[data-setting="particleDensity"]').selectOption('minimal');
  await page.keyboard.press('Escape');
  await dismissMainMenu(page);
  await departCurrentMission(page);
  await identifyEnemy(page);
  await approachAndBrake(page, 68);
  await page.keyboard.press('Digit3');
  if ((await root.getAttribute('data-tractor-active')) !== 'true') {
    await alignSelectedTarget(page);
    await expect
      .poll(async () => Number(await root.getAttribute('data-weapon-charge')))
      .toBeGreaterThanOrEqual(2);
    await page.keyboard.press('Digit3');
  }
  await expect(root).toHaveAttribute('data-tractor-active', 'true');
  await expect(root).toHaveAttribute('data-vfx-kind', 'tractor');
  await expect(root).toHaveAttribute('data-reduce-flashes', 'true');
  await expect(root).toHaveAttribute('data-reduce-camera-shake', 'true');
  await expect
    .poll(async () => Number(await root.getAttribute('data-active-vfx')))
    .toBeGreaterThan(0);
  expect(Number(await root.getAttribute('data-active-vfx'))).toBeLessThanOrEqual(2);
});

test('continua o checkpoint correto e confirma antes de iniciar novo treinamento', async ({
  page,
}) => {
  await seedMissionBriefing(page, 'iris-assistance');
  const root = page.locator('[data-app-root]');
  const menu = page.locator('[data-main-menu]');
  const dialog = page.locator('[data-new-training-dialog]');
  await expect(menu).toBeVisible();
  await expect(page.locator('[data-main-menu-progress]')).toContainText('Socorro no Anel de Íris');
  await expect(page.locator('[data-main-menu-continue]')).toBeEnabled();

  const snapshotsBeforeCancel = await countStoredSaveSnapshots(page);
  await page.locator('[data-main-menu-new]').click();
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Substituir o progresso atual');
  await page.locator('[data-new-training-cancel]').click();
  await expect(dialog).toBeHidden();
  expect(await countStoredSaveSnapshots(page)).toBe(snapshotsBeforeCancel);
  await expect(root).toHaveAttribute('data-mission-id', 'iris-assistance');

  await page.locator('[data-main-menu-continue]').click();
  await expect(menu).toBeHidden();
  await expect(root).toHaveAttribute('data-mission-id', 'iris-assistance');
  await expect(page.locator('[data-base-mission-status="completed"]')).toHaveCount(1);
  await expect(page.locator('[data-base-mission-status="current"]')).toContainText(
    'Socorro no Anel de Íris',
  );

  await page.locator('[data-base-menu]').click();
  await expect(menu).toBeVisible();
  await page.locator('[data-main-menu-new]').click();
  await expect(dialog).toBeVisible();
  await page.locator('[data-new-training-confirm]').click();
  await expect(menu).toBeHidden();
  await expect(root).toHaveAttribute('data-mission-id', 'nereida-survey');
  await expect(root).toHaveAttribute('data-mission-phase', 'briefing');
  await expect(root).toHaveAttribute('data-save-state', 'saved');

  await page.reload();
  await expect(root).toHaveAttribute('data-save-state', 'loaded');
  await expect(page.locator('[data-main-menu-progress]')).toContainText('Levantamento de Nereida');
  await page.locator('[data-main-menu-continue]').click();
  await expect(root).toHaveAttribute('data-mission-id', 'nereida-survey');
  await expect(page.locator('[data-base-mission-status="current"]')).toContainText(
    'Levantamento de Nereida',
  );
});

test('mantém menu e painel da base contidos em 1280x720 e 1600x900', async ({ page }, testInfo) => {
  for (const viewport of [
    { height: 720, width: 1280 },
    { height: 900, width: 1600 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const root = page.locator('[data-app-root]');
    await expect(root).toHaveAttribute('data-app-state', 'ready');
    const menuPanel = page.locator('.main-menu__panel');
    const menuBox = await menuPanel.boundingBox();
    expect(menuBox).not.toBeNull();
    expect(menuBox!.x).toBeGreaterThanOrEqual(0);
    expect(menuBox!.y).toBeGreaterThanOrEqual(0);
    expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(viewport.width);
    expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(viewport.height);

    await dismissMainMenu(page);
    await expectHudInsideViewport(page);
    if (viewport.width === 1600 && testInfo.project.name === 'Google Chrome') {
      await page.screenshot({ path: 'docs/screenshots/p1-base-dashboard-1600x900.png' });
    }
  }
});

test('mantém a base segura e percorre mapa, viagem, encontro e retorno', async ({
  page,
}, testInfo) => {
  await enterBase(page);
  const root = page.locator('[data-app-root]');
  const missionAction = page.locator('[data-mission-action]');
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  await expect(root).toHaveAttribute('data-navigation-state', 'base');
  await expect(root).toHaveAttribute('data-current-location', 'Base Aurora');
  await expect(root).toHaveAttribute('data-active-vfx', '0');
  await page.keyboard.press('Digit2');
  await page.keyboard.press('KeyN');
  await page.waitForTimeout(500);
  await expect(root).toHaveAttribute('data-navigation-state', 'base');
  await expect(root).toHaveAttribute('data-torpedo-ammo', '6');
  await expect(root).toHaveAttribute('data-projectile-count', '0');
  await expect(page.locator('[data-flight-hull]')).toContainText('100%');

  await missionAction.click();
  const map = page.locator('[data-system-map]');
  await expect(map).toBeVisible();
  await expect(root).toHaveAttribute('data-navigation-state', 'map');
  await expect(page.locator('[data-navigation-destination]')).toHaveCount(6);
  await expect(
    page.locator('[data-navigation-destination][data-navigation-kind="point-of-interest"]'),
  ).toHaveCount(2);
  const pointOfInterest = page
    .locator('[data-navigation-destination][data-navigation-kind="point-of-interest"]')
    .first();
  await pointOfInterest.click();
  await expect(page.locator('[data-navigation-confirm]')).toBeDisabled();
  await expect(page.locator('[data-navigation-guidance]')).toContainText('não é o destino');

  const missionDestination = page.locator(
    '[data-navigation-destination][data-mission-destination="true"]',
  );
  await missionDestination.click();
  await expect(page.locator('[data-navigation-confirm]')).toBeEnabled();
  await expect(page.locator('[data-navigation-route]')).toContainText('Corredor de Nereida');
  await page.locator('[data-navigation-confirm]').click();
  await expect(root).toHaveAttribute('data-navigation-state', 'travel');
  await expect(page.locator('[data-travel-presentation]')).toBeVisible();
  await expect(page.locator('[data-combat-panel]')).toBeHidden();
  await expect(root).toHaveAttribute('data-active-vfx', '0');
  if (testInfo.project.name === 'Google Chrome') {
    await page.waitForTimeout(250);
    await page.screenshot({ path: 'docs/screenshots/p1-travel-1280x720.png' });
  }

  await expect(root).toHaveAttribute('data-navigation-state', 'encounter', { timeout: 5_000 });
  await expect(root).toHaveAttribute('data-current-location', 'Corredor de Nereida');
  await expect(page.locator('[data-travel-presentation]')).toBeHidden();
  await expect(page.locator('[data-combat-panel]')).toBeVisible();
  await identifyEnemy(page);
  await expect(root).toHaveAttribute('data-mission-objective-completed', 'true');

  await pauseFlightForUi(page);
  await missionAction.click();
  await expect(root).toHaveAttribute('data-navigation-state', 'travel');
  await expect(root).toHaveAttribute('data-mission-phase', 'returning');
  await expect(page.locator('[data-travel-presentation]')).toBeVisible();
  await expect(root).toHaveAttribute('data-navigation-state', 'base', { timeout: 5_000 });
  await expect(root).toHaveAttribute('data-mission-phase', 'completed');
  await expect(root).toHaveAttribute('data-current-location', 'Base Aurora');
  await expect(root).toHaveAttribute('data-active-vfx', '0');
  await expect(root).toHaveAttribute('data-torpedo-ammo', '6');
  await expect(root).toHaveAttribute('data-ship-z', '16.0000');
  await expect(page.locator('[data-combat-panel]')).toBeHidden();
});

test('executa o cenário determinístico P0.5 com preset e frametimes explícitos', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/?benchmark=1&preset=medium&duration=1&warmup=1');

  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  await expect(root).toHaveAttribute('data-benchmark-mode', 'active');
  await expect(root).toHaveAttribute('data-save-state', 'disabled');
  await expect(root).toHaveAttribute('data-benchmark-preset', 'medium');
  await expect(page.locator('[data-benchmark-load]')).toHaveText(
    '6 naves · 144 asteroides · 900 estrelas',
  );
  await expect(root).toHaveAttribute('data-benchmark-state', 'complete', { timeout: 10_000 });
  await expect
    .poll(async () => Number(await root.getAttribute('data-benchmark-average-fps')))
    .toBeGreaterThan(0);
  await expect
    .poll(async () => Number(await root.getAttribute('data-benchmark-p50-ms')))
    .toBeGreaterThan(0);
  await expect
    .poll(async () => Number(await root.getAttribute('data-benchmark-p95-ms')))
    .toBeGreaterThan(0);
  await expect
    .poll(async () => Number(await root.getAttribute('data-benchmark-p99-ms')))
    .toBeGreaterThan(0);
  await expect(page.locator('[data-benchmark-result]')).toContainText(/FPS médios · p50/);
});

test('mostra instruções acionáveis quando WebGL 2 não está disponível', async ({ page }) => {
  await page.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value(this: HTMLCanvasElement, contextId: string, ...options: unknown[]) {
        if (contextId === 'webgl2') {
          return null;
        }

        return Reflect.apply(originalGetContext, this, [contextId, ...options]);
      },
    });
  });

  await page.goto('/');

  await expect(page.locator('[data-app-root]')).toHaveAttribute('data-app-state', 'blocked');
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('WebGL 2 indisponível');
  await expect(alert).toContainText('Ative a aceleração gráfica');
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
});

test('não confunde renderizador não informado com renderização por software', async ({ page }) => {
  await page.addInitScript(() => {
    const originalGetExtension = WebGL2RenderingContext.prototype.getExtension;
    Object.defineProperty(WebGL2RenderingContext.prototype, 'getExtension', {
      configurable: true,
      value(this: WebGL2RenderingContext, extensionName: string) {
        if (extensionName === 'WEBGL_debug_renderer_info') {
          return null;
        }

        return Reflect.apply(originalGetExtension, this, [extensionName]);
      },
    });
  });

  await page.goto('/');

  await expect(page.locator('[data-app-root]')).toHaveAttribute('data-graphics-state', 'degraded');
  await dismissMainMenu(page);
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('Renderizador não confirmado');
  await expect(alert).toContainText('não significa renderização por software');
  await expect(alert).not.toContainText('A renderização está sendo feita por software');
});

test('controla a nave pelo teclado', async ({ page }) => {
  await enterFirstMission(page);
  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-simulation-state', 'running');
  const initialZ = Number(await root.getAttribute('data-ship-z'));

  await page.keyboard.down('KeyW');
  await expect.poll(() => root.getAttribute('data-ship-speed')).not.toBe('0.0000');
  await page.waitForTimeout(350);
  await page.keyboard.up('KeyW');

  await expect
    .poll(async () => Number(await root.getAttribute('data-ship-z')))
    .toBeLessThan(initialZ);
});

test('detecta, seleciona e identifica contato pelo teclado sem conhecimento antecipado', async ({
  page,
}) => {
  await enterFirstMission(page);
  const root = page.locator('[data-app-root]');
  const combatPanel = page.locator('[data-combat-panel]');
  await expect(combatPanel).toBeVisible();
  await expect(root).toHaveAttribute('data-enemy-hull', 'unknown');

  await identifyEnemy(page);

  await expect(page.locator('[data-combat-contact]')).toContainText('Sonda de Nereida');
  await expect(root).not.toHaveAttribute('data-enemy-hull', 'unknown');
  await expect(root).not.toHaveAttribute('data-enemy-ai', 'unknown');
  await page.keyboard.press('KeyX');
  await expect(root).toHaveAttribute('data-target-selected', 'false');
  await expect(root).toHaveAttribute('data-scan-active', 'false');
});

test('mantém subsistemas e quatro setores no cartão do jogador sem vazar dados do alvo', async ({
  page,
}) => {
  await enterFirstMission(page);
  const playerStatus = page.locator('.player-status');
  const targetCard = page.locator('.target-card');
  const sectors = playerStatus.locator('[data-shield-sector]');

  await expect(playerStatus.locator('[data-combat-subsystems]')).toContainText(
    /MOT \d+ · ARM \d+ · ESC \d+ · SEN \d+/,
  );
  await expect(targetCard.locator('[data-combat-subsystems]')).toHaveCount(0);
  await expect(targetCard.locator('[data-combat-enemy-state]')).toHaveText('Dados indisponíveis');
  await expect(sectors).toHaveCount(4);
  await expect(playerStatus.locator('[data-shield-sector="front"]')).toContainText(/\d+/);
  await expect(playerStatus.locator('[data-shield-sector="rear"]')).toContainText(/\d+/);
  await expect(playerStatus.locator('[data-shield-sector="port"]')).toContainText(/\d+/);
  await expect(playerStatus.locator('[data-shield-sector="starboard"]')).toContainText(/\d+/);
  await expect(playerStatus.getByTitle('Frente')).toBeVisible();
  await expect(playerStatus.getByTitle('Trás')).toBeVisible();
  await expect(playerStatus.getByTitle('Bombordo')).toBeVisible();
  await expect(playerStatus.getByTitle('Estibordo')).toBeVisible();
});

test('ordena o DOM tático antes de energia e sessão sem landmarks duplicados', async ({ page }) => {
  await enterFirstMission(page);
  const structure = await page.evaluate(() => {
    const selectors = [
      '.objective-card',
      '.tactical-action-bar',
      '.energy-panel',
      '.session-controls',
    ];
    const elements = selectors.map((selector) => {
      const element = document.querySelector(selector);
      if (element === null) throw new Error(`Elemento ausente: ${selector}`);
      return element;
    });
    return {
      inOrder: elements
        .slice(1)
        .every((element, index) =>
          Boolean(
            (elements[index]?.compareDocumentPosition(element) ?? 0) &
            Node.DOCUMENT_POSITION_FOLLOWING,
          ),
        ),
      positiveTabIndexes: Array.from(document.querySelectorAll<HTMLElement>('[tabindex]')).filter(
        (element) => element.tabIndex > 0,
      ).length,
    };
  });

  expect(structure).toEqual({ inOrder: true, positiveTabIndexes: 0 });
  await expect(page.getByRole('region', { name: 'Exploradora Aurora' })).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'Controles táticos' })).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'Controles da sessão' })).toHaveCount(1);
});

test('percorre menu, configurações e painéis modais com ordem de foco contida', async ({
  page,
}) => {
  await page.goto('/');
  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  const initialAction = page.locator(
    '[data-main-menu-continue]:not(:disabled), [data-main-menu-new]:not(:disabled)',
  );
  await expect(initialAction.first()).toBeFocused();

  await tabTo(page, '[data-main-menu-open="settings"]');
  await page.keyboard.press('Enter');
  const firstSetting = page.locator('[data-setting="graphicsPresetId"]');
  await expect(firstSetting).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(
    page.locator('[data-main-menu-view="settings"] [data-main-menu-back]'),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(firstSetting).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(root).toHaveAttribute('data-menu-state', 'home');

  await tabTo(page, '[data-main-menu-open="diagnostics"]');
  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('data-menu-state', 'diagnostics');
  await expect(
    page.locator('[data-main-menu-view="diagnostics"] [data-main-menu-back]'),
  ).toBeFocused();
  await page.keyboard.press('Escape');

  await tabTo(page, '[data-main-menu-open="credits"]');
  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('data-menu-state', 'credits');
  await expect(page.locator('[data-main-menu-view="credits"] [data-main-menu-back]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(root).toHaveAttribute('data-menu-state', 'home');
});

test('mantém diário idempotente do progresso 0/3 a 3/3 após reload', async ({ page }, testInfo) => {
  await page.setViewportSize({ height: 720, width: 1280 });
  await page.goto('/');
  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  await page.getByRole('button', { name: 'Diário de missão' }).click();
  const journal = page.getByRole('region', { name: 'Diário de objetivos e descobertas' });
  await expect(root).toHaveAttribute('data-menu-state', 'journal');
  await expect(journal).toBeVisible();
  await expect(page.locator('[data-journal-progress]')).toHaveText('0/3 missões concluídas');
  await expect(page.locator('[data-journal-mission-status="current"]')).toHaveCount(1);
  await expect(page.locator('[data-journal-mission-status="locked"]')).toHaveCount(2);
  await expect(page.locator('[data-journal-mission-status="completed"]')).toHaveCount(0);
  await expect(page.locator('[data-journal-objective]')).toContainText('Treino de sensores');

  await seedMissionCheckpoint(page, 'vespa-combat-training', 'completed');
  await page.getByRole('button', { name: 'Diário de missão' }).click();
  await expect(page.locator('[data-journal-progress]')).toHaveText('3/3 missões concluídas');
  await expect(page.locator('[data-journal-mission-status="completed"]')).toHaveCount(3);
  await expect(page.locator('[data-journal-mission-id="nereida-survey"]')).toContainText(
    'rota estável no corredor de Nereida',
  );
  await expect(page.locator('[data-journal-mission-id="iris-assistance"]')).toContainText(
    'estabilizada a distância',
  );
  await expect(page.locator('[data-journal-mission-id="vespa-combat-training"]')).toContainText(
    'defesa coordenada do corredor Aurora',
  );
  const entryIds = await page
    .locator('[data-journal-mission-id]')
    .evaluateAll((entries) =>
      entries.map((entry) => (entry as HTMLElement).dataset.journalMissionId),
    );
  expect(new Set(entryIds).size).toBe(3);
  if (testInfo.project.name === 'Google Chrome') {
    await page.screenshot({ path: 'docs/screenshots/p1-journal-1280x720.png' });
  }

  await page.reload();
  await expect(root).toHaveAttribute('data-save-state', 'loaded');
  await page.getByRole('button', { name: 'Diário de missão' }).click();
  await expect(page.locator('[data-journal-progress]')).toHaveText('3/3 missões concluídas');
  await expect(page.locator('[data-journal-mission-id]')).toHaveCount(3);
  await expect(page.locator('[data-journal-mission-status="completed"]')).toHaveCount(3);

  await page.getByRole('button', { name: /Voltar ao menu/ }).click();
  await page.locator('[data-main-menu-continue]').click();
  await page.locator('[data-base-journal]').click();
  await expect(root).toHaveAttribute('data-menu-state', 'journal');
  await expect(page.locator('[data-main-menu-view="journal"] [data-main-menu-back]')).toBeFocused();
});

test('percorre a partida e opera o HUD apenas com teclado', async ({ page }) => {
  await page.goto('/');
  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  const initialAction = page.locator(
    '[data-main-menu-continue]:not(:disabled), [data-main-menu-new]:not(:disabled)',
  );
  await expect(initialAction.first()).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-base-prepare]')).toBeFocused();

  await page.keyboard.press('Enter');
  const map = page.getByRole('dialog', { name: 'Sistema Hélios' });
  await expect(map).toBeVisible();
  const destination = page.locator(
    '[data-navigation-destination][data-mission-destination="true"]',
  );
  await expect(destination).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(destination).toHaveAttribute('aria-pressed', 'true');
  await tabTo(page, '[data-navigation-confirm]');
  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('data-navigation-state', 'travel');
  await expect(page.locator('[data-travel-presentation]')).toBeFocused();
  await expect(root).toHaveAttribute('data-navigation-state', 'encounter', { timeout: 5_000 });
  await expect(page.locator('#game-canvas')).toBeFocused();

  await page.keyboard.press('KeyT');
  await expect(root).toHaveAttribute('data-target-selected', 'true');
  await page.keyboard.press('KeyR');
  await expect(root).toHaveAttribute('data-scan-active', 'true');
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-combat-action="select"]')).toBeFocused();
  await tabTo(page, '[data-energy-panel] > summary');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-energy-panel]')).toHaveAttribute('open', '');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Equilíbrio' })).toBeFocused();
  await page.keyboard.press('Enter');
  await tabTo(page, '[data-flight-pause]');
  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');
  await expect(page.getByRole('button', { name: /Retomar/ })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('data-simulation-state', 'running');
});

test('expõe nomes completos e anúncios deduplicados sem depender apenas de cor', async ({
  page,
}) => {
  await enterFirstMission(page);
  const root = page.locator('[data-app-root]');
  await expect(page.getByRole('region', { name: 'Comando de missão' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Energia da nave' })).toBeVisible();
  await expect(page.locator('#game-canvas')).toHaveAttribute(
    'aria-describedby',
    'flight-keyboard-help',
  );
  await expect(page.locator('[data-combat-action="select"]')).toHaveAttribute(
    'aria-keyshortcuts',
    'T',
  );
  await expect(page.locator('[data-shield-sector="front"]')).toHaveAttribute(
    'aria-label',
    /Escudo frontal: \d+ por cento/,
  );
  await expect(page.locator('[data-combat-subsystems]')).toHaveAttribute(
    'aria-label',
    /Motores \d+ por cento; armas \d+ por cento/,
  );
  await expect(page.locator('[data-energy-allocation="engines"]')).toHaveAttribute(
    'aria-label',
    /Energia de motores: \d+\.\d por cento/,
  );
  await expect(page.locator('[data-live-polite]')).toContainText('Objetivo:');
  await expect(root).toHaveAttribute('data-last-announcement-key', /mission\|/);

  const steadyStateMutations = await page.locator('[data-live-polite]').evaluate(
    (element) =>
      new Promise<number>((resolve) => {
        let mutations = 0;
        const observer = new MutationObserver((records) => {
          mutations += records.length;
        });
        observer.observe(element, { characterData: true, childList: true, subtree: true });
        window.setTimeout(() => {
          observer.disconnect();
          resolve(mutations);
        }, 650);
      }),
  );
  expect(steadyStateMutations).toBe(0);

  await page.keyboard.press('KeyT');
  await expect(page.locator('[data-live-polite]')).toContainText(
    'Contato selecionado. Inicie o scan para identificar.',
  );
  await expect(root).toHaveAttribute('data-last-announcement-key', /combat-feedback\|/);
});

test('mantém contraste textual WCAG AA nos presets baixo, médio e alto', async ({ page }) => {
  for (const preset of ['low', 'medium', 'high'] as const) {
    await page.goto(`/?preset=${preset}`);
    const root = page.locator('[data-app-root]');
    await expect(root).toHaveAttribute('data-app-state', 'ready');
    await expect(root).toHaveAttribute('data-graphics-preset', preset);
    const ratios = await root.evaluate((element) => {
      const styles = getComputedStyle(element);
      const parseColor = (value: string): readonly [number, number, number] => {
        const probe = document.createElement('span');
        probe.style.color = value;
        document.body.append(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        const channels = resolved
          .match(/[\d.]+/g)
          ?.slice(0, 3)
          .map(Number);
        if (channels === undefined || channels.length !== 3) {
          throw new Error(`Cor não resolvida no teste: ${value}.`);
        }
        return [channels[0]!, channels[1]!, channels[2]!];
      };
      const luminance = (color: readonly [number, number, number]): number => {
        const [red, green, blue] = color.map((channel) => {
          const normalized = channel / 255;
          return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        });
        return red! * 0.2126 + green! * 0.7152 + blue! * 0.0722;
      };
      const ratio = (foreground: string, background: string): number => {
        const foregroundLuminance = luminance(parseColor(foreground));
        const backgroundLuminance = luminance(parseColor(background));
        const lighter = Math.max(foregroundLuminance, backgroundLuminance);
        const darker = Math.min(foregroundLuminance, backgroundLuminance);
        return (lighter + 0.05) / (darker + 0.05);
      };
      const panelBackground = '#06111d';
      return {
        data: ratio(styles.getPropertyValue('--hud-data'), panelBackground),
        danger: ratio(styles.getPropertyValue('--hud-danger'), panelBackground),
        secondary: ratio(styles.getPropertyValue('--hud-secondary'), panelBackground),
        text: ratio(styles.getPropertyValue('--hud-text'), panelBackground),
        warning: ratio(styles.getPropertyValue('--hud-warning'), panelBackground),
      };
    });
    for (const value of Object.values(ratios)) expect(value).toBeGreaterThanOrEqual(4.5);
  }
});

test('feixe, torpedo e raio trator têm resultados e restrições distintos', async ({
  page,
}, testInfo) => {
  test.setTimeout(50_000);
  await enterCombatMission(page);
  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-player-visual-damage', 'intact');
  await identifyEnemy(page);
  await expect(root).toHaveAttribute('data-remote-visual-damage', 'intact');

  await page.keyboard.press('Digit3');
  await expect(page.locator('[data-combat-feedback]')).toContainText('fora do alcance');

  await approachAndBrake(page, 68);
  await page.keyboard.press('Digit3');
  if ((await root.getAttribute('data-tractor-active')) !== 'true') {
    await alignSelectedTarget(page);
    await expect
      .poll(async () => Number(await root.getAttribute('data-weapon-charge')))
      .toBeGreaterThanOrEqual(2);
    await page.keyboard.press('Digit3');
  }
  await expect(root).toHaveAttribute('data-tractor-active', 'true');
  await expect(root).toHaveAttribute('data-vfx-kind', 'tractor');
  await expect
    .poll(async () => Number(await root.getAttribute('data-active-vfx')))
    .toBeGreaterThan(0);

  await page.goto('/');
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  await dismissMainMenu(page);
  await departCurrentMission(page);
  await identifyEnemy(page);
  await pauseFlightForUi(page);
  await openEnergyDrawer(page);
  await page.getByRole('button', { name: 'Ataque' }).click();
  await resumeFlightFromUi(page);
  await approachAndBrake(page, 70);
  await alignSelectedTarget(page);
  await expect
    .poll(async () => Number(await root.getAttribute('data-weapon-charge')))
    .toBeGreaterThanOrEqual(8);
  const shieldBefore = Number(await root.getAttribute('data-enemy-shields'));
  await page.keyboard.press('Digit1');
  await expect
    .poll(async () => Number(await root.getAttribute('data-enemy-shields')))
    .toBeLessThan(shieldBefore);
  await page.keyboard.press('KeyP');
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');
  await expect(root).toHaveAttribute('data-audio-state', 'suspended');
  await expect(root).toHaveAttribute('data-audio-voices', '0');
  await expect(root).toHaveAttribute('data-shield-impact-target', 'remote');
  await expect(root).not.toHaveAttribute('data-impact-sector', 'none');
  await expect
    .poll(async () => Number(await root.getAttribute('data-active-vfx')))
    .toBeGreaterThanOrEqual(4);
  await page.getByRole('button', { name: /Retomar/ }).click();
  await expect(root).toHaveAttribute('data-simulation-state', 'running');
  await expect(root).toHaveAttribute('data-audio-state', 'ready');
  await page.locator('#game-canvas').focus();
  await page.keyboard.press('Digit2');
  await expect(page.locator('[data-combat-feedback]')).toContainText('Torpedo lançado');
  await expect(root).toHaveAttribute('data-torpedo-ammo', '5');
  await expect(root).toHaveAttribute('data-projectile-count', '1');
  await expect
    .poll(async () => Number(await root.getAttribute('data-active-vfx')))
    .toBeGreaterThanOrEqual(2);
  await expect
    .poll(async () => Number(await root.getAttribute('data-draw-calls')))
    .toBeLessThanOrEqual(36);
  await expect(root).toHaveAttribute('data-projectile-count', '0', { timeout: 5_000 });
  await expect(page.locator('[data-combat-feedback]')).toContainText('Torpedo impactou');
  await page.keyboard.press('KeyP');
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');
  await expect
    .poll(async () =>
      Promise.all(
        ['bow', 'stern', 'port', 'starboard'].map((section) =>
          root.getAttribute(`data-remote-section-${section}`),
        ),
      ),
    )
    .toContain('critical');
  await expect(root).not.toHaveAttribute('data-remote-disabled-subsystems', '');
  if (testInfo.project.name === 'Google Chrome') {
    await page.waitForTimeout(1_000);
    await page.screenshot({
      path: 'docs/screenshots/ui-gfx-final-combat-1280x720.png',
    });
  }
});

test('conclui o encontro com vitória e reinicia sem recarregar a página', async ({ page }) => {
  test.setTimeout(60_000);
  await enterCombatMission(page);
  const root = page.locator('[data-app-root]');
  await identifyEnemy(page);
  await pauseFlightForUi(page);
  await openEnergyDrawer(page);
  const increaseSensors = page.getByRole('button', {
    name: 'Aumentar energia de auxiliares e sensores',
  });
  await increaseSensors.click();
  await increaseSensors.click();
  await resumeFlightFromUi(page);

  for (const expectedAmmo of ['5', '4', '3']) {
    await approachAndBrake(page, 70);
    await alignSelectedTarget(page);
    await page.keyboard.press('Digit2');
    await expect(root).toHaveAttribute('data-torpedo-ammo', expectedAmmo);
    await expect(root).toHaveAttribute('data-projectile-count', '0', { timeout: 5_000 });
    if (expectedAmmo !== '3') await page.waitForTimeout(1_200);
  }
  await expect(root).toHaveAttribute('data-combat-phase', 'victory', { timeout: 5_000 });
  await expect(page.locator('[data-combat-feedback]')).toContainText('Vitória');
  await expect(page.locator('[data-terminal-banner]')).toBeVisible();
  await expect(root).toHaveAttribute('data-enemy-condition', 'destruído');
  await expect(page.locator('[data-combat-enemy-state]')).toContainText('0% · destruído');

  await pauseFlightForUi(page);
  await page.getByRole('button', { name: 'Reiniciar encontro (N)' }).click();
  await expect(root).toHaveAttribute('data-combat-phase', 'active');
  await expect(root).toHaveAttribute('data-torpedo-ammo', '6');
  await expect(root).toHaveAttribute('data-ship-z', '16.0000');
});

test('expõe energia conservada e telemetria observável no HUD', async ({ page }) => {
  await enterBase(page);
  const root = page.locator('[data-app-root]');
  const energyPanel = page.locator('[data-energy-panel]');

  await expect(root).toHaveAttribute('data-app-state', 'ready');
  await expect(energyPanel).toBeVisible();
  await expect(root).toHaveAttribute('data-energy-profile', 'balanced');
  await expect(root).toHaveAttribute('data-energy-total', '100.00');
  await expect(energyPanel.locator('[data-energy-total]')).toHaveText('100 / 100');
  await expect(page.locator('[data-energy-reactor]')).toContainText('100.0 u/s geradas');
  await expect(page.locator('[data-flight-target]')).toContainText('Nenhum contato');
  await expect(page.locator('[data-flight-hull]')).toContainText('100%');
  await expect(page.locator('[data-flight-shields]')).toContainText(/\+\d+\.\d\/s/);
  await expect(page.locator('[data-flight-weapon]')).toContainText(/\+\d+\.\d\/s/);
  await expect(page.locator('[data-flight-sensor-range]')).toContainText('110 u');
  await expect(page.locator('.status-panel .eyebrow')).toHaveText('Comando de missão');
});

test('persiste a primeira missão concluída e a retoma após reload', async ({ page }) => {
  await enterBase(page);
  const root = page.locator('[data-app-root]');
  const missionAction = page.locator('[data-mission-action]');

  await expect(root).toHaveAttribute('data-mission-phase', 'briefing');
  await expect(root).toHaveAttribute('data-save-state', 'created');
  await expect(missionAction).toHaveText('Abrir mapa do sistema');
  await departCurrentMission(page, { waitForObjective: false });
  await expect(root).toHaveAttribute('data-mission-phase', 'outbound');
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');

  await expect(root).toHaveAttribute('data-mission-phase', 'objective', { timeout: 4_000 });
  await expect(root).toHaveAttribute('data-simulation-state', 'running');
  await identifyEnemy(page);
  await expect(root).toHaveAttribute('data-mission-objective-completed', 'true');
  await expect(missionAction).toHaveText('Retornar à base');
  await expect(missionAction).toBeEnabled();

  await pauseFlightForUi(page);
  await missionAction.click();
  await expect(root).toHaveAttribute('data-mission-phase', 'returning');
  await expect(root).toHaveAttribute('data-mission-phase', 'completed', { timeout: 4_000 });
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');
  await expect(root).toHaveAttribute('data-player-condition', 'íntegro');
  await expect(root).toHaveAttribute('data-torpedo-ammo', '6');
  await expect(page.locator('[data-objective-text]')).toContainText('Sensores dominados');
  await expect(missionAction).toHaveText('Preparar missão 2');
  await expect(root).toHaveAttribute('data-save-state', 'saved');
  expect(await countStoredSaveSnapshots(page)).toBe(3);

  await page.reload();
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  await expect(root).toHaveAttribute('data-save-state', 'loaded');
  await page.locator('[data-main-menu-continue]').click();
  await expect(root).toHaveAttribute('data-mission-phase', 'completed');
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');
  await expect(missionAction).toHaveText('Preparar missão 2');

  await departCurrentMission(page);
  await expect(root).toHaveAttribute('data-mission-id', 'iris-assistance');
  await expect(root).toHaveAttribute('data-save-state', 'saved');
  expect(await countStoredSaveSnapshots(page)).toBe(3);
});

test('conclui as três missões iniciais do tutorial em sequência', async ({ page }) => {
  test.setTimeout(90_000);
  await enterBase(page);
  const root = page.locator('[data-app-root]');
  const missionAction = page.locator('[data-mission-action]');
  const tractorButton = page.locator('[data-combat-action="tractor"]');
  const torpedoButton = page.locator('[data-combat-action="torpedo"]');

  await expect(root).toHaveAttribute('data-mission-count', '3');
  await departCurrentMission(page);
  await expect(root).toHaveAttribute('data-encounter-disposition', 'passive');
  await expect(root).toHaveAttribute('data-allowed-equipment', '');
  await expect(page.locator('[data-combat-action="beam"]')).toBeDisabled();
  await expect(torpedoButton).toBeDisabled();
  await identifyEnemy(page);
  await expect(root).toHaveAttribute('data-mission-objective-completed', 'true');
  await pauseFlightForUi(page);
  await missionAction.click();
  await expect(root).toHaveAttribute('data-mission-phase', 'completed', { timeout: 4_000 });

  await departCurrentMission(page);
  await expect(root).toHaveAttribute('data-mission-id', 'iris-assistance');
  await expect(root).toHaveAttribute('data-allowed-equipment', 'tractor');
  await expect(tractorButton).toBeEnabled();
  await expect(torpedoButton).toBeDisabled();
  await identifyEnemy(page);
  await approachAndBrake(page, 68);
  await page.keyboard.press('Digit3');
  if ((await root.getAttribute('data-tractor-active')) !== 'true') {
    await alignSelectedTarget(page);
    await page.keyboard.press('Digit3');
  }
  await expect(root).toHaveAttribute('data-tractor-active', 'true');
  await expect(root).toHaveAttribute('data-mission-objective-completed', 'true');
  await pauseFlightForUi(page);
  await missionAction.click();
  await expect(root).toHaveAttribute('data-mission-phase', 'completed', { timeout: 4_000 });

  await departCurrentMission(page);
  await expect(root).toHaveAttribute('data-mission-id', 'vespa-combat-training');
  await expect(root).toHaveAttribute('data-encounter-disposition', 'hostile');
  await expect(root).toHaveAttribute('data-allowed-equipment', 'beam,torpedo,tractor');
  await identifyEnemy(page);
  for (const expectedAmmo of ['5', '4', '3']) {
    await approachAndBrake(page, 70);
    await alignSelectedTarget(page);
    await page.keyboard.press('Digit2');
    await expect(root).toHaveAttribute('data-torpedo-ammo', expectedAmmo);
    await expect(root).toHaveAttribute('data-projectile-count', '0', { timeout: 5_000 });
    if (expectedAmmo !== '3') await page.waitForTimeout(1_200);
  }
  await expect(root).toHaveAttribute('data-combat-phase', 'victory', { timeout: 5_000 });
  await expect(root).toHaveAttribute('data-mission-objective-completed', 'true');
  await pauseFlightForUi(page);
  await missionAction.click();
  await expect(root).toHaveAttribute('data-mission-phase', 'completed', { timeout: 4_000 });
  await expect(root).toHaveAttribute('data-tutorial-completed', 'true');
  await expect(missionAction).toHaveText('Reiniciar treinamento pelo mapa');
  await expect(root).toHaveAttribute('data-save-state', 'saved');

  await page.reload();
  await expect(root).toHaveAttribute('data-save-state', 'loaded');
  await page.locator('[data-main-menu-continue]').click();
  await expect(root).toHaveAttribute('data-mission-id', 'vespa-combat-training');
  await expect(root).toHaveAttribute('data-tutorial-completed', 'true');
});

test('retoma o último checkpoint seguro ao recarregar durante viagem ou encontro', async ({
  page,
}) => {
  await enterBase(page);
  const root = page.locator('[data-app-root]');

  await expect(root).toHaveAttribute('data-save-state', 'created');
  await departCurrentMission(page, { waitForObjective: false });
  await expect(root).toHaveAttribute('data-save-state', 'saved');

  await page.reload();
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  await expect(root).toHaveAttribute('data-save-state', 'loaded');
  await page.locator('[data-main-menu-continue]').click();
  await expect(root).toHaveAttribute('data-mission-phase', 'briefing');
  await expect(root).toHaveAttribute('data-navigation-state', 'base');
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');

  await departCurrentMission(page);
  await expect(root).toHaveAttribute('data-navigation-state', 'encounter');
  await page.reload();
  await expect(root).toHaveAttribute('data-save-state', 'loaded');
  await page.locator('[data-main-menu-continue]').click();
  await expect(root).toHaveAttribute('data-mission-phase', 'briefing');
  await expect(root).toHaveAttribute('data-navigation-state', 'base');
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');
});

test('preserva save corrompido e recupera somente após ação explícita', async ({ page }) => {
  await enterBase(page);
  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-save-state', 'created');
  await corruptActiveSave(page);

  await page.reload();
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  await expect(root).toHaveAttribute('data-save-state', 'invalid');
  await expect(root).toHaveAttribute('data-mission-phase', 'briefing');
  await expect(page.locator('[data-save-status]')).toContainText('Save inválido preservado');
  await expect(page.locator('[data-main-menu-progress]')).toHaveText('Continuar indisponível');
  await page.locator('[data-main-menu-new]').click();
  await expect(page.locator('[data-new-training-dialog]')).toBeVisible();
  await page.locator('[data-new-training-confirm]').click();
  await expect(root).toHaveAttribute('data-save-state', 'saved');
  expect(await countStoredSaveSnapshots(page)).toBe(2);

  await page.reload();
  await expect(root).toHaveAttribute('data-save-state', 'loaded');
  await page.locator('[data-main-menu-continue]').click();
  await expect(root).toHaveAttribute('data-mission-phase', 'briefing');
});

test('presets e ajuste manual alteram efeitos imediatamente sem perder energia', async ({
  page,
}) => {
  await enterFirstMission(page);
  const root = page.locator('[data-app-root]');
  await pauseFlightForUi(page);
  await openEnergyDrawer(page);
  await expect(root).toHaveAttribute('data-energy-profile', 'balanced');
  const balancedEngine = Number(await root.getAttribute('data-engine-multiplier'));

  const escapeButton = page.getByRole('button', { name: 'Fuga' });
  await escapeButton.focus();
  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('data-energy-profile', 'escape');
  await expect(root).toHaveAttribute('data-energy-engines', '50.00');
  await expect(root).toHaveAttribute('data-energy-total', '100.00');
  await expect
    .poll(async () => Number(await root.getAttribute('data-engine-multiplier')))
    .toBeGreaterThan(balancedEngine);

  const sensorBefore = Number(await root.getAttribute('data-sensor-range'));
  await page.getByRole('button', { name: 'Aumentar energia de auxiliares e sensores' }).click();
  await expect(root).toHaveAttribute('data-energy-profile', 'custom');
  await expect(root).toHaveAttribute('data-energy-total', '100.00');
  const displayedTotal = await page
    .locator('[data-energy-allocation]')
    .evaluateAll((outputs) =>
      outputs.reduce((sum, output) => sum + Number.parseFloat(output.textContent ?? '0'), 0),
    );
  expect(displayedTotal).toBeCloseTo(100, 10);
  await expect
    .poll(async () => Number(await root.getAttribute('data-sensor-range')))
    .toBeGreaterThan(sensorBefore);

  await page.getByRole('button', { name: 'Ataque' }).click();
  const weaponBefore = Number(await root.getAttribute('data-weapon-charge'));
  await resumeFlightFromUi(page);
  await expect
    .poll(async () => Number(await root.getAttribute('data-weapon-charge')))
    .toBeGreaterThan(weaponBefore);
});

test('pausa e retoma sem mover a nave durante a pausa', async ({ page }) => {
  await enterFirstMission(page);
  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-pointer-state', 'captured');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(250);
  await page.keyboard.up('KeyW');
  await page.keyboard.press('KeyP');
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');
  await expect(root).toHaveAttribute('data-pointer-state', 'released');
  const pausedZ = await root.getAttribute('data-ship-z');
  await page.waitForTimeout(300);
  await expect(root).toHaveAttribute('data-ship-z', pausedZ ?? '');

  await page.keyboard.press('KeyP');
  await expect(root).toHaveAttribute('data-simulation-state', 'running');
  await expect(root).toHaveAttribute('data-pointer-state', 'captured');

  await page.keyboard.press('Escape');
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');
  await expect(root).toHaveAttribute('data-pointer-state', 'released');
  await page.keyboard.press('Escape');
  await expect(root).toHaveAttribute('data-simulation-state', 'running');
  await expect(root).toHaveAttribute('data-pointer-state', 'captured');

  await page.keyboard.press('KeyP');
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');
  const beforeButtonResumeZ = Number(await root.getAttribute('data-ship-z'));
  await page.getByRole('button', { name: /Retomar/ }).click();
  await expect(root).toHaveAttribute('data-simulation-state', 'running');
  await expect(root).toHaveAttribute('data-pointer-state', 'captured');
  await expect(page.locator('#game-canvas')).toBeFocused();
  await page.keyboard.down('KeyW');
  await expect
    .poll(async () => Number(await root.getAttribute('data-ship-z')))
    .not.toBe(beforeButtonResumeZ);
  await page.keyboard.up('KeyW');
});

test('A guina para a esquerda e D guina para a direita', async ({ page }) => {
  await enterFirstMission(page);
  const root = page.locator('[data-app-root]');
  const initialX = Number(await root.getAttribute('data-ship-x'));

  await page.keyboard.down('KeyD');
  await page.waitForTimeout(300);
  await page.keyboard.up('KeyD');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(450);
  await page.keyboard.up('KeyW');

  await expect
    .poll(async () => Number(await root.getAttribute('data-ship-x')))
    .toBeGreaterThan(initialX);

  await page.keyboard.press('KeyN');
  await expect(root).toHaveAttribute('data-ship-x', initialX.toFixed(4));
  await page.keyboard.down('KeyA');
  await page.waitForTimeout(300);
  await page.keyboard.up('KeyA');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(450);
  await page.keyboard.up('KeyW');

  await expect
    .poll(async () => Number(await root.getAttribute('data-ship-x')))
    .toBeLessThan(initialX);
});

test('descarta comandos táticos recebidos durante a pausa', async ({ page }) => {
  await enterFirstMission(page);
  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-contact-awareness', 'detected');
  await page.keyboard.press('KeyP');
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');
  await page.getByRole('button', { name: /Selecionar/ }).click();
  await page.getByRole('button', { name: /Retomar/ }).click();
  await expect(root).toHaveAttribute('data-simulation-state', 'running');
  await page.waitForTimeout(250);
  await expect(root).toHaveAttribute('data-target-selected', 'false');
});

test('mantém marcador congelado durante memória sensorial', async ({ page }, testInfo) => {
  await page.setViewportSize({ height: 720, width: 1280 });
  await enterFirstMission(page);
  const root = page.locator('[data-app-root]');
  const marker = page.locator('[data-target-tracker]');
  const line = page.locator('[data-target-line]');
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  await page.keyboard.press('KeyT');
  await expect(root).toHaveAttribute('data-target-selected', 'true');
  await expect(root).toHaveAttribute('data-contact-observed', 'true');
  await expect(marker).toBeVisible();
  await expect(marker).toHaveAttribute('data-marker-mode', 'observed');

  await page.keyboard.down('KeyS');
  await expect(root).toHaveAttribute('data-contact-observed', 'false', { timeout: 12_000 });
  await page.keyboard.up('KeyS');
  await expect(marker).toHaveAttribute('data-marker-mode', 'remembered');
  await expect(line).toHaveAttribute('data-marker-mode', 'remembered');
  await expect(marker.locator('[data-target-marker-caption]')).toHaveText(
    'MEMÓRIA · ÚLTIMA POSIÇÃO',
  );
  await expect
    .poll(() =>
      marker
        .locator('.target-tracker__corner--tl')
        .evaluate((element) => getComputedStyle(element).borderTopStyle),
    )
    .toBe('dashed');
  await expect
    .poll(() => line.evaluate((element) => getComputedStyle(element).borderTopStyle))
    .toBe('dashed');
  await expect(page.locator('[data-flight-lod]')).toContainText('oculta sem percepção');
  await expect(root).toHaveAttribute('data-remote-visual-damage', 'hidden');
  await expect(root).toHaveAttribute('data-remote-section-bow', 'hidden');
  await expect(root).toHaveAttribute('data-remote-disabled-subsystems', '');
  const frozenTransform = await marker.evaluate(
    (element) => (element as HTMLElement).style.transform,
  );
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(450);
  await page.keyboard.up('KeyD');
  await expect
    .poll(() => marker.evaluate((element) => (element as HTMLElement).style.transform))
    .toBe(frozenTransform);
  await page.keyboard.press('KeyP');
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');
  const styleMutations = await page.evaluate(async () => {
    const elements = [
      document.querySelector<HTMLElement>('[data-target-tracker]'),
      document.querySelector<HTMLElement>('[data-target-line]'),
    ];
    if (elements.some((element) => element === null)) throw new Error('Marcador incompleto.');
    let mutations = 0;
    const observer = new MutationObserver((records) => {
      mutations += records.length;
    });
    for (const element of elements) {
      observer.observe(element!, { attributeFilter: ['style'], attributes: true });
    }
    await new Promise((resolve) => window.setTimeout(resolve, 400));
    observer.disconnect();
    return mutations;
  });
  expect(styleMutations).toBe(0);
  if (testInfo.project.name === 'Google Chrome') {
    const viewportDiagnostics = await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      return {
        clientHeight: document.documentElement.clientHeight,
        clientWidth: document.documentElement.clientWidth,
        devicePixelRatio: window.devicePixelRatio,
        innerHeight: window.innerHeight,
        innerWidth: window.innerWidth,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        visualViewportHeight: window.visualViewport?.height,
        visualViewportWidth: window.visualViewport?.width,
      };
    });
    expect(viewportDiagnostics).toMatchObject({
      clientHeight: 720,
      clientWidth: 1280,
      innerHeight: 720,
      innerWidth: 1280,
      scrollX: 0,
      scrollY: 0,
      visualViewportHeight: 720,
      visualViewportWidth: 1280,
    });
    await expectHudInsideViewport(page);
    await page.waitForTimeout(1_000);
    await page.screenshot({
      fullPage: true,
      path: 'docs/screenshots/ui-gfx-final-memory-1280x720-fullpage.png',
    });
    await page.screenshot({
      path: 'docs/screenshots/ui-gfx-final-memory-1280x720.png',
    });
  }
});

test('organiza o HUD sem overlap ou scroll em 1280x720 e 1600x900', async ({ page }, testInfo) => {
  for (const viewport of [
    { height: 720, width: 1280 },
    { height: 900, width: 1600 },
  ]) {
    await page.setViewportSize(viewport);
    await enterFirstMission(page);
    const root = page.locator('[data-app-root]');
    await expect(root).toHaveAttribute('data-app-state', 'ready');
    const metrics = await page.evaluate(() => {
      const selectors = [
        '.objective-card',
        '.session-controls',
        '.player-status',
        '.target-card',
        '.combat-feedback',
        '.tactical-action-bar',
        '.energy-panel',
        '.diagnostics-drawer',
      ];
      const rectangles = selectors.map((selector) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (element === null) throw new Error(`Elemento ausente: ${selector}`);
        const rectangle = element.getBoundingClientRect();
        return {
          bottom: rectangle.bottom,
          left: rectangle.left,
          right: rectangle.right,
          selector,
          top: rectangle.top,
        };
      });
      const overlaps: string[] = [];
      for (let leftIndex = 0; leftIndex < rectangles.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < rectangles.length; rightIndex += 1) {
          const left = rectangles[leftIndex];
          const right = rectangles[rightIndex];
          if (left === undefined || right === undefined) continue;
          const intersects =
            left.left < right.right &&
            left.right > right.left &&
            left.top < right.bottom &&
            left.bottom > right.top;
          if (intersects) overlaps.push(`${left.selector} × ${right.selector}`);
        }
      }
      return {
        clientHeight: document.documentElement.clientHeight,
        clientWidth: document.documentElement.clientWidth,
        overlaps,
        scrollHeight: document.documentElement.scrollHeight,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });
    expect(metrics.overlaps).toEqual([]);
    expect(metrics.scrollWidth).toBe(metrics.clientWidth);
    expect(metrics.scrollHeight).toBe(metrics.clientHeight);
    if (viewport.width === 1600 && testInfo.project.name === 'Google Chrome') {
      await page.screenshot({ path: 'docs/screenshots/ui-gfx-final-1600x900.png' });
    }
  }

  const pauseButton = page.getByRole('button', { name: /Pausar/ });
  await pauseButton.focus();
  expect(await pauseButton.evaluate((element) => getComputedStyle(element).outlineWidth)).toBe(
    '3px',
  );
});

test('mantém o mapa navegável e contido em 1280x720 e 1600x900', async ({ page }, testInfo) => {
  for (const viewport of [
    { height: 720, width: 1280 },
    { height: 900, width: 1600 },
  ]) {
    await page.setViewportSize(viewport);
    await enterBase(page);
    const root = page.locator('[data-app-root]');
    await expect(root).toHaveAttribute('data-app-state', 'ready');
    await page.locator('[data-mission-action]').click();
    const map = page.locator('[data-system-map]');
    await expect(map).toBeVisible();
    await expect(
      page.locator('[data-navigation-destination][data-mission-destination="true"]'),
    ).toBeFocused();
    const metrics = await map.evaluate((element) => {
      const rectangle = element.getBoundingClientRect();
      return {
        bottom: rectangle.bottom,
        documentScrollHeight: document.documentElement.scrollHeight,
        documentScrollWidth: document.documentElement.scrollWidth,
        left: rectangle.left,
        right: rectangle.right,
        top: rectangle.top,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      };
    });
    expect(metrics.left).toBeGreaterThanOrEqual(0);
    expect(metrics.top).toBeGreaterThanOrEqual(0);
    expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth);
    expect(metrics.bottom).toBeLessThanOrEqual(metrics.viewportHeight);
    expect(metrics.documentScrollWidth).toBe(metrics.viewportWidth);
    expect(metrics.documentScrollHeight).toBe(metrics.viewportHeight);
    if (viewport.width === 1600 && testInfo.project.name === 'Google Chrome') {
      await page.screenshot({ path: 'docs/screenshots/p1-system-map-1600x900.png' });
    }
    await page.keyboard.press('Escape');
    await expect(map).toBeHidden();
    await expect(root).toHaveAttribute('data-navigation-state', 'base');
    await expect(page.locator('[data-navigation-open]')).toBeFocused();
  }
});

test('mantém todos os painéis dentro do viewport nos estados de apresentação', async ({ page }) => {
  test.setTimeout(60_000);
  for (const viewport of [
    { height: 720, width: 1280 },
    { height: 900, width: 1600 },
  ]) {
    await page.setViewportSize(viewport);
    await enterFirstMission(page);
    await expectHudInsideViewport(page);

    await pauseFlightForUi(page);
    await openEnergyDrawer(page);
    await expect(page.locator('.objective-card')).toBeHidden();
    await expectHudInsideViewport(page);
    await page.locator('[data-energy-panel] > summary').click();

    await expectHudInsideViewport(page);
    await page.getByRole('button', { name: /Retomar/ }).click();

    await page.locator('#game-canvas').focus();
    await page.keyboard.press('KeyT');
    await page.keyboard.down('KeyS');
    await expect(page.locator('[data-app-root]')).toHaveAttribute(
      'data-contact-observed',
      'false',
      {
        timeout: 12_000,
      },
    );
    await page.keyboard.up('KeyS');
    await expectHudInsideViewport(page);

    await page.evaluate(() => {
      const root = document.querySelector<HTMLElement>('[data-app-root]');
      const banner = document.querySelector<HTMLElement>('[data-terminal-banner]');
      if (root === null || banner === null) throw new Error('Apresentação terminal indisponível.');
      root.dataset.combatPhase = 'victory';
      banner.hidden = false;
    });
    await expectHudInsideViewport(page);
  }
});

test('perda de foco libera comandos e pausa com motivo visível', async ({ page }) => {
  await enterFirstMission(page);
  const root = page.locator('[data-app-root]');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(180);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));

  await expect(root).toHaveAttribute('data-simulation-state', 'paused');
  await expect(root).toHaveAttribute('data-pointer-state', 'released');
  await expect(page.locator('[data-flight-simulation]')).toContainText('foco perdido');
  const pausedZ = await root.getAttribute('data-ship-z');
  await page.waitForTimeout(250);
  await expect(root).toHaveAttribute('data-ship-z', pausedZ ?? '');
});

test('tela cheia preserva canvas e HUD, e o ponteiro pode ser capturado e liberado', async ({
  page,
}) => {
  await enterFirstMission(page);
  const root = page.locator('[data-app-root]');
  const hud = page.locator('[data-flight-hud]');

  await expect(root).toHaveAttribute('data-pointer-state', 'captured');
  await page.keyboard.press('Escape');
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');
  await expect(root).toHaveAttribute('data-pointer-state', 'released');

  await page.getByRole('button', { name: 'Tela cheia (F)' }).click();
  await expect(root).toHaveAttribute('data-fullscreen-state', 'active');
  await expect(hud).toBeVisible();
  await expect(page.locator('[data-control-feedback]')).toContainText('Tela cheia ativada');
  await expect
    .poll(() =>
      page.evaluate(() => document.fullscreenElement?.hasAttribute('data-app-root') === true),
    )
    .toBe(true);

  await page.getByRole('button', { name: 'Sair da tela cheia (F)' }).click();
  await expect(root).toHaveAttribute('data-fullscreen-state', 'inactive');

  await page.getByRole('button', { name: /Retomar/ }).click();
  await expect(root).toHaveAttribute('data-simulation-state', 'running');
  await expect(root).toHaveAttribute('data-pointer-state', 'captured');
  await page.keyboard.press('Escape');
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');
  await expect(root).toHaveAttribute('data-pointer-state', 'released');
});

test('negações de tela cheia e ponteiro geram feedback sem erro não tratado', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      configurable: true,
      value: () => Promise.reject(new DOMException('fullscreen negado', 'NotAllowedError')),
    });
    Object.defineProperty(HTMLCanvasElement.prototype, 'requestPointerLock', {
      configurable: true,
      value: () => Promise.reject(new DOMException('ponteiro negado', 'NotAllowedError')),
    });
  });
  await enterFirstMission(page);

  await page.getByRole('button', { name: 'Tela cheia (F)' }).click();
  await expect(page.locator('[data-control-feedback]')).toContainText(
    'Não foi possível ativar a tela cheia',
  );
  await page.getByRole('button', { name: 'Capturar mouse' }).click();
  await expect(page.locator('[data-control-feedback]')).toContainText(
    'Não foi possível capturar o mouse',
  );
  await page.waitForTimeout(100);

  expect(consoleErrors).toEqual([]);
});
