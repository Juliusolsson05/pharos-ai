import { cache } from 'react';

import { publicConflictId } from '@/shared/lib/env';
import { fmtDate } from '@/shared/lib/format';
import { prisma } from '@/server/lib/db';

import type { BrowseEventFilters } from '@/types/domain';

import { PAGE_SIZE } from './page-size';

const CONFLICT_ID = publicConflictId;

export const getEvents = cache(async (filters?: BrowseEventFilters) => {
  const where: Record<string, unknown> = { conflictId: CONFLICT_ID };

  if (filters?.severity?.length) {
    where.severity = { in: filters.severity };
  }

  if (filters?.date) {
    const start = new Date(filters.date + 'T00:00:00Z');
    const end = new Date(filters.date + 'T23:59:59.999Z');
    where.timestamp = { gte: start, lte: end };
  }

  const page = Math.max(1, filters?.page ?? 1);

  const [rows, total] = await Promise.all([
    prisma.intelEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        timestamp: true,
        severity: true,
        type: true,
        title: true,
        location: true,
        summary: true,
        verified: true,
        tags: true,
      },
    }),
    prisma.intelEvent.count({ where }),
  ]);

  return {
    events: rows.map((r) => ({
      ...r,
      timestamp: r.timestamp.toISOString(),
    })),
    total,
  };
});

export const getEvent = cache(async (eventId: string) => {
  const row = await prisma.intelEvent.findFirst({
    where: { id: eventId, conflictId: CONFLICT_ID },
    include: {
      sources: true,
      actorResponses: true,
    },
  });

  if (!row) return null;

  return {
    ...row,
    timestamp: row.timestamp.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
});

export async function getEventDates(): Promise<Set<string>> {
  const rows = await prisma.intelEvent.findMany({
    where: { conflictId: CONFLICT_ID },
    select: { timestamp: true },
  });
  return new Set(rows.map((r) => fmtDate(r.timestamp.toISOString())));
}

export const getXPostsByEvent = cache(async (eventId: string) => {
  const rows = await prisma.xPost.findMany({
    where: { conflictId: CONFLICT_ID, eventId },
    orderBy: { timestamp: 'desc' },
    include: {
      actor: { select: { cssVar: true, colorRgb: true } },
    },
  });

  return rows.map((r) => ({
    ...r,
    timestamp: r.timestamp.toISOString(),
    verifiedAt: r.verifiedAt?.toISOString() ?? null,
    actorCssVar: r.actor?.cssVar ?? null,
    actorColorRgb: r.actor?.colorRgb ?? [],
  }));
});
