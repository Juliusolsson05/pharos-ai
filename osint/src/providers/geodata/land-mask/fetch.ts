const GIBS_URL =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/OSM_Land_Water_Map/default/default/GoogleMapsCompatible_Level9';
const FETCH_TIMEOUT = 10_000;
const SOURCE_ZOOM = 4; // fetch at z4, derive z8
const TARGET_ZOOM = 8;
const LAND_THRESHOLD = 100; // pixel value < 100 = land, >= 100 = water

export const LAND_MASK_VERSION = 'osm-land-water-v1';

export type LandMaskResult = {
  z: number;
  x: number;
  y: number;
  hasLand: boolean;
  landPct: number;
  landPixels: number;
  totalPixels: number;
};

/**
 * Fetch all z4 tiles from NASA GIBS OSM Land Water Map and derive
 * per-z8-tile land coverage. 256 HTTP requests total.
 *
 * The OSM Land Water Map uses:
 *   pixel value ~75 (dark grey) = land
 *   pixel value ~128 (light grey) = water
 * Threshold: < 100 = land
 */
export async function computeLandMask(): Promise<{ results: LandMaskResult[]; rawTiles: Map<string, Buffer> }> {
  const scale = 2 ** (TARGET_ZOOM - SOURCE_ZOOM); // 16
  const n = 2 ** SOURCE_ZOOM; // 16
  const results: LandMaskResult[] = [];
  const rawTiles = new Map<string, Buffer>();

  console.log(`[land-mask] Fetching ${n * n} z${SOURCE_ZOOM} tiles from GIBS...`);

  for (let tx = 0; tx < n; tx++) {
    for (let ty = 0; ty < n; ty++) {
      const url = `${GIBS_URL}/${SOURCE_ZOOM}/${ty}/${tx}.png`;

      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
        if (!res.ok) continue;

        const buf = Buffer.from(await res.arrayBuffer());
        rawTiles.set(`${tx}-${ty}`, buf);

        // Parse PNG to raw grayscale pixels via sharp
        const sharp = (await import('sharp')).default;
        const { data, info } = await sharp(buf)
          .grayscale()
          .raw()
          .toBuffer({ resolveWithObject: true });

        const tileWidth = info.width;
        const tileHeight = info.height;
        const channels = 1; // grayscale = 1 channel
        const ppz8 = Math.floor(tileWidth / scale); // pixels per z8 sub-tile

        for (let dx = 0; dx < scale; dx++) {
          for (let dy = 0; dy < scale; dy++) {
            let landPixels = 0;
            let totalPixels = 0;

            for (let py = dy * ppz8; py < (dy + 1) * ppz8; py++) {
              for (let px = dx * ppz8; px < (dx + 1) * ppz8; px++) {
                const idx = (py * tileWidth + px) * channels;
                const val = data[idx]; // R channel (grayscale, R=G=B)
                totalPixels++;
                if (val < LAND_THRESHOLD) landPixels++;
              }
            }

            const z8x = tx * scale + dx;
            const z8y = ty * scale + dy;
            const landPct = totalPixels > 0 ? (landPixels / totalPixels) * 100 : 0;

            results.push({
              z: TARGET_ZOOM,
              x: z8x,
              y: z8y,
              hasLand: landPct > 1, // at least 1% land
              landPct: Math.round(landPct * 100) / 100,
              landPixels,
              totalPixels,
            });
          }
        }
      } catch {
        // If a z4 tile fails, mark all its z8 children as no-land
        for (let dx = 0; dx < scale; dx++) {
          for (let dy = 0; dy < scale; dy++) {
            results.push({
              z: TARGET_ZOOM, x: tx * scale + dx, y: ty * scale + dy,
              hasLand: false, landPct: 0, landPixels: 0, totalPixels: 0,
            });
          }
        }
      }
    }

    if (tx % 4 === 0) {
      console.log(`[land-mask]   z4 column ${tx}/${n}, derived ${results.length} z8 tiles so far`);
    }
  }

  const landCount = results.filter((r) => r.hasLand).length;
  console.log(`[land-mask] Done: ${landCount} land tiles / ${results.length} total (${(landCount / results.length * 100).toFixed(1)}%)`);

  return { results, rawTiles };
}
