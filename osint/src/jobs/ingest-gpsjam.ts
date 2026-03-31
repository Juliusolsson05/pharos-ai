import type { Job } from 'bullmq';

import { config } from '../config.js';
import { prisma } from '../db.js';
import { toJson } from '../lib/json.js';
import { fetchGpsJam, buildThreatZones } from '../providers/gpsjam/index.js';

const SOURCE = 'gpsjam';

export async function processGpsjamIngest(job: Job) {
  const start = Date.now();
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
          raw: toJson(h),
        },
        update: { level: h.level, raw: toJson(h), seenAt: new Date() },
      });
      stored++;
    } catch { /* dedupe */ }
  }
  await job.updateProgress(60);

  const zones = buildThreatZones(hexes);
  await prisma.mapFeature.deleteMany({ where: { source: SOURCE } });
  if (zones.length > 0) {
    await prisma.mapFeature.createMany({
      data: zones.map((z) => ({
        featureType: 'THREAT_ZONE', sourceEventId: z.sourceEventId, actor: z.actor,
        priority: z.priority, category: z.category, type: z.type, status: 'ACTIVE',
        timestamp: new Date(), geometry: { coordinates: z.coordinates },
        properties: { name: z.name, color: z.color }, source: SOURCE,
      })),
    });
  }
  await job.updateProgress(100);
  await job.log(`Done: ${stored} hexes, ${zones.length} zones in ${Date.now() - start}ms`);

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
    update: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
  });
  return { status: 'ok', raw: stored, zones: zones.length, durationMs: Date.now() - start };
}
