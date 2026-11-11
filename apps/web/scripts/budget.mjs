// Size budget for the static export. Run after `pnpm build`: node scripts/budget.mjs
// JavaScript is what the home page loads in a modern browser (nomodule polyfills are skipped).
// Most of it is the React and Next runtime; the page's own code is a small part.
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'out');

const BUDGET_KB = {
  'JavaScript on the home page (gzip)': 150,
  'CSS (gzip)': 20,
  'HTML of the home page (gzip)': 70,
  'Images on the page (icon)': 20,
};

const gz = (file) => gzipSync(readFileSync(file)).length / 1024;
const html = readFileSync(path.join(out, 'index.html'), 'utf8');
const tags = [...html.matchAll(/<script[^>]*src="([^"]+)"[^>]*>/g)].filter(([tag]) => !/noModule/i.test(tag));
const styles = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)];

const measured = {
  'JavaScript on the home page (gzip)': tags.reduce((sum, [, src]) => sum + gz(path.join(out, src)), 0),
  'CSS (gzip)': styles.reduce((sum, [, href]) => sum + gz(path.join(out, href)), 0),
  'HTML of the home page (gzip)': gz(path.join(out, 'index.html')),
  'Images on the page (icon)': ['app-icon.webp'].reduce(
    (sum, name) => sum + statSync(path.join(out, 'screens', name)).size / 1024,
    0,
  ),
};

let failed = false;
for (const [name, kb] of Object.entries(measured)) {
  const limit = BUDGET_KB[name];
  const ok = kb <= limit;
  failed ||= !ok;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${kb.toFixed(1)} KB (budget ${limit} KB)`);
}
process.exit(failed ? 1 : 0);
