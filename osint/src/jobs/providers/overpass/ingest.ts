import type { Job } from 'bullmq';

import { prisma } from '../../../db.js';
import { fetchOverpass } from '../../../providers/overpass/index.js';

const SOURCE = 'overpass';

export async function processOverpassIngest(job: Job) {
  const start = Date.now();
  const ingestedAt = new Date();
  await job.log('Fetching military installations from OSM Overpass (Middle East)');

  const elements = await fetchOverpass();
  await job.log(`Fetched ${elements.length} raw OSM elements`);
  await job.updateProgress(30);

  let stored = 0;
  for (const el of elements) {
    try {
      await prisma.overpassInstallation.upsert({
        where: { osmType_osmId: { osmType: el.type, osmId: BigInt(el.id) } },
        create: {
          osmType: el.type,
          osmId: BigInt(el.id),
          lat: el.lat,
          lon: el.lon,
          name: el.tags.name || null,
          nameEn: el.tags['name:en'] || null,
          nameAr: el.tags['name:ar'] || null,
          military: el.tags.military || null,
          militaryService: el.tags.military_service || null,
          aeroway: el.tags.aeroway || null,
          landuse: el.tags.landuse || null,
          operator: el.tags.operator || null,
          country: el.tags['addr:country'] || el.tags['is_in:country'] || null,
          wikidata: el.tags.wikidata || null,
          wikipedia: el.tags.wikipedia || null,
          raw: { type: el.type, id: el.id, tags: el.tags },
          ingestedAt,
        },
        update: {
          lat: el.lat,
          lon: el.lon,
          name: el.tags.name || null,
          nameEn: el.tags['name:en'] || null,
          nameAr: el.tags['name:ar'] || null,
          military: el.tags.military || null,
          militaryService: el.tags.military_service || null,
          aeroway: el.tags.aeroway || null,
          landuse: el.tags.landuse || null,
          operator: el.tags.operator || null,
          country: el.tags['addr:country'] || el.tags['is_in:country'] || null,
          wikidata: el.tags.wikidata || null,
          wikipedia: el.tags.wikipedia || null,
          raw: { type: el.type, id: el.id, tags: el.tags },
        },
      });
      stored++;
    } catch { /* skip */ }
  }
  await job.log(`Stored ${stored} installations`);
  await job.updateProgress(60);

  await job.updateProgress(100);
  await job.log(`Done: ${stored} installations in ${Date.now() - start}ms`);

  const totalStored = await prisma.overpassInstallation.count();

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: ingestedAt, lastRunStatus: 'ok', lastRunCount: stored, totalEvents: totalStored },
    update: { lastRunAt: ingestedAt, lastRunStatus: 'ok', lastRunCount: stored, totalEvents: totalStored },
  });
  return { status: 'ok', raw: stored, durationMs: Date.now() - start };
}
