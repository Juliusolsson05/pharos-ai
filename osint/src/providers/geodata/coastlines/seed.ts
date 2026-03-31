import { prisma } from '../../../db.js';
import { uploadRaw } from '../../../lib/storage.js';
import { downloadGshhg, GSHHG_VERSION } from './fetch.js';

const SOURCE = 'coastlines';
const BATCH_SIZE = 500;

function computeBbox(geometry: GeoJSON.Geometry): { south: number; north: number; west: number; east: number } {
  let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;

  function processCoords(coords: number[]) {
    if (coords[0] < minLon) minLon = coords[0];
    if (coords[0] > maxLon) maxLon = coords[0];
    if (coords[1] < minLat) minLat = coords[1];
    if (coords[1] > maxLat) maxLat = coords[1];
  }

  function walk(arr: unknown): void {
    if (!Array.isArray(arr)) return;
    if (typeof arr[0] === 'number' && typeof arr[1] === 'number') {
      processCoords(arr as number[]);
    } else {
      for (const item of arr) walk(item);
    }
  }

  if ('coordinates' in geometry) walk(geometry.coordinates);
  return { south: minLat, north: maxLat, west: minLon, east: maxLon };
}

export async function seed(_opts: { from?: string; to?: string; delay?: number }): Promise<void> {
  const start = Date.now();
  const s3Key = `geodata/gshhg-${GSHHG_VERSION}-L1-intermediate.zip`;

  // Check if already seeded with this version
  const existing = await prisma.sourceSync.findUnique({ where: { source: SOURCE } });
  if (existing?.lastCursor === GSHHG_VERSION) {
    console.log(`[coastlines] Already seeded v${GSHHG_VERSION}, skipping. Delete source_syncs row to force re-run.`);
    return;
  }

  const { geojson, rawZip } = await downloadGshhg();

  // Archive raw ZIP to S3 (versioned key)
  try { await uploadRaw(s3Key, rawZip); } catch { /* non-fatal */ }

  // Record in raw_ingests (upsert by source + fileKey to avoid dupes)
  await prisma.rawIngest.upsert({
    where: { id: `${SOURCE}-${s3Key}` },
    create: { id: `${SOURCE}-${s3Key}`, source: SOURCE, fileKey: s3Key, rowCount: geojson.features.length, meta: { version: GSHHG_VERSION, resolution: 'intermediate', level: 'L1' } },
    update: { rowCount: geojson.features.length, fetchedAt: new Date() },
  });

  // Store typed data — full replace (idempotent)
  console.log(`[coastlines] Storing ${geojson.features.length} polygons...`);
  await prisma.coastlinePolygon.deleteMany({});

  for (let i = 0; i < geojson.features.length; i += BATCH_SIZE) {
    const batch = geojson.features.slice(i, i + BATCH_SIZE);
    await prisma.coastlinePolygon.createMany({
      data: batch.map((f) => {
        const p = f.properties || {};
        // Compute bbox from geometry coords since shpjs doesn't set f.bbox
        const bbox = computeBbox(f.geometry);
        return {
          gshhgId: String(p.id ?? `gen-${i + batch.indexOf(f)}`),
          level: Number(p.level) || 1,
          source: p.source || null,
          parentId: p.parent_id != null ? Number(p.parent_id) : null,
          siblingId: p.sibling_id != null ? Number(p.sibling_id) : null,
          area: Number(p.area) || 0,
          south: bbox.south, north: bbox.north, west: bbox.west, east: bbox.east,
          geometry: f.geometry as unknown as Record<string, unknown>,
          raw: p as unknown as Record<string, unknown>,
        };
      }),
      skipDuplicates: true,
    });
    if ((i + BATCH_SIZE) % 5000 < BATCH_SIZE) {
      console.log(`[coastlines]   ${Math.min(i + BATCH_SIZE, geojson.features.length)}/${geojson.features.length}`);
    }
  }

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastCursor: GSHHG_VERSION, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: geojson.features.length, totalEvents: geojson.features.length },
    update: { lastCursor: GSHHG_VERSION, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: geojson.features.length, totalEvents: geojson.features.length },
  });

  console.log(`[coastlines] Done: ${geojson.features.length} polygons in ${((Date.now() - start) / 1000).toFixed(1)}s`);
}
