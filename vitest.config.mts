import { defineConfig } from 'vitest/config';

// Only for `pnpm test:coverage` (CI, read by Sonar): runs every package's
// tests in one process so coverage/lcov.info has paths relative to the repo.
export default defineConfig({
  test: {
    projects: ['apps/mobile', 'apps/sync', 'apps/web', 'packages/shared'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['apps/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}'],
      exclude: ['**/*.test.ts', '**/*.d.ts', '**/node_modules/**', 'apps/mobile/scripts/local/**', '**/.expo/**', '**/coverage/**', '**/*.config.*'],
    },
  },
});
