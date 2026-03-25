import type { Job } from 'bullmq';

import { prisma } from '../db.js';
import { fetchNgaWarnings, buildWarnings } from '../providers/nga/index.js';

const SOURCE = 'nga';

type IngestResult = {
  status: 'ok';
  warningsFetched: number;
  zonesCreated: number;
  durationMs: number;
};

export async function processNgaIngest(job: Job): Promise<IngestResult> {
  const start = Date.now();

  await job.log('Fetching NGA navigational warnings (NAVAREA 8+9)');
  await job.updateProgress(10);

  const warnings = await fetchNgaWarnings();
  await job.log(`Fetched ${warnings.length} active warnings for our region`);
  await job.updateProgress(40);

  const zones = buildWarnings(warnings);
  await job.log(`Extracted ${zones.length} warnings with parseable coordinates`);
  await job.updateProgress(60);

  // Full replace
  await prisma.mapFeature.deleteMany({ where: { source: SOURCE } });

  const records = zones.map((z) => ({
    featureType: 'THREAT_ZONE',
    sourceEventId: z.id,
    actor: 'NGA',
    priority: 'P2',
    category: 'ZONE',
    type: 'CLOSURE',
    status: 'ACTIVE',
    timestamp: null as Date | null,
    geometry: { coordinates: z.coordinates },
    properties: { name: z.name, text: z.text },
    source: SOURCE,
  }));

  if (records.length > 0) {
    await prisma.mapFeature.createMany({ data: records });
  }
  await job.updateProgress(90);

  await upsertSync('ok', null, zones.length, zones.length);
  await job.updateProgress(100);
  await job.log(`Done: ${zones.length} threat zones in ${Date.now() - start}ms`);

  return { status: 'ok', warningsFetched: warnings.length, zonesCreated: zones.length, durationMs: Date.now() - start };
}

async function upsertSync(status: string, error: string | null, lastCount: number, total: number) {
  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: status, lastError: error, lastRunCount: lastCount, totalEvents: total },
    update: { lastRunAt: new Date(), lastRunStatus: status, lastError: error, lastRunCount: lastCount, totalEvents: total },
  });
}
