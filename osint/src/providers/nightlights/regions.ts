export type TileCoord = { z: number; x: number; y: number };

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

function tileBounds(x: number, y: number, z: number) {
  const n = 2 ** z;
  const west = (x / n) * 360 - 180;
  const east = ((x + 1) / n) * 360 - 180;
  const north = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  const south =
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))) * 180) / Math.PI;
  return { south, north, west, east };
}

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
 * Generate the full z8 tile grid (all 65,536 tiles).
 * Used as fallback when no tile mask is available.
 */
export function getAllTiles(z: number = 8): TileCoord[] {
  const max = 2 ** z;
  const tiles: TileCoord[] = [];
  for (let x = 0; x < max; x++) {
    for (let y = 0; y < max; y++) {
      tiles.push({ z, x, y });
    }
  }
  return tiles;
}

/**
 * Get tiles that the tile-mask pipeline marked as included (inhabited land).
 * Falls back to getAllTiles() if the tile_masks table hasn't been populated.
 */
export async function getIncludedTiles(z: number = 8): Promise<TileCoord[]> {
  // Lazy import to avoid circular deps at module load
  const { prisma } = await import('../../db.js');

  const masks = await prisma.tileMask.findMany({
    where: { z, include: true },
    select: { z: true, x: true, y: true },
  });

  if (masks.length === 0) {
    console.warn('[nightlights] No tile mask found — falling back to all tiles. Run: npm run seed -- --provider geodata/tile-mask');
    return getAllTiles(z);
  }

  return masks.map((m) => ({ z: m.z, x: m.x, y: m.y }));
}
