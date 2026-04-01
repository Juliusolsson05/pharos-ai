import type { Job } from 'bullmq';

import { prisma } from '../../../db.js';
import { toJson } from '../../../lib/json.js';
import { loadInstallations, loadVessels } from '../../../providers/reference/index.js';

const SOURCE = 'reference';

export async function processReferenceIngest(job: Job) {
  const start = Date.now();

  await job.log('Loading reference JSON files');
  const installations = loadInstallations();
  const vessels = loadVessels();
  await job.log(`Found ${installations.length} installations, ${vessels.length} vessels`);
  await job.updateProgress(10);

  // Seed installations
  let instStored = 0;
  for (const inst of installations) {
    try {
      await prisma.referenceInstallation.upsert({
        where: {
          name_country: {
            name: String(inst.name),
            country: String(inst.country),
          },
        },
        create: {
          name: String(inst.name),
          nameLocal: inst.nameLocal ? String(inst.nameLocal) : null,
          lat: Number(inst.lat),
          lon: Number(inst.lon),
          country: String(inst.country),
          affiliation: String(inst.affiliation || 'NEUTRAL'),
          type: String(inst.type),
          operators: Array.isArray(inst.operators) ? inst.operators.map(String) : [],
          units: Array.isArray(inst.units) ? inst.units.map(String) : [],
          equipment: Array.isArray(inst.equipment) ? inst.equipment.map(String) : [],
          personnel: inst.personnel ? Number(inst.personnel) : null,
          runwayLengthM: inst.runwayLengthM ? Number(inst.runwayLengthM) : null,
          role: Array.isArray(inst.role) ? inst.role.map(String) : [],
          status: String(inst.status || 'ACTIVE'),
          hardening: inst.hardening ? String(inst.hardening) : null,
          description: String(inst.description || ''),
          sourceUrl: inst.sourceUrl ? String(inst.sourceUrl) : null,
          raw: toJson(inst),
        },
        update: {
          nameLocal: inst.nameLocal ? String(inst.nameLocal) : null,
          lat: Number(inst.lat),
          lon: Number(inst.lon),
          affiliation: String(inst.affiliation || 'NEUTRAL'),
          type: String(inst.type),
          operators: Array.isArray(inst.operators) ? inst.operators.map(String) : [],
          units: Array.isArray(inst.units) ? inst.units.map(String) : [],
          equipment: Array.isArray(inst.equipment) ? inst.equipment.map(String) : [],
          personnel: inst.personnel ? Number(inst.personnel) : null,
          runwayLengthM: inst.runwayLengthM ? Number(inst.runwayLengthM) : null,
          role: Array.isArray(inst.role) ? inst.role.map(String) : [],
          status: String(inst.status || 'ACTIVE'),
          hardening: inst.hardening ? String(inst.hardening) : null,
          description: String(inst.description || ''),
          sourceUrl: inst.sourceUrl ? String(inst.sourceUrl) : null,
          raw: toJson(inst),
        },
      });
      instStored++;
    } catch (e) {
      await job.log(`Failed: ${inst.name} — ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  await job.updateProgress(50);

  // Seed vessels
  let vesselStored = 0;
  for (const v of vessels) {
    try {
      await prisma.referenceVessel.upsert({
        where: {
          name_country: {
            name: String(v.name),
            country: String(v.country),
          },
        },
        create: {
          name: String(v.name),
          hullNumber: v.hullNumber ? String(v.hullNumber) : null,
          vesselClass: v.class ? String(v.class) : null,
          type: String(v.type),
          country: String(v.country),
          affiliation: String(v.affiliation || 'NEUTRAL'),
          operator: String(v.operator || ''),
          strikeGroup: v.strikeGroup ? String(v.strikeGroup) : null,
          airWing: v.airWing ? String(v.airWing) : null,
          displacement: v.displacement ? Number(v.displacement) : null,
          personnel: v.personnel ? Number(v.personnel) : null,
          homePort: v.homePort ? String(v.homePort) : null,
          typicalPatrolLat: v.typicalPatrolLat ? Number(v.typicalPatrolLat) : null,
          typicalPatrolLon: v.typicalPatrolLon ? Number(v.typicalPatrolLon) : null,
          role: Array.isArray(v.role) ? v.role.map(String) : [],
          status: String(v.status || 'DEPLOYED'),
          description: String(v.description || ''),
          sourceUrl: v.sourceUrl ? String(v.sourceUrl) : null,
          raw: toJson(v),
        },
        update: {
          hullNumber: v.hullNumber ? String(v.hullNumber) : null,
          vesselClass: v.class ? String(v.class) : null,
          type: String(v.type),
          affiliation: String(v.affiliation || 'NEUTRAL'),
          operator: String(v.operator || ''),
          strikeGroup: v.strikeGroup ? String(v.strikeGroup) : null,
          displacement: v.displacement ? Number(v.displacement) : null,
          personnel: v.personnel ? Number(v.personnel) : null,
          typicalPatrolLat: v.typicalPatrolLat ? Number(v.typicalPatrolLat) : null,
          typicalPatrolLon: v.typicalPatrolLon ? Number(v.typicalPatrolLon) : null,
          role: Array.isArray(v.role) ? v.role.map(String) : [],
          status: String(v.status || 'DEPLOYED'),
          description: String(v.description || ''),
          sourceUrl: v.sourceUrl ? String(v.sourceUrl) : null,
          raw: toJson(v),
        },
      });
      vesselStored++;
    } catch (e) {
      await job.log(`Failed: ${v.name} — ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  await job.updateProgress(70);

  await job.updateProgress(100);

  const total = instStored + vesselStored;
  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: total, totalEvents: total },
    update: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: total, totalEvents: total },
  });

  await job.log(`Done: ${instStored} installations, ${vesselStored} vessels in ${Date.now() - start}ms`);
  return { status: 'ok', installations: instStored, vessels: vesselStored, durationMs: Date.now() - start };
}
