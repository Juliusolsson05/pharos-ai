import type { Job } from 'bullmq';

import { prisma } from '../db.js';
import { fetchFirms, buildHeatPoints } from '../providers/firms/index.js';

const SOURCE = 'firms';

type IngestResult = {
  status: 'ok' | 'skipped';
  rowsFetched: number;
  heatPointsCreated: number;
  durationMs: number;
};

export async function processFirmsIngest(job: Job): Promise<IngestResult> {
  const start = Date.now();

  await job.log('Fetching NASA FIRMS thermal hotspots (Middle East, last 24h)');
  await job.updateProgress(10);

  const rows = await fetchFirms(1);
  await job.log(`Fetched ${rows.length} raw detections`);
  await job.updateProgress(30);

  const heatPoints = buildHeatPoints(rows);
  await job.log(`Filtered to ${heatPoints.length} nominal/high confidence heat points`);
  await job.updateProgress(50);

  if (heatPoints.length === 0) {
    await upsertSync('ok', null, 0, 0);
    return { status: 'ok', rowsFetched: rows.length, heatPointsCreated: 0, durationMs: Date.now() - start };
  }

  // Clear old FIRMS features and replace with fresh batch
  await prisma.mapFeature.deleteMany({ where: { source: SOURCE } });

  const records = heatPoints.map((h) => ({
    featureType: 'HEAT_POINT',
    sourceEventId: h.sourceEventId,
    actor: h.actor,
    priority: h.priority,
    category: 'KINETIC',
    type: 'THERMAL',
    status: null as string | null,
    timestamp: null as Date | null,
    geometry: { position: h.position },
    properties: { weight: h.weight },
    source: SOURCE,
  }));

  await prisma.mapFeature.createMany({ data: records });
  await job.updateProgress(90);

  await upsertSync('ok', null, heatPoints.length, heatPoints.length);
  await job.updateProgress(100);
  await job.log(`Done: ${heatPoints.length} heat points in ${Date.now() - start}ms`);

  return { status: 'ok', rowsFetched: rows.length, heatPointsCreated: heatPoints.length, durationMs: Date.now() - start };
}

async function upsertSync(status: string, error: string | null, lastCount: number, total: number) {
  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: status, lastError: error, lastRunCount: lastCount, totalEvents: total },
    update: { lastRunAt: new Date(), lastRunStatus: status, lastError: error, lastRunCount: lastCount, totalEvents: total },
  });
}
