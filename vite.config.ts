import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  build: {
    sourcemap: false,
  },
  server: {
    host: '127.0.0.1',
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
