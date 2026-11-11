import { expect, type Page } from '@playwright/test';
import { progressFromHours } from '../src/lib/afterglow';

export const SECTIONS = [
  'hero',
  'what',
  'sets',
  'week',
  'science',
  'moments',
  'privacy',
  'free',
  'run-recovery',
  'faq',
  'get',
  'footer',
] as const;

const STILL = '.nav, .skip-link { visibility: hidden !important; }';

interface OpenOptions {
  hideChrome?: boolean;
  // The hero only pins and scrubs when the visitor has not asked for reduced motion.
  motion?: boolean;
}

export async function openPage(page: Page, { hideChrome = true, motion = false }: OpenOptions = {}) {
  if (motion) await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/', { waitUntil: 'load' });
  if (hideChrome) await page.addStyleTag({ content: STILL });
  await loadEverything(page);
}

// Below-the-fold images are lazy: make them eager and wait until each one has decoded.
export async function loadEverything(page: Page) {
  await page.evaluate(async () => {
    const timeout = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    for (const img of Array.from(document.images)) img.loading = 'eager';
    await Promise.all(Array.from(document.images).map((img) => Promise.race([img.decode().catch(() => undefined), timeout(8000)])));
    await document.fonts.ready;
  });
  await page.waitForTimeout(150);
}

// The colour the hero writes for muscles with the longest window: red at 0 h, green at 96 h.
export const longColour = (page: Page) =>
  page.locator('[data-ag]').evaluate((el) => (el as HTMLElement).style.getPropertyValue('--w3').trim());

// Scrolls the pinned hero to the point where the clock reads `hours` and waits for it to settle.
export async function scrubTo(page: Page, hours: number) {
  const p = progressFromHours(hours);
  await page.evaluate((progress) => {
    const track = document.querySelector<HTMLElement>('[data-ag-track]');
    const pin = document.querySelector<HTMLElement>('[data-ag-pin]');
    if (!track || !pin) throw new Error('hero not found');
    const top = track.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + progress * (track.offsetHeight - pin.offsetHeight), behavior: 'instant' });
  }, p);
  await expect.poll(async () => Number(await page.locator('[data-ag-slider]').inputValue()), { timeout: 4000 }).toBeCloseTo(hours, 0);
}
