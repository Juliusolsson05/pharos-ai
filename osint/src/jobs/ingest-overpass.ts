import type { Job } from 'bullmq';

import { prisma } from '../db.js';
import { fetchOverpass, buildInstallations } from '../providers/overpass/index.js';

const SOURCE = 'overpass';

export async function processOverpassIngest(job: Job) {
  const start = Date.now();
  await job.log('Fetching military installations from OSM Overpass (Middle East)');

  const elements = await fetchOverpass();
  await job.log(`Fetched ${elements.length} raw OSM elements`);
  await job.updateProgress(30);

  // Full replace — installations are a static snapshot
  await prisma.overpassInstallation.deleteMany({});
  let stored = 0;
  for (const el of elements) {
    try {
      await prisma.overpassInstallation.create({
        data: {
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
        },
      });
      stored++;
    } catch { /* skip */ }
  }
  await job.log(`Stored ${stored} installations`);
  await job.updateProgress(60);

  // Derive map features
  const installations = buildInstallations(elements);
  await prisma.mapFeature.deleteMany({ where: { source: SOURCE } });
  if (installations.length > 0) {
    await prisma.mapFeature.createMany({
      data: installations.map((inst) => ({
        featureType: 'ASSET', sourceEventId: inst.id, actor: inst.operator || inst.country || 'Unknown',
        priority: 'P3', category: 'INSTALLATION', type: inst.type, status: 'ACTIVE',
        timestamp: null as Date | null, geometry: { position: [inst.lon, inst.lat] },
        properties: { name: inst.name, country: inst.country }, source: SOURCE,
      })),
    });
  }
  await job.updateProgress(100);
  await job.log(`Done: ${stored} raw, ${installations.length} named in ${Date.now() - start}ms`);

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
    update: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
  });
  return { status: 'ok', raw: stored, named: installations.length, durationMs: Date.now() - start };
}
