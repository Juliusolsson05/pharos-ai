import type { Job } from 'bullmq';

import { prisma } from '../../../db.js';
import { toJson } from '../../../lib/json.js';
import { fetchPowerPlants } from '../../../providers/power-plants/index.js';

const SOURCE = 'power-plants';

export async function processPowerPlantsIngest(job: Job) {
  const start = Date.now();

  await job.log('Fetching WRI Global Power Plant Database');
  const plants = await fetchPowerPlants();
  await job.log(`Fetched ${plants.length} power plants`);
  await job.updateProgress(20);

  // Batch upsert — 34k+ records, use batches to avoid overwhelming Prisma
  let stored = 0;
  const BATCH = 100;
  for (let i = 0; i < plants.length; i += BATCH) {
    const batch = plants.slice(i, i + BATCH);
    await Promise.all(batch.map(async (p) => {
      try {
        await prisma.powerPlant.upsert({
          where: { gppdIdnr: p.gppdIdnr },
          create: {
            gppdIdnr: p.gppdIdnr,
            name: p.name,
            countryCode: p.countryCode,
            countryLong: p.countryLong,
            lat: p.lat,
            lon: p.lon,
            capacityMw: p.capacityMw,
            primaryFuel: p.primaryFuel,
            otherFuel1: p.otherFuel1 || null,
            otherFuel2: p.otherFuel2 || null,
            otherFuel3: p.otherFuel3 || null,
            commissioningYear: p.commissioningYear,
            owner: p.owner || null,
            sourceUrl: p.sourceUrl || null,
            estimatedGwh: p.estimatedGwh,
            raw: toJson(p.raw),
          },
          update: {
            name: p.name,
            countryCode: p.countryCode,
            countryLong: p.countryLong,
            lat: p.lat,
            lon: p.lon,
            capacityMw: p.capacityMw,
            primaryFuel: p.primaryFuel,
            otherFuel1: p.otherFuel1 || null,
            otherFuel2: p.otherFuel2 || null,
            otherFuel3: p.otherFuel3 || null,
            commissioningYear: p.commissioningYear,
            owner: p.owner || null,
            sourceUrl: p.sourceUrl || null,
            estimatedGwh: p.estimatedGwh,
            raw: toJson(p.raw),
          },
        });
        stored++;
      } catch (e) {
        await job.log(`Failed: ${p.name} (${p.gppdIdnr}) — ${e instanceof Error ? e.message : String(e)}`);
      }
    }));

    const pct = Math.round(20 + (i / plants.length) * 50);
    await job.updateProgress(pct);
  }
  await job.log(`Stored ${stored} power plants`);
  await job.updateProgress(75);

  await job.updateProgress(95);

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
    update: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
  });

  await job.updateProgress(100);
  await job.log(`Done: ${stored} plants in ${Date.now() - start}ms`);
  return { status: 'ok', totalPlants: plants.length, stored, durationMs: Date.now() - start };
}
