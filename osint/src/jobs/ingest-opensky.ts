import type { Job } from 'bullmq';

import { prisma } from '../db.js';
import { fetchOpenskyStates, filterMilitaryFlights, buildAssets } from '../providers/opensky/index.js';

const SOURCE = 'opensky';

export async function processOpenskyIngest(job: Job) {
  const start = Date.now();
  await job.log('Fetching OpenSky aircraft states');

  const states = await fetchOpenskyStates();
  await job.log(`Fetched ${states.length} total aircraft`);
  await job.updateProgress(30);

  const milFlights = filterMilitaryFlights(states);
  await job.log(`Identified ${milFlights.length} military flights`);
  await job.updateProgress(50);

  // Write to typed opensky_sightings table
  let stored = 0;
  for (const f of milFlights) {
    try {
      await prisma.openskySighting.upsert({
        where: { icao24: f.icao24 },
        create: {
          icao24: f.icao24, callsign: f.callsign || null, originCountry: f.country,
          lat: f.lat, lon: f.lon, baroAltitude: f.altitude,
          velocity: f.velocity, heading: f.heading,
          milOperator: f.operator, milCountry: f.country,
          raw: f as unknown as Record<string, unknown>,
        },
        update: {
          callsign: f.callsign || null, lat: f.lat, lon: f.lon,
          baroAltitude: f.altitude, velocity: f.velocity, heading: f.heading,
          raw: f as unknown as Record<string, unknown>, seenAt: new Date(),
        },
      });
      stored++;
    } catch { /* dedupe */ }
  }
  await job.updateProgress(70);

  const assets = buildAssets(milFlights);
  await prisma.mapFeature.deleteMany({ where: { source: SOURCE } });
  if (assets.length > 0) {
    await prisma.mapFeature.createMany({
      data: assets.map((a) => ({
        featureType: 'ASSET', sourceEventId: a.id, actor: a.actor,
        priority: a.priority, category: a.category, type: a.type, status: a.status,
        timestamp: new Date(), geometry: { position: a.position },
        properties: { name: a.name, description: a.description }, source: SOURCE,
      })),
    });
  }
  await job.updateProgress(100);
  await job.log(`Done: ${stored} sightings, ${assets.length} assets in ${Date.now() - start}ms`);

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
    update: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
  });
  return { status: 'ok', total: states.length, military: stored, durationMs: Date.now() - start };
}
