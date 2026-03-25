import type { Job } from 'bullmq';

import { prisma } from '../db.js';
import { fetchNgaWarnings, buildWarnings } from '../providers/nga/index.js';

const SOURCE = 'nga';

export async function processNgaIngest(job: Job) {
  const start = Date.now();
  await job.log('Fetching NGA navigational warnings (NAVAREA A+P)');

  const warnings = await fetchNgaWarnings();
  await job.log(`Fetched ${warnings.length} active warnings`);
  await job.updateProgress(30);

  // Write to typed nga_warnings table
  let stored = 0;
  for (const w of warnings) {
    try {
      await prisma.ngaWarning.upsert({
        where: { navArea_msgYear_msgNumber: { navArea: w.navArea, msgYear: w.msgYear, msgNumber: w.msgNumber } },
        create: {
          navArea: w.navArea, msgYear: w.msgYear, msgNumber: w.msgNumber,
          subregion: w.subregion || null, text: w.text, status: 'A',
          issueDate: w.issueDate || null, authority: w.authority || null,
          raw: w as unknown as Record<string, unknown>,
        },
        update: { text: w.text, raw: w as unknown as Record<string, unknown> },
      });
      stored++;
    } catch { /* dedupe */ }
  }
  await job.log(`Stored ${stored} warnings`);
  await job.updateProgress(60);

  const zones = buildWarnings(warnings);
  await prisma.mapFeature.deleteMany({ where: { source: SOURCE } });
  if (zones.length > 0) {
    await prisma.mapFeature.createMany({
      data: zones.map((z) => ({
        featureType: 'THREAT_ZONE', sourceEventId: z.id, actor: 'NGA',
        priority: 'P2', category: 'ZONE', type: 'CLOSURE', status: 'ACTIVE',
        timestamp: null as Date | null, geometry: { coordinates: z.coordinates },
        properties: { name: z.name, text: z.text }, source: SOURCE,
      })),
    });
  }
  await job.updateProgress(100);
  await job.log(`Done: ${stored} raw, ${zones.length} zones in ${Date.now() - start}ms`);

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
    update: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
  });
  return { status: 'ok', raw: stored, zones: zones.length, durationMs: Date.now() - start };
}
