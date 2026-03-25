import type { Job } from 'bullmq';

import { prisma } from '../db.js';
import { fetchOverpass, buildInstallations } from '../providers/overpass/index.js';

const SOURCE = 'overpass';

type IngestResult = {
  status: 'ok';
  elementsFetched: number;
  installationsStored: number;
  durationMs: number;
};

export async function processOverpassIngest(job: Job): Promise<IngestResult> {
  const start = Date.now();

  await job.log('Fetching military installations from OSM Overpass (Middle East)');
  await job.updateProgress(10);

  const elements = await fetchOverpass();
  await job.log(`Fetched ${elements.length} raw OSM elements`);
  await job.updateProgress(40);

  const installations = buildInstallations(elements);
  await job.log(`Filtered to ${installations.length} named installations`);
  await job.updateProgress(60);

  // Full replace — installations are a static snapshot
  await prisma.mapFeature.deleteMany({ where: { source: SOURCE } });

  const records = installations.map((inst) => ({
    featureType: 'ASSET',
    sourceEventId: inst.id,
    actor: inst.operator || inst.country || 'Unknown',
    priority: 'P3',
    category: 'INSTALLATION',
    type: inst.type,
    status: 'ACTIVE',
    timestamp: null as Date | null,
    geometry: { position: [inst.lon, inst.lat] },
    properties: { name: inst.name, country: inst.country },
    source: SOURCE,
  }));

  if (records.length > 0) {
    await prisma.mapFeature.createMany({ data: records });
  }
  await job.updateProgress(90);

  await upsertSync('ok', null, installations.length, installations.length);
  await job.updateProgress(100);
  await job.log(`Done: ${installations.length} installations in ${Date.now() - start}ms`);

  return { status: 'ok', elementsFetched: elements.length, installationsStored: installations.length, durationMs: Date.now() - start };
}

async function upsertSync(status: string, error: string | null, lastCount: number, total: number) {
  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: status, lastError: error, lastRunCount: lastCount, totalEvents: total },
    update: { lastRunAt: new Date(), lastRunStatus: status, lastError: error, lastRunCount: lastCount, totalEvents: total },
  });
}
