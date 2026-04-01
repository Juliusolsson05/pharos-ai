import sharp from 'sharp';

import type { TileCoord } from '../../lib/tile-math.js';

const DISPLAY_SIZE = 256;
const WATER_THRESHOLD = 100;

type DisplayTileInput = {
  png: Buffer;
  coord: TileCoord;
  maskTile: Buffer;
  quality: number;
};

// Configure sharp once — libvips handles threading internally
sharp.concurrency(4);
sharp.cache({ memory: 50 });

const COLOR_LUT = buildColorLut();

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function setRange(lut: Uint8Array, start: number, end: number, from: [number, number, number], to: [number, number, number]) {
  for (let value = start; value <= end; value++) {
    const t = start === end ? 1 : (value - start) / (end - start);
    const offset = value * 3;
    lut[offset] = lerp(from[0], to[0], t);
    lut[offset + 1] = lerp(from[1], to[1], t);
    lut[offset + 2] = lerp(from[2], to[2], t);
  }
}

function buildColorLut() {
  const lut = new Uint8Array(256 * 3);
  setRange(lut, 0, 38, [2, 4, 18], [2, 4, 18]);
  setRange(lut, 39, 100, [2, 4, 18], [182, 84, 8]);
  setRange(lut, 101, 180, [182, 84, 8], [242, 204, 28]);
  setRange(lut, 181, 255, [242, 204, 28], [255, 255, 228]);
  return lut;
}

async function buildAlphaMask(maskTile: Buffer, coord: TileCoord) {
  const localX = coord.x % 16;
  const localY = coord.y % 16;

  // The land/water layer is only fetched at z4. Each z4 tile covers a 16x16 block
  // of z8 nightlight tiles, so we crop the matching child region and scale it back
  // up to 256x256 to keep water transparent in the rendered output.
  const { data } = await sharp(maskTile)
    .grayscale()
    .extract({ left: localX * 16, top: localY * 16, width: 16, height: 16 })
    .resize(DISPLAY_SIZE, DISPLAY_SIZE, { kernel: 'nearest' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const alpha = Buffer.alloc(DISPLAY_SIZE * DISPLAY_SIZE);
  for (let i = 0; i < data.length; i++) {
    alpha[i] = data[i] < WATER_THRESHOLD ? 255 : 0;
  }

  return alpha;
}

/**
 * Convert raw PNG tile to WebP display tile at the given quality.
 * Input and output are both 256x256.
 *
 * We keep a display-specific path separate from ML storage so the frontend gets
 * an opinionated, water-masked visual tile while the analysis pipeline keeps the
 * raw brightness signal instead of the styled colors.
 */
export async function toDisplayTile({ png, coord, maskTile, quality }: DisplayTileInput): Promise<Buffer> {
  const [source, alpha] = await Promise.all([
    sharp(png)
      .grayscale()
      .resize(DISPLAY_SIZE, DISPLAY_SIZE, { fit: 'fill' })
      .raw()
      .toBuffer(),
    buildAlphaMask(maskTile, coord),
  ]);

  const rgba = Buffer.alloc(DISPLAY_SIZE * DISPLAY_SIZE * 4);

  for (let i = 0; i < source.length; i++) {
    const brightness = source[i];
    const lutOffset = brightness * 3;
    const rgbaOffset = i * 4;
    rgba[rgbaOffset] = COLOR_LUT[lutOffset];
    rgba[rgbaOffset + 1] = COLOR_LUT[lutOffset + 1];
    rgba[rgbaOffset + 2] = COLOR_LUT[lutOffset + 2];
    rgba[rgbaOffset + 3] = alpha[i];
  }

  return sharp(rgba, {
    raw: { width: DISPLAY_SIZE, height: DISPLAY_SIZE, channels: 4 },
  }).webp({ quality, effort: 4 }).toBuffer();
}

/**
 * Convert raw PNG tile to a 32x32 grayscale ML array.
 * Returns the raw uint8 pixel buffer (1,024 bytes) and the average radiance.
 *
 * The ML representation is intentionally much smaller than the display tile so we
 * can query long time ranges in Postgres without storing full-resolution imagery.
 */
export async function toMlTile(png: Buffer): Promise<{ pixels: Buffer; avgRadiance: number }> {
  const pixels = await sharp(png)
    .grayscale()
    .resize(32, 32, { fit: 'fill' })
    .raw()
    .toBuffer();

  // Compute average radiance from the 1,024 uint8 values
  let sum = 0;
  for (let i = 0; i < pixels.length; i++) {
    sum += pixels[i];
  }
  const avgRadiance = sum / pixels.length;

  return { pixels, avgRadiance };
}
