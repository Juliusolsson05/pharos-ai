import type { Job } from 'bullmq';

import { prisma } from '../../../db.js';
import { toJson } from '../../../lib/json.js';
import {
  downloadGpkg,
  extractFacilities,
  extractPipelines,
  extractBasins,
} from '../../../providers/ogim/index.js';

const SOURCE = 'ogim';

export async function processOgimIngest(job: Job) {
  const start = Date.now();
  const log = async (msg: string) => { await job.log(msg); };

  // Step 1: Download GeoPackage (3.1 GB, streams to disk)
  const gpkgPath = await downloadGpkg(log);
  await job.updateProgress(10);

  // Step 2: Extract point facilities (9 layers, ~50K features)
  const facilities = await extractFacilities(gpkgPath, log);
  await job.updateProgress(30);

  // Step 3: Extract filtered pipelines (~10-30K from 1.86M)
  const pipelines = await extractPipelines(gpkgPath, log);
  await job.updateProgress(50);

  // Step 4: Extract basins/fields/blocks (~21K polygons)
  const basins = await extractBasins(gpkgPath, log);
  await job.updateProgress(60);

  // Step 5: Upsert facilities
  let facStored = 0;
  const FAC_BATCH = 100;
  for (let i = 0; i < facilities.length; i += FAC_BATCH) {
    const batch = facilities.slice(i, i + FAC_BATCH);
    await Promise.all(batch.map(async (f) => {
      try {
        await prisma.ogimFacility.upsert({
          where: { ogimId: f.ogimId },
          create: {
            ogimId: f.ogimId,
            category: f.category,
            region: f.region,
            country: f.country,
            stateProvince: f.stateProvince,
            onOffshore: f.onOffshore,
            name: f.name,
            facId: f.facId,
            facType: f.facType,
            facStatus: f.facStatus,
            ogimStatus: f.ogimStatus,
            operator: f.operator,
            installDate: f.installDate,
            commodity: f.commodity,
            lat: f.lat,
            lon: f.lon,
            liqCapacityBpd: f.liqCapacityBpd,
            liqThroughputBpd: f.liqThroughputBpd,
            gasCapacityMmcfd: f.gasCapacityMmcfd,
            gasThroughputMmcfd: f.gasThroughputMmcfd,
            numStorageTanks: f.numStorageTanks,
            numComprUnits: f.numComprUnits,
            siteHp: f.siteHp,
            flareYear: f.flareYear,
            flareTempK: f.flareTempK,
            gasFlaredMmcf: f.gasFlaredMmcf,
            flareSegmentType: f.flareSegmentType,
            raw: toJson(f.raw),
          },
          update: {
            category: f.category,
            region: f.region,
            country: f.country,
            ogimStatus: f.ogimStatus,
            operator: f.operator,
            lat: f.lat,
            lon: f.lon,
            liqCapacityBpd: f.liqCapacityBpd,
            gasCapacityMmcfd: f.gasCapacityMmcfd,
            raw: toJson(f.raw),
          },
        });
        facStored++;
      } catch (e) {
        await job.log(`Failed facility ${f.ogimId}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }));

    if (i % 1000 === 0) {
      const pct = Math.round(60 + (i / facilities.length) * 10);
      await job.updateProgress(pct);
    }
  }
  await job.log(`Stored ${facStored} facilities`);
  await job.updateProgress(72);

  // Step 6: Upsert pipelines
  let pipeStored = 0;
  for (let i = 0; i < pipelines.length; i += FAC_BATCH) {
    const batch = pipelines.slice(i, i + FAC_BATCH);
    await Promise.all(batch.map(async (p) => {
      try {
        await prisma.ogimPipeline.upsert({
          where: { ogimId: p.ogimId },
          create: {
            ogimId: p.ogimId,
            region: p.region,
            country: p.country,
            stateProvince: p.stateProvince,
            onOffshore: p.onOffshore,
            name: p.name,
            facType: p.facType,
            ogimStatus: p.ogimStatus,
            operator: p.operator,
            commodity: p.commodity,
            diameterMm: p.diameterMm,
            lengthKm: p.lengthKm,
            material: p.material,
            liqCapacityBpd: p.liqCapacityBpd,
            gasThroughputMmcfd: p.gasThroughputMmcfd,
            gasCapacityMmcfd: p.gasCapacityMmcfd,
            geometry: toJson(p.geometry),
            raw: toJson(p.raw),
          },
          update: {
            country: p.country,
            ogimStatus: p.ogimStatus,
            operator: p.operator,
            lengthKm: p.lengthKm,
            diameterMm: p.diameterMm,
            geometry: toJson(p.geometry),
            raw: toJson(p.raw),
          },
        });
        pipeStored++;
      } catch (e) {
        await job.log(`Failed pipeline ${p.ogimId}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }));
  }
  await job.log(`Stored ${pipeStored} pipelines`);
  await job.updateProgress(82);

  // Step 7: Upsert basins/fields/blocks
  let basinStored = 0;
  for (let i = 0; i < basins.length; i += FAC_BATCH) {
    const batch = basins.slice(i, i + FAC_BATCH);
    await Promise.all(batch.map(async (b) => {
      try {
        await prisma.ogimBasin.upsert({
          where: { ogimId: b.ogimId },
          create: {
            ogimId: b.ogimId,
            category: b.category,
            region: b.region,
            country: b.country,
            onOffshore: b.onOffshore,
            name: b.name,
            reservoirType: b.reservoirType,
            areaKm2: b.areaKm2,
            geometry: toJson(b.geometry),
            raw: toJson(b.raw),
          },
          update: {
            country: b.country,
            name: b.name,
            reservoirType: b.reservoirType,
            areaKm2: b.areaKm2,
            geometry: toJson(b.geometry),
            raw: toJson(b.raw),
          },
        });
        basinStored++;
      } catch (e) {
        await job.log(`Failed basin ${b.ogimId}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }));
  }
  await job.log(`Stored ${basinStored} basins/fields/blocks`);
  await job.updateProgress(90);

  await job.updateProgress(98);

  const totalStored = facStored + pipeStored + basinStored;
  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: totalStored, totalEvents: totalStored },
    update: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: totalStored, totalEvents: totalStored },
  });

  await job.updateProgress(100);
  const summary = {
    status: 'ok',
    facilities: facStored,
    pipelines: pipeStored,
    basins: basinStored,
    durationMs: Date.now() - start,
  };
  await job.log(`Done: ${JSON.stringify(summary)}`);
  return summary;
}
