import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 4310);

// Set PW_CHROMIUM_PATH to use a Chromium you already have instead of Playwright's download.
const executablePath = process.env.PW_CHROMIUM_PATH;

const common = {
  colorScheme: 'light' as const,
  reducedMotion: 'reduce' as const,
  deviceScaleFactor: 1,
  locale: 'en-US',
  timezoneId: 'UTC',
};

export default defineConfig({
  testDir: './e2e',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  expect: {
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', scale: 'css', maxDiffPixelRatio: 0.01 },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    { name: 'mobile-390', use: { ...common, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'tablet-768', use: { ...common, viewport: { width: 768, height: 1024 } } },
    { name: 'desktop-1440', use: { ...common, viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: 'node scripts/serve-out.mjs',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(PORT) },
  },
});
