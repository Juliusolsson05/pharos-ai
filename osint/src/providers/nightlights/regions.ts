import type { TileCoord } from '../../lib/tile-math.js';
import { tileBounds } from '../../lib/tile-math.js';

type QualityTier = {
  name: string;
  quality: number;
  south: number;
  north: number;
  west: number;
  east: number;
};

// Quality tiers — higher quality for conflict-relevant regions.
// All tiles stay 256x256; only WebP encoding quality changes.
const TIERS: QualityTier[] = [
  { name: 'iran', quality: 92, south: 24, north: 40, west: 44, east: 64 },
  { name: 'middle-east', quality: 82, south: 12, north: 45, west: 20, east: 75 },
];

const DEFAULT_QUALITY = { region: 'world', quality: 60 };

function intersects(
  a: { south: number; north: number; west: number; east: number },
  b: { south: number; north: number; west: number; east: number },
): boolean {
  return !(a.east <= b.west || a.west >= b.east || a.north <= b.south || a.south >= b.north);
}

/**
 * Get the quality tier for a tile based on its geographic bounds.
 * Returns the highest-quality tier that overlaps the tile.
 */
export function getQualityForTile(coord: TileCoord): { region: string; quality: number } {
  const bounds = tileBounds(coord.x, coord.y, coord.z);
  for (const tier of TIERS) {
    if (intersects(bounds, tier)) {
      return { region: tier.name, quality: tier.quality };
    }
  }
  return DEFAULT_QUALITY;
}

/**
 * Get tiles that the tile-mask pipeline marked as included (inhabited land).
 */
export async function getIncludedTiles(z: number = 8): Promise<TileCoord[]> {
  const { prisma } = await import('../../db.js');

  const masks = await prisma.tileMask.findMany({
    where: { z, include: true },
    select: { z: true, x: true, y: true },
  });

  if (masks.length === 0) {
    throw new Error('No tile mask found. Run: npm run seed -- --provider geodata/tile-mask');
  }

  return masks.map((m) => ({ z: m.z, x: m.x, y: m.y }));
}

export async function getLandTiles(z: number = 8): Promise<TileCoord[]> {
  const { prisma } = await import('../../db.js');

  const tiles = await prisma.landMaskTile.findMany({
    where: { z, hasLand: true },
    select: { z: true, x: true, y: true },
  });

  if (tiles.length === 0) {
    throw new Error('No land mask found. Run: npm run seed -- --provider geodata/land-mask');
  }

  return tiles.map((tile) => ({ z: tile.z, x: tile.x, y: tile.y }));
}

export type { TileCoord };
