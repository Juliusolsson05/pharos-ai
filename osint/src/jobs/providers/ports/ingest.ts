import type { Job } from 'bullmq';

import { prisma } from '../../../db.js';
import { toJson } from '../../../lib/json.js';
import { fetchPorts } from '../../../providers/ports/index.js';

const SOURCE = 'ports';

export async function processPortsIngest(job: Job) {
  const start = Date.now();

  await job.log('Fetching NGA World Port Index (Pub 150)');
  const ports = await fetchPorts();
  await job.log(`Fetched ${ports.length} ports`);
  await job.updateProgress(30);

  let stored = 0;
  for (const p of ports) {
    try {
      await prisma.port.upsert({
        where: { wpiNumber: p.wpiNumber },
        create: {
          wpiNumber: p.wpiNumber,
          name: p.name,
          alternateName: p.alternateName || null,
          countryCode: p.countryCode,
          regionName: p.regionName || null,
          worldWaterBody: p.worldWaterBody || null,
          unLocode: p.unLocode || null,
          lat: p.lat,
          lon: p.lon,
          harborSize: p.harborSize || null,
          harborType: p.harborType || null,
          harborUse: p.harborUse || null,
          shelterAfforded: p.shelterAfforded || null,
          maxVesselLength: p.maxVesselLength,
          maxVesselDraft: p.maxVesselDraft,
          channelDepth: p.channelDepth,
          anchorageDepth: p.anchorageDepth,
          cargoPierDepth: p.cargoPierDepth,
          oilTerminalDepth: p.oilTerminalDepth,
          repairCapability: p.repairCapability || null,
          drydock: p.drydock || null,
          railway: p.railway || null,
          hasOilTerminal: p.hasOilTerminal,
          hasLngTerminal: p.hasLngTerminal,
          hasContainer: p.hasContainer,
          hasBulk: p.hasBulk,
          hasCranes: p.hasCranes,
          raw: toJson(p.raw),
        },
        update: {
          name: p.name,
          alternateName: p.alternateName || null,
          countryCode: p.countryCode,
          lat: p.lat,
          lon: p.lon,
          harborSize: p.harborSize || null,
          maxVesselLength: p.maxVesselLength,
          maxVesselDraft: p.maxVesselDraft,
          channelDepth: p.channelDepth,
          anchorageDepth: p.anchorageDepth,
          cargoPierDepth: p.cargoPierDepth,
          oilTerminalDepth: p.oilTerminalDepth,
          hasOilTerminal: p.hasOilTerminal,
          hasLngTerminal: p.hasLngTerminal,
          hasContainer: p.hasContainer,
          hasBulk: p.hasBulk,
          hasCranes: p.hasCranes,
          raw: toJson(p.raw),
        },
      });
      stored++;
    } catch (e) {
      await job.log(`Failed: ${p.name} (WPI ${p.wpiNumber}) — ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  await job.log(`Stored ${stored} ports`);
  await job.updateProgress(60);

  await job.updateProgress(90);

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
    update: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
  });

  await job.updateProgress(100);
  await job.log(`Done: ${stored} ports in ${Date.now() - start}ms`);
  return { status: 'ok', totalPorts: ports.length, stored, durationMs: Date.now() - start };
}
