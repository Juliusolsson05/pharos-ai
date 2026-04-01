import pLimit from 'p-limit';

import { config } from '../../config.js';
import type { TileCoord } from '../../lib/tile-math.js';

const FETCH_TIMEOUT = 15_000;
const LAND_MASK_PARENT_ZOOM = 4;
const LAND_MASK_BASE_URL =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/OSM_Land_Water_Map/default/default/GoogleMapsCompatible_Level9';

const landMaskCache = new Map<string, Promise<Buffer>>();

function tileUrl(date: string, coord: TileCoord): string {
  return `${config.nightlights.gibsBaseUrl}/${date}/${config.nightlights.tileMatrixSet}/${coord.z}/${coord.y}/${coord.x}.png`;
}

/**
 * Fetch a single tile from NASA GIBS. Returns null on 404 (tile not available for this date).
 */
export async function fetchTile(date: string, coord: TileCoord): Promise<Buffer | null> {
  const url = tileUrl(date, coord);
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GIBS ${res.status} for ${url}`);

  return Buffer.from(await res.arrayBuffer());
}

function landMaskParentKey(coord: TileCoord) {
  return `${Math.floor(coord.x / 16)}:${Math.floor(coord.y / 16)}`;
}

function landMaskTileUrl(coord: TileCoord) {
  const x = Math.floor(coord.x / 16);
  const y = Math.floor(coord.y / 16);
  return `${LAND_MASK_BASE_URL}/${LAND_MASK_PARENT_ZOOM}/${y}/${x}.png`;
}

export async function fetchLandMaskParentTile(coord: TileCoord): Promise<Buffer> {
  const key = landMaskParentKey(coord);
  const cached = landMaskCache.get(key);
  if (cached) {
    return cached;
  }

  // One z4 land-mask tile is reused by 256 child z8 nightlight tiles, so caching
  // the in-flight fetch avoids hammering GIBS during dense daily runs.
  const pending = (async () => {
    const url = landMaskTileUrl(coord);
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });

    if (!res.ok) {
      throw new Error(`Land mask ${res.status} for ${url}`);
    }

    return Buffer.from(await res.arrayBuffer());
  })();

  landMaskCache.set(key, pending);

  try {
    return await pending;
  } catch (error) {
    landMaskCache.delete(key);
    throw error;
  }
}

/**
 * Fetch tiles for a date with concurrency control.
 * Yields { coord, png } pairs as they complete.
 */
export async function* fetchTilesForDate(
  date: string,
  tiles: TileCoord[],
  concurrency: number = config.nightlights.fetchConcurrency,
): AsyncGenerator<{ coord: TileCoord; png: Buffer | null }> {
  const limit = pLimit(concurrency);

  // Build all fetch promises up front, but limited concurrency
  const pending = tiles.map((coord) =>
    limit(async () => {
      try {
        const png = await fetchTile(date, coord);
        return { coord, png };
      } catch {
        return { coord, png: null };
      }
    }),
  );

  // Yield results as they resolve
  for (const promise of pending) {
    yield await promise;
  }
}
