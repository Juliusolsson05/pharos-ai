import pLimit from 'p-limit';

import { config } from '../../config.js';
import type { TileCoord } from './regions.js';

const FETCH_TIMEOUT = 15_000;

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
