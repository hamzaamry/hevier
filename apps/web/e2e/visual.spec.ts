import { expect, test, type Locator, type Page } from '@playwright/test';
import { SECTIONS, openPage } from './helpers';

// Baselines are JPEG to keep the repository small. They are compared with a small
// tolerance, with animations off and reduced motion on, so runs are deterministic.
// The hero baseline is the static layout (no pin, 0 h); the scrub states are covered by hero.spec.ts.
const shot = { type: 'jpeg', quality: 60, animations: 'disabled', scale: 'css' } as const;
const tolerance = { maxDiffPixelRatio: 0.02, threshold: 0.25 };

async function capture(target: Locator | Page) {
  return target.screenshot(shot);
}

test.describe('sections', () => {
  for (const id of SECTIONS) {
    test(`section ${id}`, async ({ page }) => {
      await openPage(page);
      const section = page.locator(`[data-section="${id}"]`);
      await expect(section).toBeVisible();
      expect(await capture(section)).toMatchSnapshot(`${id}.jpg`, tolerance);
    });
  }
});

test('above the fold with the navigation bar', async ({ page }) => {
  await openPage(page, { hideChrome: false });
  await page.addStyleTag({ content: '.skip-link { visibility: hidden !important; }' });
  expect(await capture(page)).toMatchSnapshot('fold.jpg', tolerance);
});

test('pinned hero at 48 hours', async ({ page }) => {
  await openPage(page, { hideChrome: false, motion: true });
  await page.addStyleTag({ content: '.skip-link { visibility: hidden !important; }' });
  await page.locator('[data-ag-slider]').fill('48');
  await page.waitForTimeout(800);
  expect(await capture(page)).toMatchSnapshot('pinned-48h.jpg', tolerance);
});
