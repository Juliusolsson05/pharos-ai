import type { Job } from 'bullmq';

import { prisma } from '../db.js';
import { fetchCables, fetchLandingPoints } from '../providers/submarine-cables/index.js';

const SOURCE = 'submarine-cables';

export async function processSubmarineCablesIngest(job: Job) {
  const start = Date.now();

  await job.log('Fetching submarine cables + landing points (Middle East region)');
  const [cables, landingPoints] = await Promise.all([
    fetchCables(),
    fetchLandingPoints(),
  ]);
  await job.log(`Cables through ME: ${cables.length}, Landing points: ${landingPoints.length}`);
  await job.updateProgress(40);

  await prisma.mapFeature.deleteMany({ where: { source: SOURCE } });

  const features = [
    // Cables as THREAT_ZONE (line geometry stored as coordinate arrays)
    ...cables.map((c) => ({
      featureType: 'THREAT_ZONE',
      sourceEventId: `cable-${c.id}`,
      actor: 'INFRASTRUCTURE',
      priority: 'P3',
      category: 'INFRASTRUCTURE',
      type: 'SUBMARINE_CABLE',
      status: 'ACTIVE',
      timestamp: null as Date | null,
      geometry: { coordinates: c.coordinates, type: 'MultiLineString' },
      properties: { name: c.name, color: c.color },
      source: SOURCE,
    })),
    // Landing points as ASSET
    ...landingPoints.map((lp) => ({
      featureType: 'ASSET',
      sourceEventId: `landing-${lp.id}`,
      actor: 'INFRASTRUCTURE',
      priority: 'P3',
      category: 'INFRASTRUCTURE',
      type: 'INFRASTRUCTURE',
      status: 'ACTIVE',
      timestamp: null as Date | null,
      geometry: { position: [lp.lon, lp.lat] },
      properties: { name: lp.name },
      source: SOURCE,
    })),
  ];

  if (features.length > 0) {
    await prisma.mapFeature.createMany({ data: features });
  }
  await job.updateProgress(90);

  const total = cables.length + landingPoints.length;
  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: total, totalEvents: total },
    update: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: total, totalEvents: total },
  });

  await job.updateProgress(100);
  await job.log(`Done: ${cables.length} cables, ${landingPoints.length} landing points in ${Date.now() - start}ms`);
  return { status: 'ok', cables: cables.length, landingPoints: landingPoints.length, durationMs: Date.now() - start };
}
