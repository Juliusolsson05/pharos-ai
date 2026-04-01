import pLimit from 'p-limit';
import sharp from 'sharp';

import type { TileCoord } from '../../lib/tile-math.js';
import { parentTile } from '../../lib/tile-math.js';
import { getTile, uploadTile } from '../../lib/storage.js';
import { dailyTileKey, snapshotTileKey } from './keys.js';

type PyramidKind = 'daily' | 'snapshot';

type BuildPyramidOptions = {
  kind: PyramidKind;
  date: string;
  bucket: string;
  storedTiles: TileCoord[];
  quality?: number;
  concurrency?: number;
  log?: (message: string) => Promise<void> | void;
};

function tileKey(coord: TileCoord) {
  return `${coord.z}:${coord.x}:${coord.y}`;
}

function keyFor(kind: PyramidKind, date: string, coord: TileCoord) {
  return kind === 'daily'
    ? dailyTileKey(date, coord.z, coord.x, coord.y)
    : snapshotTileKey(date, coord.z, coord.x, coord.y);
}

async function buildParentTile(children: Array<{ coord: TileCoord; data: Buffer }>, quality: number) {
  const composites = children.map(({ coord, data }) => ({
    input: data,
    left: coord.x % 2 === 0 ? 0 : 256,
    top: coord.y % 2 === 0 ? 0 : 256,
  }));

  const full = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();

  return sharp(full)
    .resize(256, 256)
    .webp({ quality, effort: 4 })
    .toBuffer();
}

export async function buildPyramid({
  kind,
  date,
  bucket,
  storedTiles,
  quality = 70,
  concurrency = 5,
  log,
}: BuildPyramidOptions) {
  // We only build parents for tiles that actually exist at z8. That keeps the pyramid
  // sparse and avoids manufacturing empty ocean/background tiles just for lower zooms.
  let current = storedTiles.filter((tile) => tile.z === 8);
  const levelCounts: Record<number, number> = {};

  for (let z = 7; z >= 1; z--) {
    const currentSet = new Set(current.map(tileKey));
    const parentMap = new Map<string, TileCoord>();
    for (const child of current) {
      const parent = parentTile(child.x, child.y, child.z);
      parentMap.set(`${parent.z}:${parent.x}:${parent.y}`, parent);
    }

    const parents = [...parentMap.values()];
    if (parents.length === 0) {
      break;
    }

    const limit = pLimit(concurrency);
    const built: TileCoord[] = [];

    await Promise.all(parents.map((parent) => limit(async () => {
      const children: Array<{ coord: TileCoord; data: Buffer }> = [];

      for (let dx = 0; dx <= 1; dx++) {
        for (let dy = 0; dy <= 1; dy++) {
          const child = { z: parent.z + 1, x: parent.x * 2 + dx, y: parent.y * 2 + dy };
          if (!currentSet.has(tileKey(child))) {
            continue;
          }

          const data = await getTile(bucket, keyFor(kind, date, child));
          if (data) {
            children.push({ coord: child, data });
          }
        }
      }

      if (children.length === 0) {
        return;
      }

      const output = await buildParentTile(children, quality);
      await uploadTile(bucket, keyFor(kind, date, parent), output, 'image/webp');
      built.push(parent);
    })));

    levelCounts[z] = built.length;
    current = built;

    if (log) {
      await log(`[nightlights] pyramid z${z}: ${built.length} tiles`);
    }
  }

  const totalBuilt = Object.values(levelCounts).reduce((sum, count) => sum + count, 0);
  return { totalBuilt, levelCounts };
}
