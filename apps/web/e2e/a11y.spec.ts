import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openPage, scrubTo } from './helpers';

async function serious(page: Page, scope?: string) {
  const builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']);
  if (scope) builder.include(scope);
  const results = await builder.analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
}

test('no serious or critical axe violations', async ({ page }) => {
  await openPage(page, { hideChrome: false });
  expect(await serious(page)).toEqual([]);
});

test('no violations with the toys played with and an FAQ answer open', async ({ page }) => {
  await openPage(page, { hideChrome: false });
  await page.getByRole('button', { name: 'Add a set' }).click();
  await page.getByRole('button', { name: 'Squat' }).click();
  await page.getByRole('button', { name: /^Tuesday workout/ }).click();
  await page.getByRole('button', { name: 'Show the recovery map for Friday morning' }).click();
  await page.locator('#faq details').first().locator('summary').click();
  expect(await serious(page)).toEqual([]);
});

test('no violations in the pinned hero at 0, 30, 48 and 96 hours', async ({ page }) => {
  await openPage(page, { hideChrome: false, motion: true });
  for (const hours of [0, 30, 48, 96]) {
    await scrubTo(page, hours);
    await page.waitForTimeout(600);
    expect(await serious(page, '#hero'), `at ${hours} h`).toEqual([]);
  }
});

test('the hero stays clean with the slider moved by keyboard', async ({ page }) => {
  await openPage(page, { hideChrome: false });
  await page.locator('[data-ag-slider]').focus();
  await page.keyboard.press('PageUp');
  await page.keyboard.press('PageUp');
  await page.waitForTimeout(300);
  expect(await serious(page, '#hero')).toEqual([]);
});
