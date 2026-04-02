import type { Job } from 'bullmq';

import { prisma } from '../../../db.js';
import { toJson } from '../../../lib/json.js';
import { fetchMirta } from '../../../providers/mirta/index.js';

const SOURCE = 'mirta';

export async function processMirtaIngest(job: Job) {
  const start = Date.now();

  await job.log('Fetching MIRTA DoD installations from ArcGIS');
  const sites = await fetchMirta();
  await job.log(`Fetched ${sites.length} DoD sites`);
  await job.updateProgress(30);

  // Store raw sites
  let stored = 0;
  for (const s of sites) {
    try {
      await prisma.mirtaSite.upsert({
        where: { objectId: s.objectId },
        create: {
          objectId: s.objectId,
          siteName: s.siteName,
          featureName: s.featureName || null,
          featureDescription: s.featureDescription || null,
          countryName: s.countryName || null,
          stateCode: s.stateCode || null,
          reportingComponent: s.reportingComponent || null,
          operationalStatus: s.operationalStatus || null,
          isJointBase: s.isJointBase,
          lat: s.lat,
          lon: s.lon,
          raw: toJson(s),
        },
        update: {
          siteName: s.siteName,
          operationalStatus: s.operationalStatus || null,
          lat: s.lat,
          lon: s.lon,
          raw: toJson(s),
        },
      });
      stored++;
    } catch { /* dedupe */ }
  }
  await job.log(`Stored ${stored} sites in mirta_sites`);
  await job.updateProgress(60);

  await job.updateProgress(90);

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
    update: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
  });

  await job.updateProgress(100);
  await job.log(`Done: ${stored} sites in ${Date.now() - start}ms`);
  return { status: 'ok', totalSites: sites.length, stored, durationMs: Date.now() - start };
}
