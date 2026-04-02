import type { Job } from 'bullmq';

import { prisma } from '../../../db.js';
import { toJson } from '../../../lib/json.js';
import { fetchEonet, fetchGdacs } from '../../../providers/eonet/index.js';

const SOURCE = 'eonet';

export async function processEonetIngest(job: Job) {
  const start = Date.now();
  const ingestedAt = new Date();

  await job.log('Fetching natural events from NASA EONET + GDACS');
  const [eonetEvents, gdacsEvents] = await Promise.all([
    fetchEonet(30),
    fetchGdacs(),
  ]);
  await job.log(`EONET: ${eonetEvents.length} events, GDACS: ${gdacsEvents.length} events`);
  await job.updateProgress(40);

  const all = [...eonetEvents, ...gdacsEvents];

  let stored = 0;
  for (const event of all) {
    try {
      await prisma.eonetEvent.upsert({
        where: { origin_eventId: { origin: event.origin, eventId: event.id } },
        create: {
          eventId: event.id,
          origin: event.origin,
          title: event.title,
          category: event.category,
          lat: event.lat,
          lon: event.lon,
          eventDate: event.date,
          sourceUrl: event.sourceUrl || null,
          raw: toJson(event),
          ingestedAt,
        },
        update: {
          title: event.title,
          category: event.category,
          lat: event.lat,
          lon: event.lon,
          eventDate: event.date,
          sourceUrl: event.sourceUrl || null,
          raw: toJson(event),
        },
      });
      stored++;
    } catch { /* dedupe */ }
  }

  await job.updateProgress(90);

  const totalStored = await prisma.eonetEvent.count();

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: ingestedAt, lastRunStatus: 'ok', lastRunCount: stored, totalEvents: totalStored },
    update: { lastRunAt: ingestedAt, lastRunStatus: 'ok', lastRunCount: stored, totalEvents: totalStored },
  });

  await job.updateProgress(100);
  await job.log(`Done: ${stored} events stored in ${Date.now() - start}ms`);
  return { status: 'ok', eonet: eonetEvents.length, gdacs: gdacsEvents.length, stored, durationMs: Date.now() - start };
}
