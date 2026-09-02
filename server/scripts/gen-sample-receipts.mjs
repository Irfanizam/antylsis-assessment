// Generates small solid-colour PNGs used as sample receipt images for the seed.
// Dependency-free (built-in zlib). Re-run only if you want to regenerate the assets.
import { deflateSync, crc32 } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { Buffer } from 'node:buffer';

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

function png(w, h, [r, g, b]) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour RGB
  const row = Buffer.alloc(1 + w * 3);
  for (let x = 0; x < w; x++) {
    row[1 + x * 3] = r;
    row[1 + x * 3 + 1] = g;
    row[1 + x * 3 + 2] = b;
  }
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const dir = new URL('../prisma/seed-assets/', import.meta.url);
mkdirSync(dir, { recursive: true });
const assets = {
  'receipt-1.png': [214, 232, 229],
  'receipt-2.png': [232, 224, 210],
  'receipt-3.png': [220, 224, 236],
};
for (const [name, colour] of Object.entries(assets)) {
  writeFileSync(new URL(name, dir), png(480, 320, colour));
  console.log('wrote', name);
}
