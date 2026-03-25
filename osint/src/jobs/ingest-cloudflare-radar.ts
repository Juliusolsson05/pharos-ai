import type { Job } from 'bullmq';

import { prisma } from '../db.js';
import { fetchOutages } from '../providers/cloudflare-radar/index.js';

const SOURCE = 'cloudflare-radar';

export async function processCloudflareRadarIngest(job: Job) {
  const start = Date.now();

  await job.log('Fetching internet outages from Cloudflare Radar (ME region)');
  const outages = await fetchOutages();
  await job.log(`Found ${outages.length} outages in Middle East`);
  await job.updateProgress(40);

  await prisma.mapFeature.deleteMany({ where: { source: SOURCE } });

  const features = outages
    .filter((o) => o.lat !== null && o.lon !== null)
    .map((o) => ({
      featureType: 'THREAT_ZONE',
      sourceEventId: o.id,
      actor: o.asnCountry,
      priority: o.scope === 'country' ? 'P1' as const : 'P2' as const,
      category: 'INFRASTRUCTURE',
      type: 'INTERNET_OUTAGE',
      status: o.endDate ? 'RESOLVED' : 'ACTIVE',
      timestamp: new Date(o.startDate),
      geometry: { position: [o.lon!, o.lat!] },
      properties: {
        name: `Internet outage: ${o.asnName || o.asnCountry}`,
        description: o.description,
        scope: o.scope,
        asn: o.asn,
      },
      source: SOURCE,
    }));

  if (features.length > 0) {
    await prisma.mapFeature.createMany({ data: features });
  }
  await job.updateProgress(90);

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: outages.length, totalEvents: outages.length },
    update: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: outages.length, totalEvents: outages.length },
  });

  await job.updateProgress(100);
  await job.log(`Done: ${features.length} outage features in ${Date.now() - start}ms`);
  return { status: 'ok', outages: outages.length, features: features.length, durationMs: Date.now() - start };
}
