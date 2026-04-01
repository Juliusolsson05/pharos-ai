import type { Job } from 'bullmq';

import { prisma } from '../../../db.js';
import { toJson } from '../../../lib/json.js';
import { fetchCables, fetchLandingPoints } from '../../../providers/submarine-cables/index.js';

const SOURCE = 'submarine-cables';

export async function processSubmarineCablesIngest(job: Job) {
  const start = Date.now();
  const ingestedAt = new Date();

  await job.log('Fetching submarine cables + landing points (Middle East region)');
  const [cables, landingPoints] = await Promise.all([
    fetchCables(),
    fetchLandingPoints(),
  ]);
  await job.log(`Cables through ME: ${cables.length}, Landing points: ${landingPoints.length}`);
  await job.updateProgress(40);

  let cableStored = 0;
  for (const cable of cables) {
    try {
      await prisma.submarineCable.upsert({
        where: { cableId: cable.id },
        create: {
          cableId: cable.id,
          name: cable.name,
          color: cable.color || null,
          geometry: toJson(cable.coordinates),
          raw: toJson(cable),
          ingestedAt,
        },
        update: {
          name: cable.name,
          color: cable.color || null,
          geometry: toJson(cable.coordinates),
          raw: toJson(cable),
        },
      });
      cableStored++;
    } catch { /* dedupe */ }
  }

  let landingPointStored = 0;
  for (const landingPoint of landingPoints) {
    try {
      await prisma.submarineLandingPoint.upsert({
        where: { landingPointId: landingPoint.id },
        create: {
          landingPointId: landingPoint.id,
          name: landingPoint.name,
          lat: landingPoint.lat,
          lon: landingPoint.lon,
          raw: toJson(landingPoint),
          ingestedAt,
        },
        update: {
          name: landingPoint.name,
          lat: landingPoint.lat,
          lon: landingPoint.lon,
          raw: toJson(landingPoint),
        },
      });
      landingPointStored++;
    } catch { /* dedupe */ }
  }

  await job.updateProgress(90);

  const totalStored = await prisma.submarineCable.count() + await prisma.submarineLandingPoint.count();
  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: ingestedAt, lastRunStatus: 'ok', lastRunCount: cableStored + landingPointStored, totalEvents: totalStored },
    update: { lastRunAt: ingestedAt, lastRunStatus: 'ok', lastRunCount: cableStored + landingPointStored, totalEvents: totalStored },
  });

  await job.updateProgress(100);
  await job.log(`Done: ${cableStored} cables, ${landingPointStored} landing points in ${Date.now() - start}ms`);
  return { status: 'ok', cables: cables.length, landingPoints: landingPoints.length, storedCables: cableStored, storedLandingPoints: landingPointStored, durationMs: Date.now() - start };
}
