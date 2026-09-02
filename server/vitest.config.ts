import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/globalSetup.ts'],
    setupFiles: ['tests/setup.ts'],
    fileParallelism: false, // tests share one database, so run files serially
    hookTimeout: 30_000,
    testTimeout: 20_000,
    // Point the app + Prisma at a dedicated test database (set before config/env loads).
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://receipthub:receipthub@localhost:5544/receipthub_test',
    },
  },
});
