import { expect, test, type Page } from '@playwright/test';
import { createGameSaveEnvelope, createGameSavePayload } from '../../src/application/game-save';

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

async function seedMissionBriefing(page: Page, missionId: string): Promise<void> {
  await page.goto('/');
  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  await expect(root).toHaveAttribute('data-save-state', /created|loaded/);
  const savedAtIso = '2026-08-30T12:00:00.000Z';
  const envelope = createGameSaveEnvelope(createGameSavePayload(missionId, 'briefing'), savedAtIso);
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
  await page.goto('/');
  await expect(page.locator('[data-app-root]')).toHaveAttribute('data-app-state', 'ready');
  await departCurrentMission(page);
}

async function enterCombatMission(page: Page): Promise<void> {
  await seedMissionBriefing(page, 'vespa-combat-training');
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

async function approachAndBrake(page: Page, maximumDistance: number): Promise<void> {
  const root = page.locator('[data-app-root]');
  await page.locator('#game-canvas').click({ position: { x: 640, y: 360 } });
  await page.keyboard.down('KeyW');
  await expect
    .poll(
      async () =>
        (await root.getAttribute('data-contact-observed')) === 'true' &&
        Number(await root.getAttribute('data-contact-distance')) < maximumDistance,
      { timeout: 8_000 },
    )
    .toBe(true);
  await page.keyboard.up('KeyW');
  await page.keyboard.down('Space');
  await expect
    .poll(async () => Number(await root.getAttribute('data-ship-speed')), { timeout: 4_000 })
    .toBeLessThan(3);
  await page.keyboard.up('Space');
}

async function alignSelectedTarget(page: Page): Promise<void> {
  const marker = page.locator('[data-target-tracker]');
  await expect(marker).toBeVisible();
  await page.locator('#game-canvas').click({ position: { x: 640, y: 360 } });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const box = await marker.boundingBox();
    if (box === null) throw new Error('Marcador de alvo deixou de estar visível.');
    const deltaX = box.x + box.width / 2 - page.viewportSize()!.width / 2;
    if (Math.abs(deltaX) < 80) return;
    const key = deltaX < 0 ? 'KeyD' : 'KeyA';
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

test('inicia a arena de voo com WebGL 2 e telemetria', async ({ page }) => {
  await page.goto('/');

  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-app-state', 'ready');
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

test('mantém a base segura e percorre mapa, viagem, encontro e retorno', async ({
  page,
}, testInfo) => {
  await page.goto('/');
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

test('feixe, torpedo e raio trator têm resultados e restrições distintos', async ({
  page,
}, testInfo) => {
  await enterCombatMission(page);
  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-player-visual-damage', 'intact');
  await identifyEnemy(page);
  await expect(root).toHaveAttribute('data-remote-visual-damage', 'intact');

  await page.getByRole('button', { name: /Raio trator/ }).click();
  await expect(page.locator('[data-combat-feedback]')).toContainText('fora do alcance');

  await approachAndBrake(page, 68);
  await page.getByRole('button', { name: /Raio trator/ }).click();
  if ((await root.getAttribute('data-tractor-active')) !== 'true') {
    await alignSelectedTarget(page);
    await expect
      .poll(async () => Number(await root.getAttribute('data-weapon-charge')))
      .toBeGreaterThanOrEqual(2);
    await page.getByRole('button', { name: /Raio trator/ }).click();
  }
  await expect(root).toHaveAttribute('data-tractor-active', 'true');
  await expect(root).toHaveAttribute('data-vfx-kind', 'tractor');
  await expect
    .poll(async () => Number(await root.getAttribute('data-active-vfx')))
    .toBeGreaterThan(0);

  await page.goto('/');
  await departCurrentMission(page);
  await identifyEnemy(page);
  await openEnergyDrawer(page);
  await page.getByRole('button', { name: 'Ataque' }).click();
  await approachAndBrake(page, 70);
  await alignSelectedTarget(page);
  await expect
    .poll(async () => Number(await root.getAttribute('data-weapon-charge')))
    .toBeGreaterThanOrEqual(8);
  const shieldBefore = Number(await root.getAttribute('data-enemy-shields'));
  await page.getByRole('button', { name: /Feixe/ }).click();
  await expect
    .poll(async () => Number(await root.getAttribute('data-enemy-shields')))
    .toBeLessThan(shieldBefore);
  await page.getByRole('button', { name: /Pausar/ }).click();
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');
  await expect(root).toHaveAttribute('data-shield-impact-target', 'remote');
  await expect(root).not.toHaveAttribute('data-impact-sector', 'none');
  await expect
    .poll(async () => Number(await root.getAttribute('data-active-vfx')))
    .toBeGreaterThanOrEqual(4);
  await page.getByRole('button', { name: /Retomar/ }).click();
  await expect(root).toHaveAttribute('data-simulation-state', 'running');
  await page.getByRole('button', { name: /Torpedo/ }).click();
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
  await page.getByRole('button', { name: /Pausar/ }).click();
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
  await enterCombatMission(page);
  const root = page.locator('[data-app-root]');
  const torpedoButton = page.locator('[data-combat-action="torpedo"]');
  await identifyEnemy(page);
  await openEnergyDrawer(page);
  const increaseSensors = page.getByRole('button', {
    name: 'Aumentar energia de auxiliares e sensores',
  });
  await increaseSensors.click();
  await increaseSensors.click();

  for (const expectedAmmo of ['5', '4', '3']) {
    await approachAndBrake(page, 70);
    await alignSelectedTarget(page);
    await torpedoButton.click();
    await expect(root).toHaveAttribute('data-torpedo-ammo', expectedAmmo);
    await expect(root).toHaveAttribute('data-projectile-count', '0', { timeout: 5_000 });
    if (expectedAmmo !== '3') await page.waitForTimeout(1_200);
  }
  await expect(root).toHaveAttribute('data-combat-phase', 'victory', { timeout: 5_000 });
  await expect(page.locator('[data-combat-feedback]')).toContainText('Vitória');
  await expect(page.locator('[data-terminal-banner]')).toBeVisible();
  await expect(root).toHaveAttribute('data-enemy-condition', 'destruído');
  await expect(page.locator('[data-combat-enemy-state]')).toContainText('0% · destruído');

  await page.getByRole('button', { name: 'Reiniciar encontro (N)' }).click();
  await expect(root).toHaveAttribute('data-combat-phase', 'active');
  await expect(root).toHaveAttribute('data-torpedo-ammo', '6');
  await expect(root).toHaveAttribute('data-ship-z', '16.0000');
});

test('expõe energia conservada e telemetria observável no HUD', async ({ page }) => {
  await page.goto('/');
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
  await page.goto('/');
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
  await expect(root).toHaveAttribute('data-mission-phase', 'completed');
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');
  await expect(missionAction).toHaveText('Preparar missão 2');

  await departCurrentMission(page);
  await expect(root).toHaveAttribute('data-mission-id', 'iris-assistance');
  await expect(root).toHaveAttribute('data-save-state', 'saved');
  expect(await countStoredSaveSnapshots(page)).toBe(3);
});

test('conclui as três missões iniciais do tutorial em sequência', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/');
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
  await missionAction.click();
  await expect(root).toHaveAttribute('data-mission-phase', 'completed', { timeout: 4_000 });

  await departCurrentMission(page);
  await expect(root).toHaveAttribute('data-mission-id', 'iris-assistance');
  await expect(root).toHaveAttribute('data-allowed-equipment', 'tractor');
  await expect(tractorButton).toBeEnabled();
  await expect(torpedoButton).toBeDisabled();
  await identifyEnemy(page);
  await approachAndBrake(page, 68);
  await tractorButton.click();
  if ((await root.getAttribute('data-tractor-active')) !== 'true') {
    await alignSelectedTarget(page);
    await tractorButton.click();
  }
  await expect(root).toHaveAttribute('data-tractor-active', 'true');
  await expect(root).toHaveAttribute('data-mission-objective-completed', 'true');
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
    await torpedoButton.click();
    await expect(root).toHaveAttribute('data-torpedo-ammo', expectedAmmo);
    await expect(root).toHaveAttribute('data-projectile-count', '0', { timeout: 5_000 });
    if (expectedAmmo !== '3') await page.waitForTimeout(1_200);
  }
  await expect(root).toHaveAttribute('data-combat-phase', 'victory', { timeout: 5_000 });
  await expect(root).toHaveAttribute('data-mission-objective-completed', 'true');
  await missionAction.click();
  await expect(root).toHaveAttribute('data-mission-phase', 'completed', { timeout: 4_000 });
  await expect(root).toHaveAttribute('data-tutorial-completed', 'true');
  await expect(missionAction).toHaveText('Reiniciar treinamento pelo mapa');
  await expect(root).toHaveAttribute('data-save-state', 'saved');

  await page.reload();
  await expect(root).toHaveAttribute('data-save-state', 'loaded');
  await expect(root).toHaveAttribute('data-mission-id', 'vespa-combat-training');
  await expect(root).toHaveAttribute('data-tutorial-completed', 'true');
});

test('retoma o último checkpoint seguro ao recarregar durante viagem ou encontro', async ({
  page,
}) => {
  await page.goto('/');
  const root = page.locator('[data-app-root]');

  await expect(root).toHaveAttribute('data-save-state', 'created');
  await departCurrentMission(page, { waitForObjective: false });
  await expect(root).toHaveAttribute('data-save-state', 'saved');

  await page.reload();
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  await expect(root).toHaveAttribute('data-save-state', 'loaded');
  await expect(root).toHaveAttribute('data-mission-phase', 'briefing');
  await expect(root).toHaveAttribute('data-navigation-state', 'base');
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');

  await departCurrentMission(page);
  await expect(root).toHaveAttribute('data-navigation-state', 'encounter');
  await page.reload();
  await expect(root).toHaveAttribute('data-save-state', 'loaded');
  await expect(root).toHaveAttribute('data-mission-phase', 'briefing');
  await expect(root).toHaveAttribute('data-navigation-state', 'base');
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');
});

test('preserva save corrompido e recupera somente após ação explícita', async ({ page }) => {
  await page.goto('/');
  const root = page.locator('[data-app-root]');
  await expect(root).toHaveAttribute('data-save-state', 'created');
  await corruptActiveSave(page);

  await page.reload();
  await expect(root).toHaveAttribute('data-app-state', 'ready');
  await expect(root).toHaveAttribute('data-save-state', 'invalid');
  await expect(root).toHaveAttribute('data-mission-phase', 'briefing');
  await expect(page.locator('[data-save-status]')).toContainText('Save inválido preservado');
  const recoveryButton = page.getByRole('button', { name: 'Criar save seguro' });
  await expect(recoveryButton).toBeVisible();
  await recoveryButton.click();
  await expect(root).toHaveAttribute('data-save-state', 'saved');
  expect(await countStoredSaveSnapshots(page)).toBe(2);

  await page.reload();
  await expect(root).toHaveAttribute('data-save-state', 'loaded');
  await expect(root).toHaveAttribute('data-mission-phase', 'briefing');
});

test('presets e ajuste manual alteram efeitos imediatamente sem perder energia', async ({
  page,
}) => {
  await enterFirstMission(page);
  const root = page.locator('[data-app-root]');
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
  await expect
    .poll(async () => Number(await root.getAttribute('data-weapon-charge')))
    .toBeGreaterThan(weaponBefore);
});

test('pausa e retoma sem mover a nave durante a pausa', async ({ page }) => {
  await enterFirstMission(page);
  const root = page.locator('[data-app-root]');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(250);
  await page.keyboard.up('KeyW');
  await page.keyboard.press('KeyP');
  await expect(root).toHaveAttribute('data-simulation-state', 'paused');
  const pausedZ = await root.getAttribute('data-ship-z');
  await page.waitForTimeout(300);
  await expect(root).toHaveAttribute('data-ship-z', pausedZ ?? '');

  await page.keyboard.press('KeyP');
  await expect(root).toHaveAttribute('data-simulation-state', 'running');
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
    await page.goto('/');
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
  for (const viewport of [
    { height: 720, width: 1280 },
    { height: 900, width: 1600 },
  ]) {
    await page.setViewportSize(viewport);
    await enterFirstMission(page);
    await expectHudInsideViewport(page);

    await openEnergyDrawer(page);
    await expect(page.locator('.objective-card')).toBeHidden();
    await expectHudInsideViewport(page);
    await page.locator('[data-energy-panel] > summary').click();

    await page.getByRole('button', { name: /Pausar/ }).click();
    await expectHudInsideViewport(page);
    await page.getByRole('button', { name: /Retomar/ }).click();

    await page.locator('#game-canvas').click({ position: { x: 640, y: 360 } });
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

  await page.getByRole('button', { name: 'Capturar mouse' }).click();
  await expect(root).toHaveAttribute('data-pointer-state', 'captured');
  await page.keyboard.press('Escape');
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
