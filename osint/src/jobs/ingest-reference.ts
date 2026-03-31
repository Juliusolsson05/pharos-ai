import type { Job } from 'bullmq';

import { prisma } from '../db.js';
import { toJson } from '../lib/json.js';
import { loadInstallations, loadVessels } from '../providers/reference/index.js';

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

  // Derive map features from reference data
  await prisma.mapFeature.deleteMany({ where: { source: SOURCE } });

  const features = [
    ...installations.map((inst) => ({
      featureType: 'ASSET',
      sourceEventId: `ref-${String(inst.name).replace(/\s+/g, '-').toLowerCase()}`,
      actor: String((inst.operators as string[])?.[0] || inst.country || 'Unknown'),
      priority: 'P2',
      category: 'INSTALLATION',
      type: String(inst.type),
      status: String(inst.status || 'ACTIVE'),
      timestamp: null as Date | null,
      geometry: { position: [Number(inst.lon), Number(inst.lat)] },
      properties: {
        name: String(inst.name),
        description: String(inst.description || ''),
        affiliation: String(inst.affiliation),
        personnel: inst.personnel ? Number(inst.personnel) : null,
      },
      source: SOURCE,
    })),
    ...vessels
      .filter((v) => v.typicalPatrolLat && v.typicalPatrolLon)
      .map((v) => ({
        featureType: 'ASSET',
        sourceEventId: `ref-vessel-${String(v.name).replace(/\s+/g, '-').toLowerCase()}`,
        actor: String(v.country),
        priority: String(v.type) === 'CARRIER' ? 'P1' : 'P2',
        category: 'INSTALLATION',
        type: String(v.type),
        status: String(v.status || 'DEPLOYED'),
        timestamp: null as Date | null,
        geometry: { position: [Number(v.typicalPatrolLon), Number(v.typicalPatrolLat)] },
        properties: {
          name: String(v.name),
          description: String(v.description || ''),
          hullNumber: v.hullNumber ? String(v.hullNumber) : null,
          affiliation: String(v.affiliation),
        },
        source: SOURCE,
      })),
  ];

  if (features.length > 0) {
    await prisma.mapFeature.createMany({ data: features });
  }
  await job.updateProgress(100);

  const total = instStored + vesselStored;
  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: total, totalEvents: total },
    update: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: total, totalEvents: total },
  });

  await job.log(`Done: ${instStored} installations, ${vesselStored} vessels, ${features.length} map features in ${Date.now() - start}ms`);
  return { status: 'ok', installations: instStored, vessels: vesselStored, features: features.length, durationMs: Date.now() - start };
}
