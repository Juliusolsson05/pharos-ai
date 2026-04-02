import type { Job } from 'bullmq';

import { prisma } from '../../../db.js';
import { toJson } from '../../../lib/json.js';
import { fetchLatestGfgUrl, downloadAndParse } from '../../../providers/gdelt-gfg/index.js';

const SOURCE = 'gdelt-gfg';

const CONFLICT_KEYWORDS = [
  'iran', 'israel', 'houthi', 'hezbollah', 'gaza', 'lebanon', 'missile',
  'strike', 'military', 'war', 'bomb', 'attack', 'troops', 'drone',
  'ceasefire', 'nuclear', 'sanctions', 'hormuz', 'red-sea', 'yemen',
  'idf', 'irgc', 'pentagon', 'centcom', 'navy', 'airstrike',
];

export async function processGfgIngest(job: Job) {
  const start = Date.now();

  const gfgUrl = await fetchLatestGfgUrl();
  await job.log(`GFG URL: ${gfgUrl}`);
  await job.updateProgress(10);

  const sync = await prisma.sourceSync.findUnique({ where: { source: SOURCE } });
  if (sync?.lastCursor === gfgUrl) {
    await job.log('Already ingested, skipping');
    return { status: 'skipped', durationMs: Date.now() - start };
  }

  await job.log('Downloading GFG (this may take a moment — 10M+ links)...');
  const links = await downloadAndParse(gfgUrl);
  await job.log(`Parsed ${links.length} frontpage links`);
  await job.updateProgress(40);

  // Filter to conflict-relevant by link text and URL
  const relevant = links.filter((l) => {
    const text = (l.linkText + ' ' + l.toUrl).toLowerCase();
    return CONFLICT_KEYWORDS.some((kw) => text.includes(kw));
  });
  await job.log(`${relevant.length} conflict-relevant frontpage links`);
  await job.updateProgress(60);

  const hour = gfgUrl.match(/(\d{10})/)?.[1] || '';

  // Clear old data for this hour
  await prisma.gdeltFrontpage.deleteMany({ where: { hour } });

  let stored = 0;
  for (const l of relevant) {
    try {
      await prisma.gdeltFrontpage.create({
        data: {
          hour,
          domain: new URL(l.fromUrl).hostname,
          url: l.toUrl,
          position: l.linkId,
          raw: toJson({ ...l, fromUrl: l.fromUrl, linkPercent: l.linkPercent }),
        },
      });
      stored++;
    } catch { /* skip */ }
  }
  await job.updateProgress(90);

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastCursor: gfgUrl, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
    update: { lastCursor: gfgUrl, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: { increment: stored } },
  });

  await job.updateProgress(100);
  await job.log(`Done: ${stored} frontpage links from ${relevant.length} relevant in ${Date.now() - start}ms`);
  return { status: 'ok', totalLinks: links.length, relevant: relevant.length, stored, durationMs: Date.now() - start };
}
