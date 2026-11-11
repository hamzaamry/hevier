import { expect, test, type Page } from '@playwright/test';
import { longColour, openPage, scrubTo } from './helpers';

const RED = '255 69 58';
const GREEN = '52 199 89';
const stage = (page: Page) => page.locator('[data-stage][data-on] .stage-line');

test.describe('afterglow, with motion', () => {
  test('scrolling moves the clock: red, then orange, then green, with copy to match', async ({ page }) => {
    await openPage(page, { motion: true, hideChrome: false });
    const pin = page.locator('[data-ag-pin]');
    expect(await pin.evaluate((el) => getComputedStyle(el).position)).toBe('sticky');

    expect(await longColour(page)).toBe(RED);
    await expect(stage(page)).toHaveText('Everything you trained is red.');

    await scrubTo(page, 50);
    await expect(stage(page)).toHaveText('Shoulders and hamstrings are ready.');
    expect(await longColour(page)).not.toBe(RED);
    expect(await longColour(page)).not.toBe(GREEN);

    await scrubTo(page, 96);
    await expect(stage(page)).toHaveText('All green. Train again.');
    await expect.poll(() => longColour(page)).toBe(GREEN);
    await expect(page.locator('[data-live="ready"]').first()).toHaveText('17');
  });

  test('the whole hero fits the screen while pinned', async ({ page }) => {
    await openPage(page, { motion: true, hideChrome: false });
    const viewport = page.viewportSize();
    if (!viewport) throw new Error('no viewport');
    const dock = await page.locator('.ag-dock').boundingBox();
    const stage = await page.locator('.ag-stage').boundingBox();
    const h1 = await page.locator('#hero-title').boundingBox();
    if (!dock || !stage || !h1) throw new Error('missing boxes');
    expect(dock.y + dock.height).toBeLessThanOrEqual(viewport.height);
    expect(stage.y + stage.height).toBeLessThanOrEqual(dock.y + 1);
    expect(h1.y).toBeGreaterThanOrEqual(0);
    await expect(page.locator('.ag-fig').first()).toBeInViewport({ ratio: 1 });
  });

  test('dragging the slider moves the page and the map together', async ({ page }) => {
    await openPage(page, { motion: true, hideChrome: false });
    const slider = page.locator('[data-ag-slider]');
    await slider.focus();
    await page.keyboard.press('End');
    await expect(slider).toHaveValue('96');
    await expect.poll(() => longColour(page)).toBe(GREEN);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
  });
});

test.describe('afterglow, slider and keys', () => {
  test('the slider works from the keyboard with whole hours', async ({ page }) => {
    await openPage(page, { hideChrome: false });
    const slider = page.getByRole('slider', { name: 'Hours since your workout' });
    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveValue('1');
    await page.keyboard.press('PageUp');
    await expect(slider).toHaveValue('13');
    await page.keyboard.press('End');
    await expect(slider).toHaveValue('96');
    await expect(slider).toHaveAttribute('aria-valuetext', /96 hours after the workout\. Likely ready\./);
    await expect(stage(page)).toHaveText('All green. Train again.');
    await page.keyboard.press('Home');
    await expect(slider).toHaveValue('0');
    await expect(stage(page)).toHaveText('Everything you trained is red.');
  });

  test('the slider announces once after you stop', async ({ page }) => {
    await openPage(page, { hideChrome: false });
    const slider = page.getByRole('slider', { name: 'Hours since your workout' });
    await slider.focus();
    await page.keyboard.press('End');
    await expect(page.locator('#hero [role="status"]')).toContainText('96 hours after your workout: 0 heavy, 0 partly recovered, 17 likely ready.');
  });
});

test.describe('afterglow, reduced motion', () => {
  test('nothing pins or scrubs, and a before and after is shown', async ({ page }) => {
    await openPage(page, { hideChrome: false });
    expect(await page.locator('[data-ag-pin]').evaluate((el) => getComputedStyle(el).position)).not.toBe('sticky');
    await expect(page.locator('.still-0')).toBeVisible();
    await expect(page.locator('.still-96')).toBeVisible();
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
    await page.waitForTimeout(200);
    expect(await longColour(page)).toBe(RED);
  });

  test('the slider still drives the map', async ({ page }) => {
    await openPage(page, { hideChrome: false });
    await page.locator('[data-ag-slider]').fill('96');
    await expect.poll(() => longColour(page)).toBe(GREEN);
  });
});

test.describe('afterglow, no script', () => {
  test.use({ javaScriptEnabled: false });

  test('the hero is complete: headline, the 0 h and 96 h pictures, call to action', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Train hard.');
    await expect(page.locator('.still-0')).toBeVisible();
    await expect(page.locator('.still-96')).toBeVisible();
    await expect(page.locator('.ag-dock')).toBeHidden();
    const [first, second] = await Promise.all([page.locator('.still-0 .body').boundingBox(), page.locator('.still-96 .body').boundingBox()]);
    expect(first?.height).toBeGreaterThan(100);
    expect(second?.height).toBeGreaterThan(100);
    expect(await page.locator('[data-ag-pin]').evaluate((el) => getComputedStyle(el).position)).not.toBe('sticky');
  });
});
