import sharp from 'sharp';

// Configure sharp once — libvips handles threading internally
sharp.concurrency(4);
sharp.cache({ memory: 50 });

/**
 * Convert raw PNG tile to WebP display tile at the given quality.
 * Input and output are both 256x256.
 */
export async function toDisplayTile(png: Buffer, quality: number): Promise<Buffer> {
  return sharp(png).webp({ quality, effort: 4 }).toBuffer();
}

/**
 * Convert raw PNG tile to a 32x32 grayscale ML array.
 * Returns the raw uint8 pixel buffer (1,024 bytes) and the average radiance.
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
