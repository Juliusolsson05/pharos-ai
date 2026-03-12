import { createXmlResponse, renderSitemap, toAbsoluteUrl } from '@/features/browse/lib/sitemap';

import { publicConflictId } from '@/shared/lib/env';
import { prisma } from '@/server/lib/db';

const CONFLICT_ID = publicConflictId;

export async function GET() {
  const stories = await prisma.mapStory.findMany({
    where: { conflictId: CONFLICT_ID },
    select: { id: true, updatedAt: true },
    orderBy: { timestamp: 'desc' },
  });

  return createXmlResponse(
    renderSitemap(
      stories.map((story) => ({
        url: toAbsoluteUrl(`/browse/stories/${story.id}`),
        lastModified: story.updatedAt,
      })),
    ),
  );
}
