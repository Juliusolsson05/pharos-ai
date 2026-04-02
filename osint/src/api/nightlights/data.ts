import { prisma } from '../../db.js';
import { tileBounds } from '../../lib/tile-math.js';

export type TileBounds = [number, number, number, number]; // [west, south, east, north]

export async function getSnapshotDates() {
  return prisma.$queryRaw<{ date: string }[]>`
    SELECT DISTINCT date FROM osint.nightlight_snapshots ORDER BY date DESC
  `.then((rows) => rows.map((r) => r.date));
}

export async function getDailyDates() {
  return prisma.$queryRaw<{ date: string }[]>`
    SELECT DISTINCT date FROM osint.nightlight_tiles ORDER BY date DESC
  `.then((rows) => rows.map((r) => r.date));
}

export async function getDailyBounds(date: string): Promise<TileBounds | null> {
  const rows = await prisma.$queryRaw<{ min_x: number; min_y: number; max_x: number; max_y: number }[]>`
    SELECT MIN(x) AS min_x, MIN(y) AS min_y, MAX(x) AS max_x, MAX(y) AS max_y
    FROM osint.nightlight_tiles WHERE date = ${date}
  `;

  const r = rows[0];
  if (r?.min_x == null) return null;

  const topLeft = tileBounds(r.min_x, r.min_y, 8);
  const bottomRight = tileBounds(r.max_x, r.max_y, 8);
  return [topLeft.west, bottomRight.south, bottomRight.east, topLeft.north];
}

export async function getSnapshotBounds(date: string): Promise<TileBounds | null> {
  const rows = await prisma.$queryRaw<{ min_x: number; min_y: number; max_x: number; max_y: number }[]>`
    SELECT MIN(x) AS min_x, MIN(y) AS min_y, MAX(x) AS max_x, MAX(y) AS max_y
    FROM osint.nightlight_snapshots WHERE date = ${date}
  `;

  const r = rows[0];
  if (r?.min_x == null) return null;

  const topLeft = tileBounds(r.min_x, r.min_y, 8);
  const bottomRight = tileBounds(r.max_x, r.max_y, 8);
  return [topLeft.west, bottomRight.south, bottomRight.east, topLeft.north];
}

export async function resolveLatestDailyDate(): Promise<string | null> {
  const rows = await prisma.$queryRaw<{ date: string | null }[]>`
    SELECT date FROM osint.nightlight_tiles ORDER BY date DESC LIMIT 1
  `;
  return rows[0]?.date ?? null;
}

export async function resolveLatestSnapshotDate(): Promise<string | null> {
  const rows = await prisma.$queryRaw<{ date: string | null }[]>`
    SELECT date FROM osint.nightlight_snapshots ORDER BY date DESC LIMIT 1
  `;
  return rows[0]?.date ?? null;
}

export async function resolveDailyDateOnOrBefore(requestedDate: string): Promise<string | null> {
  const rows = await prisma.$queryRaw<{ date: string | null }[]>`
    SELECT date FROM osint.nightlight_tiles WHERE date <= ${requestedDate} ORDER BY date DESC LIMIT 1
  `;
  return rows[0]?.date ?? null;
}

export async function resolveSnapshotDateOnOrBefore(requestedDate: string): Promise<string | null> {
  const rows = await prisma.$queryRaw<{ date: string | null }[]>`
    SELECT date FROM osint.nightlight_snapshots WHERE date <= ${requestedDate} ORDER BY date DESC LIMIT 1
  `;
  return rows[0]?.date ?? null;
}

export async function getDailyCount(date: string) {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) AS count FROM osint.nightlight_tiles WHERE date = ${date}
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function getSnapshotCount(date: string) {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) AS count FROM osint.nightlight_snapshots WHERE date = ${date}
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function getAnomalies(from: string, to: string, threshold: number) {
  return prisma.$queryRawUnsafe<
    { z: number; x: number; y: number; region: string; radiance_from: number; radiance_to: number; drop_pct: number }[]
  >(
    `SELECT
       a.z, a.x, a.y, a.region,
       a."avgRadiance" as radiance_from,
       b."avgRadiance" as radiance_to,
       ROUND(((a."avgRadiance" - b."avgRadiance") / NULLIF(a."avgRadiance", 0) * 100)::numeric, 1) as drop_pct
     FROM osint.nightlight_tiles a
     JOIN osint.nightlight_tiles b ON a.z = b.z AND a.x = b.x AND a.y = b.y
     WHERE a.date = $1 AND b.date = $2
       AND a."avgRadiance" > 0
       AND ((a."avgRadiance" - b."avgRadiance") / NULLIF(a."avgRadiance", 0) * 100) > $3
     ORDER BY drop_pct DESC
     LIMIT 500`,
    from,
    to,
    threshold,
  );
}
