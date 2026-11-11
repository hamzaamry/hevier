import { expect, test } from '@playwright/test';
import { openPage } from './helpers';

test.describe('seo', () => {
  test('metadata and structured data', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Hevier/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /no account/i);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\.png$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    const raw = await page.locator('script[type="application/ld+json"]').textContent();
    const data = JSON.parse(raw ?? '{}');
    expect(data['@type']).toBe('SoftwareApplication');
    expect(data.operatingSystem).toBe('Android');
    expect(data.offers.price).toBe('0');
  });

  test('robots, sitemap and share image are served', async ({ request }) => {
    expect((await request.get('/robots.txt')).ok()).toBe(true);
    expect((await request.get('/sitemap.xml')).ok()).toBe(true);
    const og = await request.get('/og.png');
    expect(og.ok()).toBe(true);
  });
});

test.describe('honesty', () => {
  test('footer keeps the unofficial disclaimer', async ({ page }) => {
    await openPage(page);
    const note = page.locator('#disclaimer');
    await expect(note).toBeVisible();
    await expect(note).toContainText('not affiliated with');
    await expect(note).toContainText('trademark');
  });

  test('iOS and Run Recovery are labelled as not shipped', async ({ page }) => {
    await openPage(page);
    await expect(page.getByText('Coming soon', { exact: true })).toBeVisible();
    await expect(page.getByText('Coming to iOS').filter({ visible: true }).first()).toBeVisible();
    const text = (await page.locator('main').innerText()).toLowerCase();
    expect(text).not.toMatch(/available on (the )?(app store|ios)/);
    expect(text).not.toMatch(/download on the app store/);
  });

  test('copy has no em dashes', async ({ page }) => {
    await openPage(page);
    expect(await page.locator('body').innerText()).not.toContain('—');
  });
});

test.describe('privacy', () => {
  test('loads only from its own origin and sets no cookies', async ({ page, context, baseURL }) => {
    const external: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (!url.startsWith(baseURL ?? '') && !url.startsWith('data:') && !url.startsWith('blob:')) external.push(url);
    });
    await openPage(page);
    expect(external).toEqual([]);
    expect(await context.cookies()).toEqual([]);
  });
});

test.describe('layout', () => {
  test('no horizontal scroll', async ({ page }) => {
    await openPage(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('download buttons match the release state', async ({ page }) => {
    const hasApk = process.env.NEXT_PUBLIC_HAS_APK_RELEASE === 'true';
    await openPage(page, { hideChrome: false });
    const label = hasApk ? /Download for Android|Get the APK/ : /Build from source|^Get Hevier$/;
    const links = page.getByRole('link', { name: label });
    expect(await links.count()).toBeGreaterThanOrEqual(3);
    for (const href of await links.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')))) {
      expect(href).toMatch(hasApk ? /github\.com\/.+\/releases$/ : /github\.com\/.+#getting-started$/);
    }
    const text = (await page.locator('main').innerText()).toLowerCase();
    if (!hasApk) expect(text).not.toContain('download the apk');
  });
});

test.describe('set counter', () => {
  test('tapping sets changes what they are worth and the zone', async ({ page }) => {
    await openPage(page);
    const total = page.locator('#sets .total');
    await expect(total).toContainText('3.88');
    await expect(page.locator('#sets .zone-copy')).toContainText('Maintenance.');

    await page.getByRole('button', { name: 'Add a set' }).click();
    await expect(total).toContainText('4.88');
    await expect(page.locator('#sets .zone-copy')).toContainText('Growth zone.');

    const remove = page.getByRole('button', { name: 'Remove the last set' });
    await remove.click();
    await remove.click();
    await remove.click();
    await expect(total).toContainText('2.3');
    await expect(page.locator('#sets .zone-copy')).toContainText('Below maintenance.');
    await expect(page.locator('#sets .helpers')).toContainText('1.15');
  });

  test('a set cycles from failure to reps left', async ({ page }) => {
    await openPage(page);
    await page.getByRole('button', { name: /^F failure, set 4, counts 1/ }).click();
    await expect(page.getByRole('button', { name: /^2 reps left, set 4, counts 1/ })).toBeVisible();
    await page.getByRole('button', { name: /^2 reps left, set 4/ }).click();
    await expect(page.getByRole('button', { name: /^4 reps left, set 4, counts 0.86/ })).toBeVisible();
  });
});

test.describe('week strip', () => {
  test('planning a day changes the morning maps and the sentence', async ({ page }) => {
    await openPage(page);
    await page.getByRole('button', { name: /^Tuesday workout: Rest/ }).click();
    await page.getByRole('button', { name: 'Show the recovery map for Wednesday morning' }).click();
    const caption = page.locator('#week .week-cap');
    await expect(caption).toContainText('Wednesday morning:');
    await expect(caption).toContainText('chest');
    await expect(caption).toContainText('still heavy');
  });

  test('a morning before any workout says there is nothing to recover from', async ({ page }) => {
    await openPage(page);
    await page.getByRole('button', { name: 'Show the recovery map for Monday morning' }).click();
    await expect(page.locator('#week .week-cap')).toContainText('nothing trained yet');
  });
});

test.describe('navigation', () => {
  test('skip link is the first tab stop and works', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });

  test('FAQ answers open and close', async ({ page }) => {
    await openPage(page);
    const first = page.locator('#faq details').first();
    await expect(first).not.toHaveAttribute('open', '');
    await first.locator('summary').click();
    await expect(first).toHaveAttribute('open', '');
  });
});
