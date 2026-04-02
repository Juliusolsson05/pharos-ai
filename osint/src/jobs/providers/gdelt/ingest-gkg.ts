import type { Job } from 'bullmq';

import { prisma } from '../../../db.js';
import { toJson } from '../../../lib/json.js';
import { uploadRaw } from '../../../lib/storage.js';
import { fetchLatestGkgUrl, downloadAndParse } from '../../../providers/gdelt-gkg/index.js';

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
          locations: toJson(r.locations),
          persons: r.persons,
          organizations: r.organizations,
          tone: r.tone,
          imageUrl: r.imageUrl || null,
          pageTitle: r.pageTitle,
          raw: toJson(r.raw),
        },
        update: {
          tone: r.tone,
          raw: toJson(r.raw),
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

  await job.updateProgress(95);

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastCursor: gkgUrl, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
    update: { lastCursor: gkgUrl, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: { increment: stored } },
  });

  await job.updateProgress(100);
  await job.log(`Done: ${stored} GKG records in ${Date.now() - start}ms`);
  return { status: 'ok', gkgUrl, totalRows, conflictRelevant: records.length, stored, durationMs: Date.now() - start };
}
