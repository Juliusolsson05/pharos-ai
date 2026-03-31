import type { Job } from 'bullmq';

import { prisma } from '../db.js';
import { toJson } from '../lib/json.js';
import { fetchQuakes, buildHeatPoints } from '../providers/usgs/index.js';

const SOURCE = 'usgs';

export async function processUsgsIngest(job: Job) {
  const start = Date.now();
  await job.log('Fetching USGS 4.5+ earthquakes (last 24h)');

  const quakes = await fetchQuakes();
  await job.log(`Fetched ${quakes.length} quakes globally`);
  await job.updateProgress(30);

  // Write to typed usgs_quakes table
  let stored = 0;
  for (const q of quakes) {
    try {
      await prisma.usgsQuake.upsert({
        where: { eventId: q.id },
        create: {
          eventId: q.id, place: q.place, magnitude: q.magnitude,
          depthKm: q.depthKm, lat: q.lat, lon: q.lon,
          occurredAt: new Date(q.occurredAt), sourceUrl: q.sourceUrl,
          raw: toJson(q),
        },
        update: { raw: toJson(q) },
      });
      stored++;
    } catch { /* dedupe */ }
  }
  await job.updateProgress(60);

  const heatPoints = buildHeatPoints(quakes);
  await prisma.mapFeature.deleteMany({ where: { source: SOURCE } });
  if (heatPoints.length > 0) {
    await prisma.mapFeature.createMany({
      data: heatPoints.map((h) => ({
        featureType: 'HEAT_POINT', sourceEventId: h.sourceEventId, actor: h.actor,
        priority: h.priority, category: 'SEISMIC', type: 'EARTHQUAKE',
        status: null as string | null, timestamp: null as Date | null,
        geometry: { position: h.position }, properties: { weight: h.weight }, source: SOURCE,
      })),
    });
  }
  await job.updateProgress(100);
  await job.log(`Done: ${stored} raw, ${heatPoints.length} regional in ${Date.now() - start}ms`);

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
    update: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
  });
  return { status: 'ok', raw: stored, regional: heatPoints.length, durationMs: Date.now() - start };
}
