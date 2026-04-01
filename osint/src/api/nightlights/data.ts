import { prisma } from '../../db.js';

export async function getSnapshotDates() {
  const rows = await prisma.nightlightSnapshot.findMany({
    select: { date: true },
    distinct: ['date'],
    orderBy: { date: 'desc' },
  });

  return rows.map((row) => row.date);
}

export async function getDailyDates() {
  const rows = await prisma.nightlightTile.findMany({
    select: { date: true },
    distinct: ['date'],
    orderBy: { date: 'desc' },
  });

  return rows.map((row) => row.date);
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
