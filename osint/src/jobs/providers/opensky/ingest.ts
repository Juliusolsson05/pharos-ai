import type { Job } from 'bullmq';

import { prisma } from '../../../db.js';
import { toJson } from '../../../lib/json.js';
import { fetchOpenskyStates, filterMilitaryFlights } from '../../../providers/opensky/index.js';

const SOURCE = 'opensky';

export async function processOpenskyIngest(job: Job) {
  const start = Date.now();
  const seenAt = new Date();
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
          raw: toJson(f), seenAt,
        },
        update: {
          callsign: f.callsign || null, lat: f.lat, lon: f.lon,
          baroAltitude: f.altitude, velocity: f.velocity, heading: f.heading,
          raw: toJson(f), seenAt,
        },
      });
      stored++;
    } catch { /* dedupe */ }
  }
  await job.updateProgress(70);

  if (milFlights.length > 0) {
    await prisma.openskySightingHistory.createMany({
      data: milFlights.map((f) => ({
        icao24: f.icao24,
        seenAt,
        callsign: f.callsign || null,
        originCountry: f.country,
        lat: f.lat,
        lon: f.lon,
        baroAltitude: f.altitude,
        velocity: f.velocity,
        heading: f.heading,
        milOperator: f.operator,
        milCountry: f.country,
        raw: toJson(f),
      })),
      skipDuplicates: true,
    });
  }

  await job.updateProgress(100);
  await job.log(`Done: ${stored} sightings in ${Date.now() - start}ms`);

  const totalStored = await prisma.openskySightingHistory.count();

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: seenAt, lastRunStatus: 'ok', lastRunCount: stored, totalEvents: totalStored },
    update: { lastRunAt: seenAt, lastRunStatus: 'ok', lastRunCount: stored, totalEvents: totalStored },
  });
  return { status: 'ok', total: states.length, military: stored, durationMs: Date.now() - start };
}
