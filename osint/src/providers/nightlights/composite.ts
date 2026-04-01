import { prisma } from '../../db.js';
import { getTile } from '../../lib/storage.js';
import { config } from '../../config.js';
import type { TileCoord } from '../../lib/tile-math.js';
import { dailyTileKey, snapshotTileKey } from './keys.js';

type CompositeSource = 'daily' | 'snapshot';

export type CompositeManifest = {
  requestedDate: string;
  resolvedDailyDate: string;
  resolvedSnapshotDate: string | null;
  tileUrl: string;
  minzoom: number;
  maxzoom: number;
  tileSize: number;
};

export type CompositeTileResult = {
  tile: Buffer;
  source: CompositeSource;
  resolvedDailyDate: string;
  resolvedSnapshotDate: string | null;
};

async function resolveDate(table: 'nightlightTile' | 'nightlightSnapshot', requestedDate: string) {
  const rows = table === 'nightlightTile'
    ? await prisma.nightlightTile.findMany({
      where: { date: { lte: requestedDate } },
      select: { date: true },
      distinct: ['date'],
      orderBy: { date: 'desc' },
      take: 1,
    })
    : await prisma.nightlightSnapshot.findMany({
      where: { date: { lte: requestedDate } },
      select: { date: true },
      distinct: ['date'],
      orderBy: { date: 'desc' },
      take: 1,
    });

  return rows[0]?.date ?? null;
}

async function resolveLatestDate(table: 'nightlightTile' | 'nightlightSnapshot') {
  const rows = table === 'nightlightTile'
    ? await prisma.nightlightTile.findMany({
      select: { date: true },
      distinct: ['date'],
      orderBy: { date: 'desc' },
      take: 1,
    })
    : await prisma.nightlightSnapshot.findMany({
      select: { date: true },
      distinct: ['date'],
      orderBy: { date: 'desc' },
      take: 1,
    });

  return rows[0]?.date ?? null;
}

export async function resolveCompositeDates(requestedDate: string) {
  const resolvedDailyDate = await resolveDate('nightlightTile', requestedDate);
  if (!resolvedDailyDate) {
    throw new Error(`No daily nightlights available on or before ${requestedDate}`);
  }

  const resolvedSnapshotDate =
    await resolveDate('nightlightSnapshot', resolvedDailyDate)
    ?? await resolveLatestDate('nightlightSnapshot');

  return {
    requestedDate,
    resolvedDailyDate,
    resolvedSnapshotDate,
  };
}

export async function resolveLatestCompositeDates() {
  const latestDailyDate = await resolveLatestDate('nightlightTile');
  if (!latestDailyDate) {
    throw new Error('No daily nightlights available');
  }

  return resolveCompositeDates(latestDailyDate);
}

export async function getCompositeManifest(requestedDate: string): Promise<CompositeManifest> {
  const resolved = await resolveCompositeDates(requestedDate);
  return {
    ...resolved,
    tileUrl: `/api/nightlights/composite/${requestedDate}/{z}/{x}/{y}.webp`,
    minzoom: 1,
    maxzoom: config.nightlights.zoomLevel,
    tileSize: 256,
  };
}

export async function getLatestCompositeManifest(): Promise<CompositeManifest> {
  const resolved = await resolveLatestCompositeDates();
  return {
    ...resolved,
    tileUrl: `/api/nightlights/composite/${resolved.requestedDate}/{z}/{x}/{y}.webp`,
    minzoom: 1,
    maxzoom: config.nightlights.zoomLevel,
    tileSize: 256,
  };
}

export async function getCompositeTile(requestedDate: string, coord: TileCoord): Promise<CompositeTileResult | null> {
  const resolved = await resolveCompositeDates(requestedDate);

  // Fetch both in parallel
  const [dailyTile, snapshotTile] = await Promise.all([
    getTile(config.nightlights.tileBucket, dailyTileKey(resolved.resolvedDailyDate, coord.z, coord.x, coord.y)),
    resolved.resolvedSnapshotDate
      ? getTile(config.nightlights.tileBucket, snapshotTileKey(resolved.resolvedSnapshotDate, coord.z, coord.x, coord.y))
      : Promise.resolve(null),
  ]);

  if (!dailyTile && !snapshotTile) {
    return null;
  }

  let source: CompositeSource;
  let tile: Buffer;

  if (dailyTile && snapshotTile) {
    // Daily tiles only exist for the included, high-signal mask. Compositing them over the
    // broader snapshot keeps the focused daily product without leaving the rest of the map blank.
    const sharp = (await import('sharp')).default;
    tile = await sharp(snapshotTile)
      .composite([{ input: dailyTile }])
      .webp({ quality: 80 })
      .toBuffer();
    source = 'daily';
  } else if (dailyTile) {
    tile = dailyTile;
    source = 'daily';
  } else {
    tile = snapshotTile!;
    source = 'snapshot';
  }

  return {
    tile,
    source,
    resolvedDailyDate: resolved.resolvedDailyDate,
    resolvedSnapshotDate: resolved.resolvedSnapshotDate,
  };
}
