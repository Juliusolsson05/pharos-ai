import type { Job } from 'bullmq';

import { prisma } from '../db.js';
import { uploadRaw } from '../lib/storage.js';
import { fetchLatestGkgUrl, downloadAndParse } from '../providers/gdelt-gkg/index.js';

const SOURCE = 'gdelt-gkg';

export async function processGkgIngest(job: Job) {
  const start = Date.now();

  await job.log('Resolving latest GKG export URL');
  const gkgUrl = await fetchLatestGkgUrl();
  await job.log(`GKG URL: ${gkgUrl}`);
  await job.updateProgress(10);

  // Dedupe by URL
  const sync = await prisma.sourceSync.findUnique({ where: { source: SOURCE } });
  if (sync?.lastCursor === gkgUrl) {
    await job.log('Already ingested this GKG export, skipping');
    return { status: 'skipped', gkgUrl, durationMs: Date.now() - start };
  }

  const { records, rawZip, totalRows } = await downloadAndParse(gkgUrl);
  await job.log(`Parsed ${totalRows} total rows → ${records.length} conflict-relevant with locations`);
  await job.updateProgress(30);

  // Archive raw ZIP
  const ts = gkgUrl.match(/(\d{14})/)?.[1] || Date.now().toString();
  const fileKey = `gdelt-gkg/${ts}.gkg.csv.zip`;
  try { await uploadRaw(fileKey, rawZip); } catch { /* non-fatal */ }
  await job.updateProgress(40);

  // Store typed records
  let stored = 0;
  let errors = 0;
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    try {
      await prisma.gkgRecord.upsert({
        where: { recordId: r.recordId },
        create: {
          recordId: r.recordId,
          date: r.date,
          domain: r.domain,
          url: r.url,
          themes: r.themes,
          locations: r.locations as unknown as Record<string, unknown>,
          persons: r.persons,
          organizations: r.organizations,
          tone: r.tone,
          imageUrl: r.imageUrl || null,
          pageTitle: r.pageTitle,
          raw: r.raw as unknown as Record<string, unknown>,
        },
        update: {
          tone: r.tone,
          raw: r.raw as unknown as Record<string, unknown>,
        },
      });
      stored++;
    } catch {
      errors++;
      if (errors <= 3) await job.log(`Row ${i} failed (${r.recordId})`);
    }
    if (i % 50 === 0) await job.updateProgress(40 + Math.round((i / records.length) * 40));
  }

  await job.log(`Stored ${stored}/${records.length} GKG records (${errors} errors)`);
  await job.updateProgress(80);

  // Derive map features — each GKG record becomes a heat point at its primary location
  const gkgIds = records.map((r) => r.recordId);
  await prisma.mapFeature.deleteMany({
    where: { source: SOURCE, sourceEventId: { in: gkgIds } },
  });

  const features = records
    .filter((r) => r.locations.length > 0)
    .map((r) => {
      const loc = r.locations[0]; // primary location
      return {
        featureType: 'HEAT_POINT',
        sourceEventId: r.recordId,
        actor: r.domain,
        priority: r.tone < -5 ? 'P1' : r.tone < -2 ? 'P2' : 'P3',
        category: 'INTELLIGENCE',
        type: 'NEWS_ARTICLE',
        status: null as string | null,
        timestamp: r.date ? new Date(
          r.date.slice(0, 4) + '-' + r.date.slice(4, 6) + '-' + r.date.slice(6, 8) +
          'T' + r.date.slice(8, 10) + ':' + r.date.slice(10, 12) + ':00Z'
        ) : null,
        geometry: { position: [loc.lon, loc.lat] },
        properties: {
          title: r.pageTitle,
          url: r.url,
          domain: r.domain,
          themes: r.themes.slice(0, 5),
          persons: r.persons.slice(0, 5),
          organizations: r.organizations.slice(0, 5),
          tone: r.tone,
          imageUrl: r.imageUrl || null,
        },
        source: SOURCE,
      };
    });

  if (features.length > 0) {
    await prisma.mapFeature.createMany({ data: features });
  }
  await job.updateProgress(95);

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastCursor: gkgUrl, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
    update: { lastCursor: gkgUrl, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: { increment: stored } },
  });

  await job.updateProgress(100);
  await job.log(`Done: ${stored} GKG records, ${features.length} features in ${Date.now() - start}ms`);
  return { status: 'ok', gkgUrl, totalRows, conflictRelevant: records.length, stored, features: features.length, durationMs: Date.now() - start };
}
