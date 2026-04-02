import { latLonToTile } from '../../../lib/tile-math.js';
import { prisma } from '../../../db.js';
import { getQualityForTile } from '../../nightlights/regions.js';

// Class 11 is extremely sparse rural coverage and explodes the tile count without
// adding much map value. Starting at 12 keeps the daily nightlights run focused on
// inhabited or strategically relevant land instead of fetching broad empty terrain.
const MIN_SETTLEMENT_CLASS = 12;

export type TileMaskRow = {
  z: number;
  x: number;
  y: number;
  hasLand: boolean;
  hasSettlement: boolean;
  hasPopulation: boolean;
  isStrategic: boolean;
  include: boolean;
  maxSettlementClass: number;
  settlementPct: number;
  qualityTier: string;
};

/**
 * Compute tile masks by querying the independent geodata tables.
 * Uses LandMaskTile (pixel-accurate) instead of GSHHG bbox intersection.
 */
export async function computeMasksFromDb(
  strategicSet: Set<string>,
  z: number = 8,
): Promise<TileMaskRow[]> {
  const n = 2 ** z;

  // 1. Load land mask — pixel-accurate from OSM Land Water Map
  console.log('[tile-mask] Loading land mask...');
  const landTiles = await prisma.landMaskTile.findMany({
    where: { z, hasLand: true },
    select: { x: true, y: true },
  });
  const landSet = new Set(landTiles.map((t) => `${t.x},${t.y}`));
  console.log(`[tile-mask] Land mask: ${landSet.size} land tiles`);

  // 2. Load settlement data
  console.log('[tile-mask] Loading settlement data...');
  const settlements = await prisma.settlementTile.findMany({
    where: { z },
    select: { x: true, y: true, hasSettlement: true, maxClass: true, settlementPct: true },
  });
  const settlementMap = new Map<string, { hasSettlement: boolean; maxClass: number; settlementPct: number }>();
  for (const s of settlements) {
    settlementMap.set(`${s.x},${s.y}`, s);
  }
  console.log(`[tile-mask] Settlement data: ${settlementMap.size} tiles`);

  // 3. Load populated places
  console.log('[tile-mask] Loading populated places...');
  const places = await prisma.populatedPlace.findMany({
    select: { lat: true, lon: true },
  });
  const popIndex = new Set<string>();
  for (const p of places) {
    if (p.lat < -85 || p.lat > 85) continue;
    const tile = latLonToTile(p.lat, p.lon, z);
    popIndex.add(`${tile.x},${tile.y}`);
  }
  console.log(`[tile-mask] Population index: ${popIndex.size} tiles with city points`);

  // 4. Compute masks
  console.log(`[tile-mask] Computing ${n * n} tile masks...`);
  const results: TileMaskRow[] = [];
  let counts = { land: 0, settled: 0, pop: 0, included: 0 };

  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      const key = `${x},${y}`;

      const hasLand = landSet.has(key);

      const settlement = settlementMap.get(key);
      const hasSettlement = settlement?.hasSettlement ?? false;
      const maxSettlementClass = settlement?.maxClass ?? 0;
      const settlementPct = settlement?.settlementPct ?? 0;

      const hasPopulation = popIndex.has(key);
      const isStrategic = strategicSet.has(key);

      // The include flag is intentionally strict because it directly controls how many
      // daily tiles we fetch from NASA and later store in S3/Postgres.
      const include = hasLand && (maxSettlementClass >= MIN_SETTLEMENT_CLASS || hasPopulation || isStrategic);

      const { region } = getQualityForTile({ z, x, y });

      if (hasLand) counts.land++;
      if (hasSettlement) counts.settled++;
      if (hasPopulation) counts.pop++;
      if (include) counts.included++;

      results.push({
        z, x, y,
        hasLand, hasSettlement, hasPopulation, isStrategic, include,
        maxSettlementClass, settlementPct,
        qualityTier: region,
      });
    }

    if (x % 64 === 0) {
      console.log(`[tile-mask] ${Math.round((x / n) * 100)}%`);
    }
  }

  console.log(`[tile-mask] Done: ${counts.land} land, ${counts.settled} settled, ${counts.pop} cities, ${counts.included} included (${(counts.included / (n * n) * 100).toFixed(1)}%)`);
  return results;
}
