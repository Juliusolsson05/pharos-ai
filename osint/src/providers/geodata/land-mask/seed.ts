import { prisma } from '../../../db.js';
import { toJson } from '../../../lib/json.js';
import { uploadRaw } from '../../../lib/storage.js';
import { computeLandMask, LAND_MASK_VERSION } from './fetch.js';

const SOURCE = 'land-mask';
const BATCH_SIZE = 1000;

export async function seed(_opts: { from?: string; to?: string; delay?: number }): Promise<void> {
  const start = Date.now();

  // Version-cursor dedup
  const existing = await prisma.sourceSync.findUnique({ where: { source: SOURCE } });
  if (existing?.lastCursor === LAND_MASK_VERSION) {
    console.log(`[land-mask] Already seeded v${LAND_MASK_VERSION}, skipping.`);
    return;
  }

  const { results, rawTiles } = await computeLandMask();

  // Archive raw z4 tiles to S3
  const s3Key = `geodata/osm-land-water-map-${LAND_MASK_VERSION}.json`;
  try {
    // Store tile metadata (not the PNGs — too many small files)
    const meta = {
      version: LAND_MASK_VERSION,
      sourceLayer: 'OSM_Land_Water_Map',
      sourceZoom: 4,
      targetZoom: 8,
      totalTiles: results.length,
      landTiles: results.filter((r) => r.hasLand).length,
      rawTileCount: rawTiles.size,
    };
    await uploadRaw(s3Key, Buffer.from(JSON.stringify(meta)));
  } catch { /* non-fatal */ }

  await prisma.rawIngest.upsert({
    where: { id: `${SOURCE}-${s3Key}` },
    create: { id: `${SOURCE}-${s3Key}`, source: SOURCE, fileKey: s3Key, rowCount: results.length, meta: { version: LAND_MASK_VERSION } },
    update: { rowCount: results.length, fetchedAt: new Date() },
  });

  // Store all 65,536 results
  console.log(`[land-mask] Storing ${results.length} land mask rows...`);
  await prisma.landMaskTile.deleteMany({});

  for (let i = 0; i < results.length; i += BATCH_SIZE) {
    const batch = results.slice(i, i + BATCH_SIZE);
    await prisma.landMaskTile.createMany({
      data: batch.map((r) => ({
        z: r.z, x: r.x, y: r.y,
        hasLand: r.hasLand,
        landPct: r.landPct,
        raw: toJson({ landPixels: r.landPixels, totalPixels: r.totalPixels, sourceZoom: 4 }),
      })),
    });

    if ((i + BATCH_SIZE) % 10000 < BATCH_SIZE) {
      console.log(`[land-mask]   ${Math.min(i + BATCH_SIZE, results.length)}/${results.length}`);
    }
  }

  const landCount = results.filter((r) => r.hasLand).length;
  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastCursor: LAND_MASK_VERSION, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: landCount, totalEvents: results.length },
    update: { lastCursor: LAND_MASK_VERSION, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: landCount, totalEvents: results.length },
  });

  console.log(`[land-mask] Done: ${landCount} land / ${results.length} total in ${((Date.now() - start) / 1000).toFixed(1)}s`);
}
