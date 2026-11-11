// Serves the static export in out/ for Playwright and local checks: node scripts/serve-out.mjs
// Requests are looked up in a map built once from the files in out/, so a request path never
// reaches the filesystem.
import { createReadStream, readdirSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'out');
const port = Number(process.env.PORT ?? 4310);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
};

function indexFiles(dir, urlPrefix, files) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const url = `${urlPrefix}/${entry.name}`;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      indexFiles(file, url, files);
      continue;
    }
    files.set(url, file);
    if (entry.name === 'index.html') files.set(urlPrefix === '' ? '/' : urlPrefix, file);
  }
  return files;
}

const files = indexFiles(root, '', new Map());

function lookup(requestUrl) {
  const [pathname] = requestUrl.split('?');
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return undefined;
  }
  const trimmed = decoded.length > 1 && decoded.endsWith('/') ? decoded.slice(0, -1) : decoded;
  return files.get(trimmed);
}

createServer((req, res) => {
  const file = lookup(req.url ?? '/');
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
    return;
  }
  res.writeHead(200, {
    'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}`));
