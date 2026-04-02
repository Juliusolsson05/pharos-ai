import type { Job } from 'bullmq';

import { prisma } from '../../../db.js';
import { toJson } from '../../../lib/json.js';
import { fetchRadiation } from '../../../providers/safecast/index.js';

const SOURCE = 'safecast';

// CPM thresholds (counts per minute)
// Normal background: 10-60 CPM
// Elevated: > 100 CPM
// Concerning: > 300 CPM
const ELEVATED_THRESHOLD = 100;

export async function processSafecastIngest(job: Job) {
  const start = Date.now();
  const ingestedAt = new Date();

  await job.log('Fetching Safecast radiation readings (Middle East)');
  const readings = await fetchRadiation(1000);
  await job.log(`${readings.length} readings in Middle East region`);
  await job.updateProgress(40);

  // Only show elevated readings on the map to avoid noise
  const elevated = readings.filter((r) => r.value >= ELEVATED_THRESHOLD);
  await job.log(`${elevated.length} elevated readings (>= ${ELEVATED_THRESHOLD} CPM)`);

  let stored = 0;
  for (const reading of readings) {
    try {
      await prisma.safecastReading.upsert({
        where: { readingId: reading.id },
        create: {
          readingId: reading.id,
          latitude: reading.latitude,
          longitude: reading.longitude,
          value: reading.value,
          unit: reading.unit,
          capturedAt: reading.capturedAt,
          deviceId: reading.deviceId,
          locationName: reading.locationName || null,
          raw: toJson(reading),
          ingestedAt,
        },
        update: {
          latitude: reading.latitude,
          longitude: reading.longitude,
          value: reading.value,
          unit: reading.unit,
          capturedAt: reading.capturedAt,
          deviceId: reading.deviceId,
          locationName: reading.locationName || null,
          raw: toJson(reading),
        },
      });
      stored++;
    } catch { /* dedupe */ }
  }

  await job.updateProgress(90);

  const totalStored = await prisma.safecastReading.count();

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: ingestedAt, lastRunStatus: 'ok', lastRunCount: stored, totalEvents: totalStored },
    update: { lastRunAt: ingestedAt, lastRunStatus: 'ok', lastRunCount: stored, totalEvents: totalStored },
  });

  await job.updateProgress(100);
  await job.log(`Done: ${stored} total, ${elevated.length} elevated in ${Date.now() - start}ms`);
  return { status: 'ok', total: readings.length, stored, elevated: elevated.length, durationMs: Date.now() - start };
}
