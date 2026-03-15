import { NextRequest } from 'next/server';

import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { calculateInstability } from '@/server/lib/instability';

const CACHE = 'public, s-maxage=300, stale-while-revalidate=600';
const SEVEN_DAYS_MS = 7 * 24 * 3_600_000;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const conflict = await prisma.conflict.findUnique({ where: { id }, select: { id: true } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${id} not found`, 404);

  const since = new Date(Date.now() - SEVEN_DAYS_MS);
  const sinceDateStr = since.toISOString().slice(0, 10);

  const [events, xPosts, actions] = await Promise.all([
    prisma.intelEvent.findMany({
      where: { conflictId: id, timestamp: { gte: since } },
      select: { timestamp: true, severity: true },
    }),
    prisma.xPost.findMany({
      where: { conflictId: id, timestamp: { gte: since } },
      select: { timestamp: true, significance: true, verificationStatus: true },
    }),
    prisma.actorAction.findMany({
      where: { actor: { conflictId: id }, date: { gte: sinceDateStr } },
      select: { date: true, significance: true },
    }),
  ]);

  const result = calculateInstability(events, xPosts, actions);

  return ok(result, { headers: { 'Cache-Control': CACHE } });
}
