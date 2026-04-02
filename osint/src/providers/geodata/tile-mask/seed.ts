import { prisma } from '../../../db.js';
import { computeMasksFromDb } from './compute.js';
import { getStrategicTiles } from './strategic.js';

const SOURCE = 'tile-mask';
const BATCH_SIZE = 500;

/**
 * Compute tile masks from the three independent geodata tables.
 * Requires land-mask, settlements, and populated-places to be seeded first.
 * This is pure computation — no downloads, no S3 uploads.
 */
export async function seed(_opts: { from?: string; to?: string; delay?: number }): Promise<void> {
  const start = Date.now();

  // Verify dependencies are seeded
  const landMaskCount = await prisma.landMaskTile.count();
  const placeCount = await prisma.populatedPlace.count();
  const settlementCount = await prisma.settlementTile.count();

  if (landMaskCount === 0 || placeCount === 0 || settlementCount === 0) {
    console.error(`[tile-mask] Missing dependencies:`);
    console.error(`  land_mask_tiles: ${landMaskCount} (need > 0 — run: npm run seed -- --provider geodata/land-mask)`);
    console.error(`  populated_places: ${placeCount} (need > 0 — run: npm run seed -- --provider geodata/populated-places)`);
    console.error(`  settlement_tiles: ${settlementCount} (need > 0 — run: npm run seed -- --provider geodata/settlements)`);
    throw new Error('Seed the geodata sources first');
  }

  console.log(`[tile-mask] Dependencies: ${landMaskCount} land mask tiles, ${placeCount} places, ${settlementCount} settlements`);

  const strategicSet = getStrategicTiles(8);
  const masks = await computeMasksFromDb(strategicSet, 8);

  // Store masks — full replace
  console.log(`[tile-mask] Writing ${masks.length} mask rows...`);
  await prisma.tileMask.deleteMany({});

  let written = 0;
  for (let i = 0; i < masks.length; i += BATCH_SIZE) {
    const batch = masks.slice(i, i + BATCH_SIZE);
    await prisma.tileMask.createMany({
      data: batch.map((m) => ({
        z: m.z, x: m.x, y: m.y,
        hasLand: m.hasLand,
        hasSettlement: m.hasSettlement,
        hasPopulation: m.hasPopulation,
        isStrategic: m.isStrategic,
        include: m.include,
        landCoveragePct: null,
        qualityTier: m.qualityTier,
      })),
    });
    written += batch.length;
    if (written % 10000 === 0 || written === masks.length) {
      console.log(`[tile-mask]   ${written}/${masks.length}`);
    }
  }

  const included = masks.filter((m) => m.include).length;
  const byTier: Record<string, number> = {};
  for (const m of masks) {
    if (m.include) byTier[m.qualityTier] = (byTier[m.qualityTier] || 0) + 1;
  }

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: included, totalEvents: included },
    update: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: included, totalEvents: included },
  });

  console.log(`[tile-mask] Done: ${included} / ${masks.length} included (${(included / masks.length * 100).toFixed(1)}%) in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  console.log(`[tile-mask] By tier:`, byTier);
}
