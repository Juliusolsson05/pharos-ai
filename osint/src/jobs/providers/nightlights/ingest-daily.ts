import type { Job } from 'bullmq';
import pLimit from 'p-limit';

import { config } from '../../../config.js';
import { prisma } from '../../../db.js';
import { uploadTile } from '../../../lib/storage.js';
import {
  buildPyramid,
  dailyTileKey,
  fetchLandMaskParentTile,
  getIncludedTiles,
  getQualityForTile,
  fetchTilesForDate,
  resolveNightlightsDate,
  toDisplayTile,
  toMlTile,
} from '../../../providers/nightlights/index.js';
import type { TileCoord } from '../../../providers/nightlights/index.js';

const SOURCE = 'nightlights-daily';
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
    create: {
      source: SOURCE,
      lastCursor: dateStr,
      lastRunAt: new Date(),
      lastRunStatus: status,
      lastRunCount: stored,
      totalEvents: stored,
      lastError: error,
    },
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

export async function processNightlightsDailyIngest(job: Job) {
  const start = Date.now();
  const dateStr = resolveNightlightsDate(job.data.date);

  try {
    const tiles = await getIncludedTiles(config.nightlights.zoomLevel);
    await job.log(`[nightlights] ${dateStr} — ${tiles.length} tiles to process`);
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
            const [{ region, quality }, maskTile] = await Promise.all([
              Promise.resolve(getQualityForTile(coord)),
              fetchLandMaskParentTile(coord),
            ]);
            const s3Key = dailyTileKey(dateStr, coord.z, coord.x, coord.y);

            // Every daily tile produces two artifacts from the same source image:
            // a styled WebP for the frontend map and a compact grayscale payload for
            // radiance analysis / anomaly detection in Postgres.
            const [displayWebp, mlTile] = await Promise.all([
              toDisplayTile({ png, coord, maskTile, quality }),
              toMlTile(png),
            ]);

            await uploadTile(config.nightlights.tileBucket, s3Key, displayWebp, 'image/webp');

            await prisma.nightlightTile.upsert({
              where: { date_z_x_y: { date: dateStr, z: coord.z, x: coord.x, y: coord.y } },
              create: {
                date: dateStr,
                z: coord.z,
                x: coord.x,
                y: coord.y,
                region,
                s3Key,
                mlPixels: new Uint8Array(mlTile.pixels),
                avgRadiance: mlTile.avgRadiance,
              },
              update: {
                s3Key,
                mlPixels: new Uint8Array(mlTile.pixels),
                avgRadiance: mlTile.avgRadiance,
                region,
              },
            });

            stored++;
            storedTiles.push(coord);
          } catch (error) {
            errors++;
            if (errors <= 5) {
              await job.log(`[nightlights] Tile ${coord.z}/${coord.x}/${coord.y} failed: ${error instanceof Error ? error.message : String(error)}`);
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
          `[nightlights] ${pct}% — fetched ${fetched}/${tiles.length}, stored ${stored}, skipped ${skipped}, errors ${errors} (${elapsed}s)`,
        );
        await job.updateProgress(Math.min(90, pct));
        lastLogAt = now;
      }
    }

    await Promise.all(processPromises);

    if (isRunUnhealthy(stored, errors, fetched)) {
      throw new Error(`Unhealthy nightlights run: stored=${stored}, fetched=${fetched}, errors=${errors}, skipped=${skipped}`);
    }

    const pyramid = await buildPyramid({
      kind: 'daily',
      date: dateStr,
      bucket: config.nightlights.tileBucket,
      storedTiles,
      log: async (message) => { await job.log(message); },
    });

    await job.updateProgress(100);

    const duration = Date.now() - start;
    await job.log(
      `[nightlights] Done: ${stored} stored, ${skipped} skipped, ${errors} errors, ${pyramid.totalBuilt} pyramid tiles in ${(duration / 1000).toFixed(1)}s`,
    );

    await upsertSync('ok', dateStr, stored, null);

    return {
      status: 'ok',
      date: dateStr,
      stored,
      skipped,
      errors,
      pyramidTiles: pyramid.totalBuilt,
      durationMs: duration,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await job.log(`[nightlights] Fatal error: ${message}`);
    await upsertSync('error', dateStr, 0, message);
    throw error;
  }
}
