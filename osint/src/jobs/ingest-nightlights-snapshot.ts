import type { Job } from 'bullmq';
import pLimit from 'p-limit';

import { config } from '../config.js';
import { prisma } from '../db.js';
import { uploadTile } from '../lib/storage.js';
import { fetchTilesForDate, toDisplayTile } from '../providers/nightlights/index.js';
import type { TileCoord } from '../providers/nightlights/index.js';

const SOURCE = 'nightlights-snapshot';

/**
 * Full-land snapshot: fetch ALL land tiles and store as WebP display tiles.
 * No ML processing — this is purely for map background fill.
 * Runs every 14 days.
 */
export async function processNightlightsSnapshotIngest(job: Job) {
  const start = Date.now();
  const dateStr =
    job.data.date && job.data.date !== 'today'
      ? job.data.date
      : new Date().toISOString().slice(0, 10);

  // Get ALL land tiles from land_mask_tiles
  const landTiles = await prisma.landMaskTile.findMany({
    where: { z: config.nightlights.zoomLevel, hasLand: true },
    select: { z: true, x: true, y: true },
  });

  const tiles: TileCoord[] = landTiles.map((t) => ({ z: t.z, x: t.x, y: t.y }));
  await job.log(`[snapshot] ${dateStr} — ${tiles.length} land tiles to snapshot`);
  await job.updateProgress(1);

  const processLimit = pLimit(config.nightlights.processConcurrency);
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
          const s3Key = `nightlights-snapshots/${dateStr}/${coord.z}/${coord.x}/${coord.y}.webp`;

          // WebP at quality 60 for all — no tiered quality for background fill
          const displayWebp = await toDisplayTile(png, 60);
          await uploadTile(config.nightlights.tileBucket, s3Key, displayWebp, 'image/webp');

          await prisma.nightlightSnapshot.upsert({
            where: { date_z_x_y: { date: dateStr, z: coord.z, x: coord.x, y: coord.y } },
            create: { date: dateStr, z: coord.z, x: coord.x, y: coord.y, s3Key },
            update: { s3Key },
          });
          stored++;
        } catch {
          errors++;
        }
      });
      processPromises.push(promise);
    }

    const now = Date.now();
    if (now - lastLogAt >= 10_000) {
      const pct = Math.round((fetched / tiles.length) * 100);
      const elapsed = ((now - start) / 1000).toFixed(0);
      await job.log(
        `[snapshot] ${pct}% — fetched ${fetched}/${tiles.length}, stored ${stored}, skipped ${skipped} (${elapsed}s)`,
      );
      await job.updateProgress(Math.min(95, pct));
      lastLogAt = now;
    }
  }

  await Promise.all(processPromises);
  await job.updateProgress(100);

  const duration = Date.now() - start;
  await job.log(`[snapshot] Done: ${stored} stored, ${skipped} skipped, ${errors} errors in ${(duration / 1000).toFixed(1)}s`);

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastCursor: dateStr, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
    update: { lastCursor: dateStr, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: { increment: stored } },
  });

  return { status: 'ok', date: dateStr, stored, skipped, errors, durationMs: duration };
}
