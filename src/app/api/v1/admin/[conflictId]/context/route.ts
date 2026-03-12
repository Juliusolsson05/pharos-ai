import { NextRequest } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { getConflictDayRange, getConflictLocalNow, getConflictTimezone } from '@/server/lib/pharos-time';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const sp = req.nextUrl.searchParams;
  const hours = Math.min(Number(sp.get('hours')) || 48, 168);

  const conflict = await prisma.conflict.findUnique({
    where: { id: conflictId },
    select: { id: true, name: true, status: true, threatLevel: true, escalation: true, timezone: true },
  });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  const timezone = getConflictTimezone(conflict);
  const now = new Date();
  const from = new Date(now.getTime() - hours * 60 * 60 * 1000);
  const { today, dayDate } = getConflictDayRange(timezone, now);

  const [recentEvents, recentXPosts, recentMapFeatures, actors, mapStoryAgg, todaySnapshot, latestDay] = await Promise.all([
    prisma.intelEvent.findMany({
      where: { conflictId, timestamp: { gte: from } },
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        timestamp: true,
        severity: true,
        type: true,
        title: true,
        _count: { select: { sources: true, xPosts: true } },
      },
    }),
    prisma.xPost.findMany({
      where: { conflictId, timestamp: { gte: from } },
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        timestamp: true,
        handle: true,
        significance: true,
        eventId: true,
      },
    }),
    prisma.mapFeature.findMany({
      where: { conflictId, createdAt: { gte: from } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, featureType: true, actor: true, sourceEventId: true },
    }),
    prisma.actor.findMany({
      where: { conflictId },
      select: {
        id: true,
        name: true,
        type: true,
        activityLevel: true,
        stance: true,
        daySnapshots: {
          orderBy: { day: 'desc' },
          take: 1,
          select: { day: true },
        },
      },
    }),
    prisma.mapStory.aggregate({
      where: { conflictId },
      _count: true,
      _max: { timestamp: true },
    }),
    prisma.conflictDaySnapshot.findFirst({
      where: { conflictId, day: dayDate },
      select: { id: true },
    }),
    prisma.conflictDaySnapshot.findFirst({
      where: { conflictId },
      orderBy: { day: 'desc' },
      select: { day: true },
    }),
  ]);

  const eventsWithoutSources = recentEvents
    .filter(event => event._count.sources === 0)
    .map(event => event.id);
  const unlinkedXPosts = recentXPosts.filter(post => !post.eventId).length;
  const actorsWithoutTodaySnapshot = actors
    .filter(actor => {
      const snapshot = actor.daySnapshots[0];
      return !snapshot || snapshot.day.toISOString().slice(0, 10) !== today;
    })
    .map(actor => actor.id);

  return ok({
    conflict,
    window: { from: from.toISOString(), to: now.toISOString(), hours },
    currentDay: {
      today,
      timezone,
      localNow: getConflictLocalNow(timezone, now).label,
      snapshotExists: !!todaySnapshot,
      latestDay: latestDay?.day.toISOString().slice(0, 10) ?? null,
    },
    recentEvents: {
      total: recentEvents.length,
      items: recentEvents.map(event => ({
        id: event.id,
        timestamp: event.timestamp.toISOString(),
        severity: event.severity,
        type: event.type,
        title: event.title,
        sourceCount: event._count.sources,
        xPostCount: event._count.xPosts,
      })),
    },
    recentXPosts: {
      total: recentXPosts.length,
      items: recentXPosts.map(post => ({
        id: post.id,
        timestamp: post.timestamp.toISOString(),
        handle: post.handle,
        significance: post.significance,
        eventId: post.eventId,
      })),
    },
    recentMapFeatures: {
      total: recentMapFeatures.length,
      items: recentMapFeatures,
    },
    actors: actors.map(actor => ({
      id: actor.id,
      name: actor.name,
      type: actor.type,
      activityLevel: actor.activityLevel,
      stance: actor.stance,
      latestSnapshotDay: actor.daySnapshots[0]?.day.toISOString().slice(0, 10) ?? null,
    })),
    mapStories: {
      total: mapStoryAgg._count,
      latestTimestamp: mapStoryAgg._max.timestamp?.toISOString() ?? null,
    },
    hints: {
      missingDaySnapshot: !todaySnapshot,
      actorsWithoutTodaySnapshot,
      unlinkedXPosts,
      eventsWithoutSources,
    },
  });
}
