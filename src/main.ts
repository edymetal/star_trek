import './styles/global.css';

import { bootstrapApplication } from './application/bootstrap';
import { createAppShell } from './ui/app-shell';

async function main(): Promise<void> {
  const root = document.querySelector<HTMLElement>('[data-app-root]');
  if (root === null) {
    throw new Error('Shell principal não encontrado.');
  }

  const shell = createAppShell(root);
  const scene = await bootstrapApplication(shell);
  if (scene !== undefined) {
    window.addEventListener('pagehide', () => scene.dispose(), { once: true });
  }
}

void main().catch((cause: unknown) => {
  const root = document.querySelector<HTMLElement>('[data-app-root]');
  const status = document.querySelector<HTMLElement>('[data-status-text]');
  if (root !== null) {
    root.dataset.appState = 'blocked';
    root.dataset.graphicsState = 'blocked';
    root.setAttribute('aria-busy', 'false');
  }
  if (status !== null) {
    status.textContent =
      cause instanceof Error
        ? `Falha inesperada ao iniciar: ${cause.message}`
        : 'Falha inesperada ao iniciar o aplicativo.';
  }
});
