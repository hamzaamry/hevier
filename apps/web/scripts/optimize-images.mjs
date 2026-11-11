// Writes the app icon the site uses (the page itself draws the app screens in HTML).
// Run from apps/web: node scripts/optimize-images.mjs
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'public/screens');

await mkdir(target, { recursive: true });

await sharp(path.resolve(root, '../mobile/assets/images/icon.png'))
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile(path.join(root, 'src/app/icon.png'));
await sharp(path.resolve(root, '../mobile/assets/images/icon.png'))
  .resize(180, 180)
  .png({ compressionLevel: 9 })
  .toFile(path.join(root, 'src/app/apple-icon.png'));
await sharp(path.resolve(root, '../mobile/assets/images/icon.png'))
  .resize(160, 160)
  .webp({ quality: 90 })
  .toFile(path.join(target, 'app-icon.webp'));
console.log('icons written');
