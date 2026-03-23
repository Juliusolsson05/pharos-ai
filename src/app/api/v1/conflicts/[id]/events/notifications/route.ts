import { NextRequest } from 'next/server';

import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

import type { Prisma } from '@/generated/prisma/client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const createdAfter = req.nextUrl.searchParams.get('createdAfter');
  const afterId = req.nextUrl.searchParams.get('afterId');
  const limitParam = Number(req.nextUrl.searchParams.get('limit') ?? '25');
  const take = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 25;

  const where: Prisma.IntelEventWhereInput = { conflictId: id };

  if (createdAfter) {
    const parsed = new Date(createdAfter);
    if (Number.isNaN(parsed.getTime())) {
      return err('VALIDATION', 'createdAfter must be a valid ISO timestamp', 422);
    }

    where.OR = [
      { createdAt: { gt: parsed } },
      afterId
        ? {
            AND: [
              { createdAt: parsed },
              { id: { gt: afterId } },
            ],
          }
        : undefined,
    ].filter(Boolean) as Prisma.IntelEventWhereInput[];
  }

  const events = await prisma.intelEvent.findMany({
    where,
    orderBy: [{ createdAt: createdAfter ? 'asc' : 'desc' }, { id: createdAfter ? 'asc' : 'desc' }],
    take,
    select: {
      id: true,
      createdAt: true,
      timestamp: true,
      severity: true,
      type: true,
      title: true,
      location: true,
      summary: true,
      verified: true,
      _count: {
        select: { sources: true },
      },
    },
  });

  const data = (createdAfter ? events : [...events].reverse()).map(event => ({
    id: event.id,
    createdAt: event.createdAt.toISOString(),
    timestamp: event.timestamp.toISOString(),
    severity: event.severity,
    type: event.type,
    title: event.title,
    location: event.location,
    summary: event.summary,
    verified: event.verified,
    sourceCount: event._count.sources,
  }));

  return ok(data, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
