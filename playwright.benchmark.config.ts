import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/performance',
  fullyParallel: false,
  forbidOnly: true,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-benchmark-report' }]],
  timeout: 180_000,
  use: {
    ...devices['Desktop Chrome'],
    channel: 'chrome',
    headless: false,
    baseURL: 'http://127.0.0.1:4173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    reuseExistingServer: false,
    timeout: 30_000,
    url: 'http://127.0.0.1:4173',
  },
  workers: 1,
});
