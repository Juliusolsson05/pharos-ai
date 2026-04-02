import { prisma } from '../../../db.js';
import { toJson } from '../../../lib/json.js';
import { uploadRaw } from '../../../lib/storage.js';
import { downloadGhsl, computeTileStats, GHSL_VERSION } from './fetch.js';

const SOURCE = 'settlements';
const BATCH_SIZE = 500;

export async function seed(_opts: { from?: string; to?: string; delay?: number }): Promise<void> {
  const start = Date.now();
  const s3Key = `geodata/ghsl-smod-${GHSL_VERSION}.zip`;

  const existing = await prisma.sourceSync.findUnique({ where: { source: SOURCE } });
  if (existing?.lastCursor === GHSL_VERSION) {
    console.log(`[settlements] Already seeded v${GHSL_VERSION}, skipping.`);
    return;
  }

  const raster = await downloadGhsl();

  // Archive raw ZIP to S3
  try { await uploadRaw(s3Key, raster.rawZipBuffer); } catch { /* non-fatal */ }

  await prisma.rawIngest.upsert({
    where: { id: `${SOURCE}-${s3Key}` },
    create: { id: `${SOURCE}-${s3Key}`, source: SOURCE, fileKey: s3Key, rowCount: raster.width * raster.height, meta: { version: GHSL_VERSION, width: raster.width, height: raster.height } },
    update: { rowCount: raster.width * raster.height, fetchedAt: new Date() },
  });

  // Compute per-tile stats from the raster
  console.log('[settlements] Computing per-tile stats from GHSL raster...');
  const stats = computeTileStats(raster, 8);

  const withSettlement = stats.filter((s) => s.hasSettlement);
  console.log(`[settlements] ${withSettlement.length} tiles have settlement out of ${stats.length}`);

  // Store ALL tiles (not just settled ones — the zeros are data too)
  console.log(`[settlements] Storing ${stats.length} settlement tile records...`);
  await prisma.settlementTile.deleteMany({});

  for (let i = 0; i < stats.length; i += BATCH_SIZE) {
    const batch = stats.slice(i, i + BATCH_SIZE);
    await prisma.settlementTile.createMany({
      data: batch.map((s) => ({
        z: s.z, x: s.x, y: s.y,
        hasSettlement: s.hasSettlement,
        maxClass: s.maxClass,
        settlementPct: Math.round(s.settlementPct * 100) / 100,
        raw: toJson({
          histogram: s.classHistogram,
          totalPixels: s.totalPixels,
          settledPixels: s.settledPixels,
        }),
      })),
    });

    if ((i + BATCH_SIZE) % 10000 < BATCH_SIZE) {
      console.log(`[settlements]   ${Math.min(i + BATCH_SIZE, stats.length)}/${stats.length}`);
    }
  }

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastCursor: GHSL_VERSION, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: withSettlement.length, totalEvents: stats.length },
    update: { lastCursor: GHSL_VERSION, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: withSettlement.length, totalEvents: stats.length },
  });

  console.log(`[settlements] Done: ${withSettlement.length} settled / ${stats.length} total in ${((Date.now() - start) / 1000).toFixed(1)}s`);
}
