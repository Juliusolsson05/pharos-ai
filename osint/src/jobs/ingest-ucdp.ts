import type { Job } from 'bullmq';

import { prisma } from '../db.js';
import { fetchUcdpEvents, buildHeatPoints, buildStrikes } from '../providers/ucdp/index.js';

const SOURCE = 'ucdp';

export async function processUcdpIngest(job: Job) {
  const start = Date.now();

  await job.log('Fetching UCDP GED conflict events');
  const events = await fetchUcdpEvents();
  await job.log(`Fetched ${events.length} events globally`);
  await job.updateProgress(30);

  const heatPoints = buildHeatPoints(events);
  const strikes = buildStrikes(events);
  await job.log(`Regional: ${strikes.length} strikes, ${heatPoints.length} heat points`);
  await job.updateProgress(50);

  await prisma.mapFeature.deleteMany({ where: { source: SOURCE } });

  const records = [
    ...strikes.map((s) => ({
      featureType: 'STRIKE_ARC',
      sourceEventId: s.sourceEventId,
      actor: s.actor,
      priority: s.priority,
      category: 'KINETIC',
      type: s.type,
      status: 'COMPLETE',
      timestamp: s.timestamp ? new Date(s.timestamp) : null,
      geometry: { position: s.position },
      properties: { label: s.label, severity: s.severity },
      source: SOURCE,
    })),
    ...heatPoints.map((h) => ({
      featureType: 'HEAT_POINT',
      sourceEventId: h.sourceEventId,
      actor: h.actor,
      priority: h.priority,
      category: 'KINETIC',
      type: 'CONFLICT',
      status: null as string | null,
      timestamp: null as Date | null,
      geometry: { position: h.position },
      properties: { weight: h.weight },
      source: SOURCE,
    })),
  ];

  if (records.length > 0) {
    await prisma.mapFeature.createMany({ data: records });
  }
  await job.updateProgress(90);

  const total = strikes.length + heatPoints.length;
  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: total, totalEvents: total },
    update: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: total, totalEvents: total },
  });

  await job.updateProgress(100);
  await job.log(`Done: ${total} features in ${Date.now() - start}ms`);
  return { status: 'ok', fetched: events.length, strikes: strikes.length, heatPoints: heatPoints.length, durationMs: Date.now() - start };
}
