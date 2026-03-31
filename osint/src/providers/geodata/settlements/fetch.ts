import AdmZip from 'adm-zip';

import { tileBounds } from '../../../lib/tile-math.js';

const GHSL_SMOD_URL =
  'https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/GHS_SMOD_GLOBE_R2023A/GHS_SMOD_E2020_GLOBE_R2023A_4326_30ss/V2-0/GHS_SMOD_E2020_GLOBE_R2023A_4326_30ss_V2_0.zip';
const FETCH_TIMEOUT = 180_000;

export const GHSL_VERSION = 'R2023A-E2020-V2-0';

// GHSL SMOD classes:
// -200 = nodata, 0 = nodata, 10 = water
// 11 = very low density rural, 12 = low density rural, 13 = rural cluster
// 21 = suburban, 22 = semi-dense urban, 23 = dense urban, 30 = urban centre
export const SETTLEMENT_CLASSES = {
  WATER: 10,
  VERY_LOW: 11,
  LOW: 12,
  RURAL_CLUSTER: 13,
  SUBURBAN: 21,
  SEMI_DENSE: 22,
  DENSE: 23,
  URBAN_CENTRE: 30,
} as const;

export type GhslRaster = {
  width: number;
  height: number;
  data: Int32Array | Uint8Array | Float32Array;
  rawZipBuffer: Buffer;
};

export async function downloadGhsl(): Promise<GhslRaster> {
  console.log('[settlements] Downloading GHSL GHS-SMOD raster (34 MB)...');
  const res = await fetch(GHSL_SMOD_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
  if (!res.ok) throw new Error(`GHSL download failed: ${res.status}`);

  const rawZipBuffer = Buffer.from(await res.arrayBuffer());
  console.log(`[settlements] Downloaded (${(rawZipBuffer.length / 1024 / 1024).toFixed(0)} MB)`);

  const zip = new AdmZip(rawZipBuffer);
  const tifEntry = zip.getEntries().find((e) => e.entryName.endsWith('.tif') && !e.entryName.includes('.ovr'));
  if (!tifEntry) throw new Error('No .tif found in GHSL ZIP');

  const tifBuffer = tifEntry.getData();
  console.log(`[settlements] Extracted GeoTIFF (${(tifBuffer.length / 1024 / 1024).toFixed(0)} MB)`);

  const { fromArrayBuffer: parseGeoTiff } = await import('geotiff');
  const arrayBuf = tifBuffer.buffer.slice(tifBuffer.byteOffset, tifBuffer.byteOffset + tifBuffer.byteLength) as ArrayBuffer;
  const tiff = await parseGeoTiff(arrayBuf);
  const image = await tiff.getImage();
  const width = image.getWidth();
  const height = image.getHeight();
  const [data] = await image.readRasters();

  console.log(`[settlements] Raster: ${width}x${height} pixels`);
  return { width, height, data: data as Int32Array, rawZipBuffer };
}

/**
 * For a z8 tile, extract full GHSL stats from the raster.
 */
export type TileSettlementStats = {
  z: number;
  x: number;
  y: number;
  hasSettlement: boolean;
  maxClass: number;
  settlementPct: number;
  classHistogram: Record<number, number>; // class → pixel count
  totalPixels: number;
  settledPixels: number;
};

export function computeTileStats(
  raster: GhslRaster,
  z: number,
): TileSettlementStats[] {
  const n = 2 ** z;
  const { width, height, data } = raster;
  const results: TileSettlementStats[] = [];

  for (let tx = 0; tx < n; tx++) {
    for (let ty = 0; ty < n; ty++) {
      const { west: tileWest, east: tileEast, north: tileNorth, south: tileSouth } = tileBounds(tx, ty, z);

      // Convert to raster pixel coords (WGS84: lon -180..180, lat 90..-90)
      const pxLeft = Math.max(0, Math.min(width - 1, Math.floor(((tileWest + 180) / 360) * width)));
      const pxRight = Math.max(0, Math.min(width, Math.floor(((tileEast + 180) / 360) * width)));
      const pxTop = Math.max(0, Math.min(height - 1, Math.floor(((90 - tileNorth) / 180) * height)));
      const pxBottom = Math.max(0, Math.min(height, Math.floor(((90 - tileSouth) / 180) * height)));

      if (pxRight <= pxLeft || pxBottom <= pxTop) continue;

      // Compute full stats for this tile region
      const classHistogram: Record<number, number> = {};
      let maxClass = 0;
      let settledPixels = 0;
      let totalPixels = 0;

      for (let py = pxTop; py < pxBottom; py++) {
        for (let px = pxLeft; px < pxRight; px++) {
          const val = data[py * width + px];
          totalPixels++;

          if (val >= 11) {
            settledPixels++;
            classHistogram[val] = (classHistogram[val] || 0) + 1;
            if (val > maxClass) maxClass = val;
          }
        }
      }

      results.push({
        z: z, x: tx, y: ty,
        hasSettlement: settledPixels > 0,
        maxClass,
        settlementPct: totalPixels > 0 ? (settledPixels / totalPixels) * 100 : 0,
        classHistogram,
        totalPixels,
        settledPixels,
      });
    }

    if (tx % 32 === 0) {
      console.log(`[settlements] ${Math.round((tx / n) * 100)}% — ${tx}/${n} columns`);
    }
  }

  return results;
}
