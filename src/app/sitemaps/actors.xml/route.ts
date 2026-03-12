import { createXmlResponse, renderSitemap, toAbsoluteUrl } from '@/features/browse/lib/sitemap';

import { publicConflictId } from '@/shared/lib/env';
import { prisma } from '@/server/lib/db';

const CONFLICT_ID = publicConflictId;

export async function GET() {
  const actors = await prisma.actor.findMany({
    where: { conflictId: CONFLICT_ID },
    select: { id: true, updatedAt: true },
    orderBy: { activityScore: 'desc' },
  });

  return createXmlResponse(
    renderSitemap(
      actors.map((actor) => ({
        url: toAbsoluteUrl(`/browse/actors/${actor.id}`),
        lastModified: actor.updatedAt,
      })),
    ),
  );
}
