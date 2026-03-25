import type { Job } from 'bullmq';

import { prisma } from '../db.js';
import { fetchRadiation } from '../providers/safecast/index.js';

const SOURCE = 'safecast';

// CPM thresholds (counts per minute)
// Normal background: 10-60 CPM
// Elevated: > 100 CPM
// Concerning: > 300 CPM
const ELEVATED_THRESHOLD = 100;

export async function processSafecastIngest(job: Job) {
  const start = Date.now();

  await job.log('Fetching Safecast radiation readings (Middle East)');
  const readings = await fetchRadiation(1000);
  await job.log(`${readings.length} readings in Middle East region`);
  await job.updateProgress(40);

  await prisma.mapFeature.deleteMany({ where: { source: SOURCE } });

  // Only show elevated readings on the map to avoid noise
  const elevated = readings.filter((r) => r.value >= ELEVATED_THRESHOLD);
  await job.log(`${elevated.length} elevated readings (>= ${ELEVATED_THRESHOLD} CPM)`);

  if (elevated.length > 0) {
    await prisma.mapFeature.createMany({
      data: elevated.map((r) => ({
        featureType: 'HEAT_POINT',
        sourceEventId: `safecast-${r.id}`,
        actor: 'RADIATION',
        priority: r.value >= 300 ? 'P1' : 'P2',
        category: 'ENVIRONMENTAL',
        type: 'RADIATION',
        status: 'ACTIVE',
        timestamp: r.capturedAt ? new Date(r.capturedAt) : null,
        geometry: { position: [r.longitude, r.latitude] },
        properties: { weight: Math.round(r.value / 10), value: r.value, unit: r.unit },
        source: SOURCE,
      })),
    });
  }
  await job.updateProgress(90);

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: readings.length, totalEvents: readings.length },
    update: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: readings.length, totalEvents: readings.length },
  });

  await job.updateProgress(100);
  await job.log(`Done: ${readings.length} total, ${elevated.length} elevated in ${Date.now() - start}ms`);
  return { status: 'ok', total: readings.length, elevated: elevated.length, durationMs: Date.now() - start };
}
