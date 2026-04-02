import type { Job } from 'bullmq';

import { prisma } from '../../../db.js';
import { fetchUcdpEvents, buildHeatPoints, buildStrikes } from '../../../providers/ucdp/index.js';

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

  await job.updateProgress(90);

  const total = strikes.length + heatPoints.length;
  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: total, totalEvents: total },
    update: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: total, totalEvents: total },
  });

  await job.updateProgress(100);
  await job.log(`Done: ${total} regional events in ${Date.now() - start}ms`);
  return { status: 'ok', fetched: events.length, strikes: strikes.length, heatPoints: heatPoints.length, durationMs: Date.now() - start };
}
