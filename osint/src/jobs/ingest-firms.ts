import type { Job } from 'bullmq';

import { prisma } from '../db.js';
import { fetchFirms, buildHeatPoints } from '../providers/firms/index.js';

const SOURCE = 'firms';

export async function processFirmsIngest(job: Job) {
  const start = Date.now();
  await job.log('Fetching NASA FIRMS thermal hotspots (Middle East, last 24h)');

  const rows = await fetchFirms(1);
  await job.log(`Fetched ${rows.length} raw detections`);
  await job.updateProgress(30);

  // Write to typed firms_detections table
  let stored = 0;
  for (const r of rows) {
    try {
      await prisma.firmsDetection.upsert({
        where: { latitude_longitude_acqDate_acqTime: { latitude: r.latitude, longitude: r.longitude, acqDate: r.acqDate, acqTime: r.acqTime } },
        create: {
          latitude: r.latitude, longitude: r.longitude, brightTi4: r.brightTi4,
          scan: r.scan, track: r.track, acqDate: r.acqDate, acqTime: r.acqTime,
          satellite: r.satellite, confidence: r.confidence, version: r.version,
          brightTi5: r.brightTi5, frp: r.frp, daynight: r.daynight,
          raw: r as unknown as Record<string, unknown>,
        },
        update: {
          frp: r.frp, confidence: r.confidence, brightTi4: r.brightTi4,
          raw: r as unknown as Record<string, unknown>,
        },
      });
      stored++;
    } catch { /* dedupe */ }
  }
  await job.log(`Stored ${stored} detections`);
  await job.updateProgress(60);

  // Derive map features
  const heatPoints = buildHeatPoints(rows);
  await prisma.mapFeature.deleteMany({ where: { source: SOURCE } });
  if (heatPoints.length > 0) {
    await prisma.mapFeature.createMany({
      data: heatPoints.map((h) => ({
        featureType: 'HEAT_POINT', sourceEventId: h.sourceEventId, actor: h.actor,
        priority: h.priority, category: 'KINETIC', type: 'THERMAL',
        status: null as string | null, timestamp: null as Date | null,
        geometry: { position: h.position }, properties: { weight: h.weight }, source: SOURCE,
      })),
    });
  }
  await job.updateProgress(100);
  await job.log(`Done: ${stored} raw, ${heatPoints.length} heat points in ${Date.now() - start}ms`);

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
    update: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
  });
  return { status: 'ok', raw: stored, heatPoints: heatPoints.length, durationMs: Date.now() - start };
}
