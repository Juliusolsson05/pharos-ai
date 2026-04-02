import type { Job } from 'bullmq';

import { prisma } from '../../../db.js';
import { toJson } from '../../../lib/json.js';
import { fetchLatestMentionsUrl, downloadAndParse } from '../../../providers/gdelt-mentions/index.js';

const SOURCE = 'gdelt-mentions';

export async function processMentionsIngest(job: Job) {
  const start = Date.now();

  const mentionsUrl = await fetchLatestMentionsUrl();
  await job.log(`Mentions URL: ${mentionsUrl}`);
  await job.updateProgress(10);

  const sync = await prisma.sourceSync.findUnique({ where: { source: SOURCE } });
  if (sync?.lastCursor === mentionsUrl) {
    await job.log('Already ingested, skipping');
    return { status: 'skipped', durationMs: Date.now() - start };
  }

  const { rows, rawZip: _rawZip } = await downloadAndParse(mentionsUrl);
  await job.log(`Parsed ${rows.length} mention rows`);
  await job.updateProgress(30);

  // Only store mentions for events we have in gdelt_events (high-confidence, conflict-relevant)
  const ourEventIds = new Set(
    (await prisma.gdeltEvent.findMany({ select: { globalEventId: true }, take: 10000 }))
      .map((e) => e.globalEventId),
  );

  const relevant = rows.filter((r) => ourEventIds.has(r.globalEventId));
  await job.log(`${relevant.length} mentions link to our conflict events (of ${rows.length} total)`);
  await job.updateProgress(50);

  let stored = 0;
  for (const r of relevant) {
    try {
      await prisma.gdeltMention.create({
        data: {
          globalEventId: r.globalEventId,
          eventTimeDate: r.eventTimeDate,
          mentionTimeDate: r.mentionTimeDate,
          mentionType: r.mentionType,
          mentionSourceName: r.mentionSourceName,
          mentionIdentifier: r.mentionIdentifier,
          sentenceId: r.sentenceId,
          actor1CharOffset: r.actor1CharOffset,
          actor2CharOffset: r.actor2CharOffset,
          actionCharOffset: r.actionCharOffset,
          inRawText: r.inRawText,
          confidence: r.confidence,
          mentionDocLen: r.mentionDocLen,
          mentionDocTone: r.mentionDocTone,
          mentionDocTranslationInfo: r.mentionDocTranslationInfo || null,
          raw: toJson(r),
        },
      });
      stored++;
    } catch { /* skip dupes */ }
  }
  await job.updateProgress(90);

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastCursor: mentionsUrl, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
    update: { lastCursor: mentionsUrl, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: { increment: stored } },
  });

  await job.updateProgress(100);
  await job.log(`Done: ${stored} mentions stored in ${Date.now() - start}ms`);
  return { status: 'ok', total: rows.length, relevant: relevant.length, stored, durationMs: Date.now() - start };
}
