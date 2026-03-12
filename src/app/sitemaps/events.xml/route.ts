import { createXmlResponse, renderSitemap, toAbsoluteUrl } from '@/features/browse/lib/sitemap';

import { publicConflictId } from '@/shared/lib/env';
import { prisma } from '@/server/lib/db';

const CONFLICT_ID = publicConflictId;

export async function GET() {
  const events = await prisma.intelEvent.findMany({
    where: { conflictId: CONFLICT_ID },
    select: { id: true, updatedAt: true },
    orderBy: { timestamp: 'desc' },
  });

  return createXmlResponse(
    renderSitemap(
      events.map((event) => ({
        url: toAbsoluteUrl(`/browse/events/${event.id}`),
        lastModified: event.updatedAt,
      })),
    ),
  );
}
