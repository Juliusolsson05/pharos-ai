import { NextRequest } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { MAP_ACTOR_KEYS, MAP_PRIORITIES } from '@/server/lib/admin-validate';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { getConflictDayRange, getConflictTimezone } from '@/server/lib/pharos-time';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;

  const conflict = await prisma.conflict.findUnique({
    where: { id: conflictId },
    select: { id: true, timezone: true },
  });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  const timezone = getConflictTimezone(conflict);
  const { today, dayDate } = getConflictDayRange(timezone);

  const [
    eventsWithoutSources,
    eventsWithoutResponses,
    unlinkedXPosts,
    actorsWithoutSnapshot,
    todaySnapshot,
    orphanedXPosts,
    verificationCoverage,
    failedVerificationPosts,
    allMapFeatures,
    allMapStories,
  ] = await Promise.all([
    prisma.intelEvent.findMany({
      where: {
        conflictId,
        sources: { none: {} },
      },
      select: { id: true, title: true, timestamp: true },
    }),
    prisma.intelEvent.findMany({
      where: {
        conflictId,
        actorResponses: { none: {} },
      },
      select: { id: true, title: true, timestamp: true },
    }),
    prisma.xPost.findMany({
      where: { conflictId, eventId: null },
      select: { id: true, handle: true, timestamp: true },
    }),
    prisma.actor.findMany({
      where: {
        conflictId,
        daySnapshots: { none: { day: dayDate } },
      },
      select: { id: true, name: true },
    }),
    prisma.conflictDaySnapshot.findFirst({
      where: { conflictId, day: dayDate },
      select: { id: true },
    }),
    prisma.$queryRaw<{ id: string; eventId: string }[]>`
      SELECT xp.id, xp."eventId"
      FROM "XPost" xp
      LEFT JOIN "IntelEvent" ie ON xp."eventId" = ie.id
      WHERE xp."conflictId" = ${conflictId}
        AND xp."eventId" IS NOT NULL
        AND ie.id IS NULL
    `,
    prisma.xPost.groupBy({
      by: ['verificationStatus'],
      where: { conflictId },
      _count: true,
    }),
    prisma.xPost.findMany({
      where: { conflictId, verificationStatus: 'FAILED' },
      select: { id: true, handle: true, tweetId: true, postType: true, timestamp: true },
      orderBy: { timestamp: 'desc' },
    }),
    prisma.mapFeature.findMany({
      where: { conflictId },
      select: { id: true, actor: true, priority: true, type: true, sourceEventId: true },
    }),
    prisma.mapStory.findMany({
      where: { conflictId },
      select: {
        id: true,
        title: true,
        primaryEventId: true,
        sourceEventIds: true,
        highlightStrikeIds: true,
        highlightMissileIds: true,
        highlightTargetIds: true,
        highlightAssetIds: true,
      },
    }),
  ]);

  const featureIdSet = new Set(allMapFeatures.map(feature => feature.id));
  const invalidActorFeatures = allMapFeatures.filter(
    feature => !(MAP_ACTOR_KEYS as readonly string[]).includes(feature.actor),
  );
  const invalidPriorityFeatures = allMapFeatures.filter(
    feature => !(MAP_PRIORITIES as readonly string[]).includes(feature.priority),
  );

  const brokenStoryHighlights: { storyId: string; storyTitle: string; field: string; missingId: string }[] = [];
  for (const story of allMapStories) {
    const checks: [string, string[]][] = [
      ['highlightStrikeIds', story.highlightStrikeIds],
      ['highlightMissileIds', story.highlightMissileIds],
      ['highlightTargetIds', story.highlightTargetIds],
      ['highlightAssetIds', story.highlightAssetIds],
    ];

    for (const [field, ids] of checks) {
      for (const id of ids) {
        if (!featureIdSet.has(id)) {
          brokenStoryHighlights.push({ storyId: story.id, storyTitle: story.title, field, missingId: id });
        }
      }
    }
  }

  return ok({
    today,
    timezone,
    missingDaySnapshot: !todaySnapshot,
    issues: {
      eventsWithoutSources: {
        count: eventsWithoutSources.length,
        items: eventsWithoutSources.map(event => ({
          id: event.id,
          title: event.title,
          timestamp: event.timestamp.toISOString(),
        })),
      },
      eventsWithoutResponses: {
        count: eventsWithoutResponses.length,
        items: eventsWithoutResponses.map(event => ({
          id: event.id,
          title: event.title,
          timestamp: event.timestamp.toISOString(),
        })),
      },
      unlinkedXPosts: {
        count: unlinkedXPosts.length,
        items: unlinkedXPosts.map(post => ({
          id: post.id,
          handle: post.handle,
          timestamp: post.timestamp.toISOString(),
        })),
      },
      actorsWithoutTodaySnapshot: {
        count: actorsWithoutSnapshot.length,
        items: actorsWithoutSnapshot,
      },
      orphanedXPostEventRefs: {
        count: orphanedXPosts.length,
        items: orphanedXPosts,
      },
      invalidActorOnMapFeatures: {
        count: invalidActorFeatures.length,
        items: invalidActorFeatures.map(feature => ({
          id: feature.id,
          actor: feature.actor,
          validActors: MAP_ACTOR_KEYS,
          sourceEventId: feature.sourceEventId,
        })),
      },
      invalidPriorityOnMapFeatures: {
        count: invalidPriorityFeatures.length,
        items: invalidPriorityFeatures.map(feature => ({
          id: feature.id,
          priority: feature.priority,
          sourceEventId: feature.sourceEventId,
        })),
      },
      brokenStoryHighlightRefs: {
        count: brokenStoryHighlights.length,
        items: brokenStoryHighlights,
      },
      storyEventLinkCoverage: {
        count: allMapStories.length,
        items: allMapStories.map(story => ({
          id: story.id,
          title: story.title,
          primaryEventId: story.primaryEventId,
          sourceEventIds: story.sourceEventIds,
        })),
      },
      verificationCoverage: {
        breakdown: Object.fromEntries(
          verificationCoverage.map(group => [group.verificationStatus, group._count]),
        ),
        failedPosts: {
          count: failedVerificationPosts.length,
          items: failedVerificationPosts.map(post => ({
            id: post.id,
            handle: post.handle,
            tweetId: post.tweetId,
            postType: post.postType,
            timestamp: post.timestamp.toISOString(),
          })),
        },
      },
    },
  });
}
