import type { Job } from 'bullmq';

import { config } from '../../../config.js';
import { prisma } from '../../../db.js';
import { toJson } from '../../../lib/json.js';
import { fetchGpsJam } from '../../../providers/gpsjam/index.js';

const SOURCE = 'gpsjam';

export async function processGpsjamIngest(job: Job) {
  const start = Date.now();
  const seenAt = new Date();
  await job.log('Fetching GPS interference data from Wingbits');

  const hexes = await fetchGpsJam(config.gpsjam.apiKey);
  await job.log(`Fetched ${hexes.length} interference hexes globally`);
  await job.updateProgress(30);

  // Write to typed gpsjam_hexes table
  let stored = 0;
  for (const h of hexes) {
    try {
      await prisma.gpsjamHex.upsert({
        where: { h3: h.h3 },
        create: {
          h3: h.h3, lat: h.lat, lon: h.lon, level: h.level, region: h.region || null,
          raw: toJson(h), seenAt,
        },
        update: { lat: h.lat, lon: h.lon, level: h.level, region: h.region || null, raw: toJson(h), seenAt },
      });
      stored++;
    } catch { /* dedupe */ }
  }
  await job.updateProgress(60);

  if (hexes.length > 0) {
    await prisma.gpsjamHexHistory.createMany({
      data: hexes.map((h) => ({
        h3: h.h3,
        seenAt,
        lat: h.lat,
        lon: h.lon,
        level: h.level,
        region: h.region || null,
        raw: toJson(h),
      })),
      skipDuplicates: true,
    });
  }

  await job.updateProgress(100);
  await job.log(`Done: ${stored} hexes in ${Date.now() - start}ms`);

  const totalStored = await prisma.gpsjamHexHistory.count();

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: seenAt, lastRunStatus: 'ok', lastRunCount: stored, totalEvents: totalStored },
    update: { lastRunAt: seenAt, lastRunStatus: 'ok', lastRunCount: stored, totalEvents: totalStored },
  });
  return { status: 'ok', raw: stored, durationMs: Date.now() - start };
}
