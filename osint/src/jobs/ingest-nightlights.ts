import type { Job } from 'bullmq';
import pLimit from 'p-limit';

import { config } from '../config.js';
import { prisma } from '../db.js';
import { uploadTile } from '../lib/storage.js';
import {
  getIncludedTiles,
  getQualityForTile,
  fetchTilesForDate,
  toDisplayTile,
  toMlTile,
} from '../providers/nightlights/index.js';

const SOURCE = 'nightlights';

export async function processNightlightsIngest(job: Job) {
  const start = Date.now();
  const dateStr =
    job.data.date && job.data.date !== 'today'
      ? job.data.date
      : new Date().toISOString().slice(0, 10);

  const tiles = await getIncludedTiles(config.nightlights.zoomLevel);
  await job.log(`[nightlights] ${dateStr} — ${tiles.length} tiles to process`);
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
          const { region, quality } = getQualityForTile(coord);
          const s3Key = `nightlights/${dateStr}/${coord.z}/${coord.x}/${coord.y}.webp`;

          const displayWebp = await toDisplayTile(png, quality);
          const { pixels, avgRadiance } = await toMlTile(png);

          await uploadTile(config.nightlights.tileBucket, s3Key, displayWebp, 'image/webp');

          await prisma.nightlightTile.upsert({
            where: { date_z_x_y: { date: dateStr, z: coord.z, x: coord.x, y: coord.y } },
            create: {
              date: dateStr, z: coord.z, x: coord.x, y: coord.y,
              region, s3Key, mlPixels: pixels, avgRadiance,
            },
            update: { s3Key, mlPixels: pixels, avgRadiance, region },
          });
          stored++;
        } catch {
          errors++;
        }
      });
      processPromises.push(promise);
    }

    // Log progress every 10 seconds
    const now = Date.now();
    if (now - lastLogAt >= 10_000) {
      const pct = Math.round((fetched / tiles.length) * 100);
      const elapsed = ((now - start) / 1000).toFixed(0);
      await job.log(
        `[nightlights] ${pct}% — fetched ${fetched}/${tiles.length}, stored ${stored}, skipped ${skipped}, errors ${errors} (${elapsed}s)`,
      );
      await job.updateProgress(Math.min(95, pct));
      lastLogAt = now;
    }
  }

  await Promise.all(processPromises);
  await job.updateProgress(100);

  const duration = Date.now() - start;
  await job.log(
    `[nightlights] Done: ${stored} stored, ${skipped} skipped, ${errors} errors in ${(duration / 1000).toFixed(1)}s`,
  );

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: {
      source: SOURCE, lastCursor: dateStr, lastRunAt: new Date(),
      lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored,
    },
    update: {
      lastCursor: dateStr, lastRunAt: new Date(), lastRunStatus: 'ok',
      lastRunCount: stored, totalEvents: { increment: stored },
    },
  });

  return { status: 'ok', date: dateStr, stored, skipped, errors, durationMs: duration };
}
