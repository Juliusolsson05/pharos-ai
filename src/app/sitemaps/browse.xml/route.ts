import { BROWSE_PAGE_SIZES, BROWSE_STATIC_ROUTES, buildPaginatedUrls, createXmlResponse, renderSitemap, toAbsoluteUrl } from '@/features/browse/lib/sitemap';

import { publicConflictId } from '@/shared/lib/env';
import { prisma } from '@/server/lib/db';

const CONFLICT_ID = publicConflictId;

export async function GET() {
  const [eventTotal, actorTotal, briefTotal, storyTotal] = await Promise.all([
    prisma.intelEvent.count({ where: { conflictId: CONFLICT_ID } }),
    prisma.actor.count({ where: { conflictId: CONFLICT_ID } }),
    prisma.conflictDaySnapshot.count({ where: { conflictId: CONFLICT_ID } }),
    prisma.mapStory.count({ where: { conflictId: CONFLICT_ID } }),
  ]);

  return createXmlResponse(
    renderSitemap([
      ...BROWSE_STATIC_ROUTES.map((path) => ({ url: toAbsoluteUrl(path) })),
      ...buildPaginatedUrls('/browse/events', eventTotal, BROWSE_PAGE_SIZES.events),
      ...buildPaginatedUrls('/browse/actors', actorTotal, BROWSE_PAGE_SIZES.actors),
      ...buildPaginatedUrls('/browse/brief', briefTotal, BROWSE_PAGE_SIZES.briefs),
      ...buildPaginatedUrls('/browse/stories', storyTotal, BROWSE_PAGE_SIZES.stories),
    ]),
  );
}
