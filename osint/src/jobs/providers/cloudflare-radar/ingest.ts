import type { Job } from 'bullmq';

import { prisma } from '../../../db.js';
import { toJson } from '../../../lib/json.js';
import { fetchOutages } from '../../../providers/cloudflare-radar/index.js';

const SOURCE = 'cloudflare-radar';

export async function processCloudflareRadarIngest(job: Job) {
  const start = Date.now();
  const seenAt = new Date();

  await job.log('Fetching internet outages from Cloudflare Radar (ME region)');
  const outages = await fetchOutages();
  await job.log(`Found ${outages.length} outages in Middle East`);
  await job.updateProgress(40);

  let stored = 0;
  for (const outage of outages) {
    try {
      await prisma.cloudflareRadarOutage.upsert({
        where: { outageId: outage.id },
        create: {
          outageId: outage.id,
          asn: outage.asn,
          asnName: outage.asnName || null,
          asnCountry: outage.asnCountry,
          startDate: outage.startDate,
          endDate: outage.endDate,
          scope: outage.scope,
          description: outage.description,
          linkedUrl: outage.linkedUrl || null,
          lat: outage.lat,
          lon: outage.lon,
          raw: toJson(outage),
          firstSeenAt: seenAt,
          lastSeenAt: seenAt,
        },
        update: {
          asn: outage.asn,
          asnName: outage.asnName || null,
          asnCountry: outage.asnCountry,
          startDate: outage.startDate,
          endDate: outage.endDate,
          scope: outage.scope,
          description: outage.description,
          linkedUrl: outage.linkedUrl || null,
          lat: outage.lat,
          lon: outage.lon,
          raw: toJson(outage),
          lastSeenAt: seenAt,
        },
      });
      stored++;
    } catch { /* dedupe */ }
  }

  await job.updateProgress(90);

  const totalStored = await prisma.cloudflareRadarOutage.count();

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: seenAt, lastRunStatus: 'ok', lastRunCount: stored, totalEvents: totalStored },
    update: { lastRunAt: seenAt, lastRunStatus: 'ok', lastRunCount: stored, totalEvents: totalStored },
  });

  await job.updateProgress(100);
  await job.log(`Done: ${stored} outages stored in ${Date.now() - start}ms`);
  return { status: 'ok', outages: outages.length, stored, durationMs: Date.now() - start };
}
