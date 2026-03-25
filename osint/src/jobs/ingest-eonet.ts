import type { Job } from 'bullmq';

import { prisma } from '../db.js';
import { fetchEonet, fetchGdacs, buildHeatPoints } from '../providers/eonet/index.js';

const SOURCE = 'eonet';

export async function processEonetIngest(job: Job) {
  const start = Date.now();

  await job.log('Fetching natural events from NASA EONET + GDACS');
  const [eonetEvents, gdacsEvents] = await Promise.all([
    fetchEonet(30),
    fetchGdacs(),
  ]);
  await job.log(`EONET: ${eonetEvents.length} events, GDACS: ${gdacsEvents.length} events`);
  await job.updateProgress(40);

  const all = [...eonetEvents, ...gdacsEvents];

  // Derive map features
  const heatPoints = buildHeatPoints(all);
  await prisma.mapFeature.deleteMany({ where: { source: SOURCE } });

  if (heatPoints.length > 0) {
    await prisma.mapFeature.createMany({
      data: heatPoints.map((h) => ({
        featureType: 'HEAT_POINT',
        sourceEventId: h.sourceEventId,
        actor: h.actor,
        priority: h.priority,
        category: 'NATURAL',
        type: 'NATURAL_EVENT',
        status: null as string | null,
        timestamp: null as Date | null,
        geometry: { position: h.position },
        properties: { weight: h.weight },
        source: SOURCE,
      })),
    });
  }
  await job.updateProgress(90);

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: all.length, totalEvents: all.length },
    update: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: all.length, totalEvents: all.length },
  });

  await job.updateProgress(100);
  await job.log(`Done: ${all.length} events, ${heatPoints.length} heat points in ${Date.now() - start}ms`);
  return { status: 'ok', eonet: eonetEvents.length, gdacs: gdacsEvents.length, heatPoints: heatPoints.length, durationMs: Date.now() - start };
}
