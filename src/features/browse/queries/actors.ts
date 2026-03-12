import { cache } from 'react';

import { publicConflictId } from '@/shared/lib/env';
import { prisma } from '@/server/lib/db';

import { PAGE_SIZE } from './page-size';

const CONFLICT_ID = publicConflictId;

type ActorFilters = {
  type?: string[];
  affiliation?: string[];
  page?: number;
};

export const getActors = cache(async (filters?: ActorFilters) => {
  const where: Record<string, unknown> = { conflictId: CONFLICT_ID };

  if (filters?.type?.length) {
    where.type = { in: filters.type };
  }
  if (filters?.affiliation?.length) {
    where.affiliation = { in: filters.affiliation };
  }

  const page = Math.max(1, filters?.page ?? 1);

  const [rows, total] = await Promise.all([
    prisma.actor.findMany({
      where,
      orderBy: { activityScore: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        fullName: true,
        countryCode: true,
        type: true,
        affiliation: true,
        cssVar: true,
        colorRgb: true,
        activityLevel: true,
        activityScore: true,
        stance: true,
        saying: true,
        assessment: true,
      },
    }),
    prisma.actor.count({ where }),
  ]);

  return { actors: rows, total };
});

export const getActor = cache(async (actorId: string) => {
  const row = await prisma.actor.findFirst({
    where: { id: actorId, conflictId: CONFLICT_ID },
    include: {
      actions: { orderBy: { date: 'desc' }, take: 20 },
      responses: {
        include: {
          event: { select: { id: true, title: true, timestamp: true } },
        },
      },
    },
  });

  if (!row) return null;

  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    responses: row.responses.map((r) => ({
      ...r,
      event: r.event
        ? { ...r.event, timestamp: r.event.timestamp.toISOString() }
        : null,
    })),
  };
});
