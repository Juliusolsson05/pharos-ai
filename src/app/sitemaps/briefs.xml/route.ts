import { createXmlResponse, renderSitemap, toAbsoluteUrl } from '@/features/browse/lib/sitemap';

import { publicConflictId } from '@/shared/lib/env';
import { prisma } from '@/server/lib/db';

const CONFLICT_ID = publicConflictId;

export async function GET() {
  const briefs = await prisma.conflictDaySnapshot.findMany({
    where: { conflictId: CONFLICT_ID },
    select: { day: true, updatedAt: true },
    orderBy: { day: 'desc' },
  });

  return createXmlResponse(
    renderSitemap(
      briefs.map((brief) => ({
        url: toAbsoluteUrl(`/browse/brief/${brief.day.toISOString().slice(0, 10)}`),
        lastModified: brief.updatedAt,
      })),
    ),
  );
}
