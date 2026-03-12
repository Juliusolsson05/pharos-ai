import { cache } from 'react';

import { publicConflictId } from '@/shared/lib/env';
import { fmtDate } from '@/shared/lib/format';
import { prisma } from '@/server/lib/db';

import { PAGE_SIZE } from './page-size';

const CONFLICT_ID = publicConflictId;

export const getBriefs = cache(async (filters?: { page?: number }) => {
  const where = { conflictId: CONFLICT_ID };
  const page = Math.max(1, filters?.page ?? 1);

  const [rows, total] = await Promise.all([
    prisma.conflictDaySnapshot.findMany({
      where,
      orderBy: { day: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        day: true,
        dayLabel: true,
        summary: true,
        escalation: true,
        keyFacts: true,
      },
    }),
    prisma.conflictDaySnapshot.count({ where }),
  ]);

  return {
    briefs: rows.map((r) => ({
      ...r,
      day: fmtDate(r.day.toISOString()),
    })),
    total,
  };
});

export const getBrief = cache(async (day: string) => {
  const date = new Date(day + 'T00:00:00Z');

  const row = await prisma.conflictDaySnapshot.findFirst({
    where: { conflictId: CONFLICT_ID, day: date },
    include: {
      casualties: true,
      economicChips: { orderBy: { ord: 'asc' } },
      scenarios: { orderBy: { ord: 'asc' } },
    },
  });

  if (!row) return null;

  return {
    ...row,
    day: fmtDate(row.day.toISOString()),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
});
