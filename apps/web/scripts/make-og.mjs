// Renders public/og.png (1200x630) with the site's own font and the same body map as the page.
// Run from apps/web: node scripts/make-og.mjs   (set PW_CHROMIUM_PATH to reuse a local Chromium)
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const require = createRequire(import.meta.url);
const { MALE_FRONT } = require('@musclemap/assets');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const font = (await readFile(path.join(root, 'node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2'))).toString('base64');
const icon = (await readFile(path.join(root, 'public/screens/app-icon.webp'))).toString('base64');

// The three recovery windows of the page hero (lib/afterglow.ts): 12/30 h, 24/48 h, 24/72 h.
const SHORT = new Set(['CORE', 'BACK_LOWER', 'ADDUCTORS']);
const MID = new Set(['SHOULDERS_SIDE', 'SHOULDERS_REAR', 'FOREARMS', 'TRAPEZIUS', 'HAMSTRINGS']);
const UNTRAINED = new Set(['OBLIQUES', 'ABDUCTORS']);
const RED = '#ff453a';
const ORANGE = '#ff9f0a';
const GREEN = '#34c759';
const IDLE = '#dde1ea';

const STATES = [
  { label: '0 h', color: (g) => (UNTRAINED.has(g) ? IDLE : RED) },
  { label: '48 h', color: (g) => (UNTRAINED.has(g) ? IDLE : SHORT.has(g) || MID.has(g) ? GREEN : ORANGE) },
  { label: '96 h', color: (g) => (UNTRAINED.has(g) ? IDLE : GREEN) },
];

const figure = (color) => `<svg viewBox="195 60 634 1390">
  <path d="${MALE_FRONT.outline.map((o) => o.d).join(' ')}" fill="#e9ecf3" stroke="#fff" stroke-width="3"/>
  ${MALE_FRONT.muscles.map((m) => `<path d="${m.d}" fill="${color(m.group)}" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/>`).join('')}
</svg>`;

const html = `<!doctype html><html><head><style>
@font-face { font-family: Geist; src: url(data:font/woff2;base64,${font}) format('woff2'); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; font-family: Geist, sans-serif; color: #0e0f13; position: relative; background:
  radial-gradient(34% 60% at 8% 8%, rgba(255,69,58,.14), transparent 70%),
  radial-gradient(40% 60% at 96% 100%, rgba(52,199,89,.18), transparent 70%),
  radial-gradient(30% 50% at 70% 0%, rgba(120,150,255,.12), transparent 70%), #f6f7fb; }
.brand { position: absolute; left: 72px; top: 60px; display: flex; align-items: center; gap: 14px; font-size: 32px; font-weight: 650; letter-spacing: -0.03em; }
.brand img { width: 52px; height: 52px; border-radius: 13px; }
h1 { position: absolute; left: 72px; top: 200px; font-size: 84px; line-height: .96; font-weight: 660; letter-spacing: -0.055em; }
h1 span { display: block; background: linear-gradient(96deg, #c4282a, #c4282a 28%, #17181d 96%); -webkit-background-clip: text; color: transparent; }
.tags { position: absolute; left: 72px; bottom: 58px; display: flex; gap: 14px; font-size: 22px; color: #484a55; font-weight: 520; }
.tags b { color: #b8bac4; font-weight: 400; }
.glass { position: absolute; right: 56px; top: 96px; width: 464px; height: 438px; border-radius: 40px; display: flex; justify-content: space-around; align-items: flex-end; padding: 34px 20px 24px;
  background: linear-gradient(180deg, rgba(255,255,255,.88), rgba(255,255,255,.55)); box-shadow: inset 0 1px 0 #fff, 0 0 0 1px rgba(14,16,28,.06), 0 40px 70px -30px rgba(14,16,28,.3); }
.glass div { display: grid; justify-items: center; gap: 12px; height: 100%; }
.glass svg { height: 300px; width: auto; flex: 1; }
.glass p { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; color: #484a55; }
</style></head><body>
<div class="brand"><img src="data:image/webp;base64,${icon}">Hevier</div>
<h1>Train hard.<span>Recover smart.</span></h1>
<div class="tags"><span>Free and open source</span><b>/</b><span>No account, no ads</span><b>/</b><span>Android today</span></div>
<div class="glass">${STATES.map((s) => `<div>${figure(s.color)}<p>${s.label}</p></div>`).join('')}</div>
</body></html>`;

const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(root, 'public/og.png') });
await browser.close();
console.log('wrote public/og.png');
