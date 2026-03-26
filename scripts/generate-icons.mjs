import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const sizes = [16, 32, 48, 96, 128];
const outDir = join(import.meta.dirname, '..', 'public', 'icon');

// "A · 文" on indigo gradient squircle, solid fill, no strokes
function makeSvg(size) {
  const s = size;
  const r = s * 0.44;
  const fontA = s * 0.32;
  const fontCn = s * 0.24;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>
  <rect width="${s}" height="${s}" rx="${r}" fill="url(#bg)"/>
  <text x="${s * 0.3}" y="${s * 0.52}"
        font-family="-apple-system, 'SF Pro Rounded', system-ui, sans-serif"
        font-weight="600" font-size="${fontA}"
        fill="white" text-anchor="middle" dominant-baseline="middle">A</text>
  <circle cx="${s * 0.5}" cy="${s * 0.5}" r="${s * 0.025}" fill="rgba(255,255,255,0.45)"/>
  <text x="${s * 0.7}" y="${s * 0.52}"
        font-family="-apple-system, 'PingFang SC', system-ui, sans-serif"
        font-weight="600" font-size="${fontCn}"
        fill="rgba(255,255,255,0.88)" text-anchor="middle" dominant-baseline="middle">文</text>
</svg>`;
}

mkdirSync(outDir, { recursive: true });

for (const size of sizes) {
  const svg = makeSvg(size);
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  writeFileSync(join(outDir, `${size}.png`), buf);
  console.log(`Generated ${size}x${size}`);
}

console.log('Done');
