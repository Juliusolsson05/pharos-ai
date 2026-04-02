import type { Job } from 'bullmq';
import pLimit from 'p-limit';

import { config } from '../../../config.js';
import { prisma } from '../../../db.js';
import { uploadTile } from '../../../lib/storage.js';
import {
  buildPyramid,
  fetchLandMaskParentTile,
  fetchTilesForDate,
  getLandTiles,
  resolveNightlightsDate,
  snapshotTileKey,
  toDisplayTile,
} from '../../../providers/nightlights/index.js';
import type { TileCoord } from '../../../providers/nightlights/index.js';

const SOURCE = 'nightlights-snapshot';
const MAX_ERROR_RATIO = 0.2;

function isRunUnhealthy(stored: number, errors: number, attempted: number) {
  if (stored === 0) {
    return true;
  }

  if (attempted === 0) {
    return true;
  }

  return errors / attempted > MAX_ERROR_RATIO;
}

async function upsertSync(status: 'ok' | 'error', dateStr: string, stored: number, error: string | null) {
  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastCursor: dateStr, lastRunAt: new Date(), lastRunStatus: status, lastRunCount: stored, totalEvents: stored, lastError: error },
    update: {
      lastCursor: dateStr,
      lastRunAt: new Date(),
      lastRunStatus: status,
      lastRunCount: stored,
      totalEvents: status === 'ok' ? { increment: stored } : undefined,
      lastError: error,
    },
  });
}

/**
 * Full-land snapshot: fetch ALL land tiles and store as WebP display tiles.
 * No ML processing — this is purely for map background fill.
 * Runs every 14 days.
 *
 * The snapshot exists to give the frontend a complete visual baseline, while the
 * daily ingest stays selective and analysis-focused.
 */
export async function processNightlightsSnapshotIngest(job: Job) {
  const start = Date.now();
  const dateStr = resolveNightlightsDate(job.data.date);

  try {
    const tiles: TileCoord[] = await getLandTiles(config.nightlights.zoomLevel);
    await job.log(`[snapshot] ${dateStr} — ${tiles.length} land tiles to snapshot`);
    await job.updateProgress(1);

    const processLimit = pLimit(config.nightlights.processConcurrency);
    const storedTiles: TileCoord[] = [];
    let fetched = 0;
    let stored = 0;
    let skipped = 0;
    let errors = 0;

    const processPromises: Promise<void>[] = [];
    let lastLogAt = Date.now();

    for await (const { coord, png } of fetchTilesForDate(dateStr, tiles)) {
      fetched++;

      if (!png) {
        skipped++;
      } else {
        const promise = processLimit(async () => {
          try {
            const maskTile = await fetchLandMaskParentTile(coord);
            const s3Key = snapshotTileKey(dateStr, coord.z, coord.x, coord.y);

            const displayWebp = await toDisplayTile({ png, coord, maskTile, quality: 60 });
            await uploadTile(config.nightlights.tileBucket, s3Key, displayWebp, 'image/webp');

            await prisma.nightlightSnapshot.upsert({
              where: { date_z_x_y: { date: dateStr, z: coord.z, x: coord.x, y: coord.y } },
              create: { date: dateStr, z: coord.z, x: coord.x, y: coord.y, s3Key },
              update: { s3Key },
            });

            stored++;
            storedTiles.push(coord);
          } catch (error) {
            errors++;
            if (errors <= 5) {
              await job.log(`[snapshot] Tile ${coord.z}/${coord.x}/${coord.y} failed: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        });
        processPromises.push(promise);
      }

      const now = Date.now();
      if (now - lastLogAt >= 10_000) {
        const pct = Math.round((fetched / tiles.length) * 100);
        const elapsed = ((now - start) / 1000).toFixed(0);
        await job.log(
          `[snapshot] ${pct}% — fetched ${fetched}/${tiles.length}, stored ${stored}, skipped ${skipped}, errors ${errors} (${elapsed}s)`,
        );
        await job.updateProgress(Math.min(90, pct));
        lastLogAt = now;
      }
    }

    await Promise.all(processPromises);

    if (isRunUnhealthy(stored, errors, fetched)) {
      throw new Error(`Unhealthy snapshot run: stored=${stored}, fetched=${fetched}, errors=${errors}, skipped=${skipped}`);
    }

    const pyramid = await buildPyramid({
      kind: 'snapshot',
      date: dateStr,
      bucket: config.nightlights.tileBucket,
      storedTiles,
      log: async (message) => { await job.log(message); },
    });

    await job.updateProgress(100);

    const duration = Date.now() - start;
    await job.log(`[snapshot] Done: ${stored} stored, ${skipped} skipped, ${errors} errors, ${pyramid.totalBuilt} pyramid tiles in ${(duration / 1000).toFixed(1)}s`);

    await upsertSync('ok', dateStr, stored, null);
    return { status: 'ok', date: dateStr, stored, skipped, errors, pyramidTiles: pyramid.totalBuilt, durationMs: duration };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await job.log(`[snapshot] Fatal error: ${message}`);
    await upsertSync('error', dateStr, 0, message);
    throw error;
  }
}
