import { NextRequest } from 'next/server';

import { err, ok, parseDayRange } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

import type { Prisma } from '@/generated/prisma/client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sp = req.nextUrl.searchParams;
  const day = sp.get('day');
  const significance = sp.get('significance');
  const accountType = sp.get('accountType');
  const pharosOnly = sp.get('pharosOnly');

  const where: Prisma.XPostWhereInput = { conflictId: id };

  if (day) {
    const range = parseDayRange(day);
    where.timestamp = { gte: range.gte, lt: range.lt };
  }
  if (significance) where.significance = significance as Prisma.EnumSignificanceLevelFilter['equals'];
  if (accountType) where.accountType = accountType as Prisma.EnumAccountTypeFilter['equals'];
  if (pharosOnly === 'true') where.pharosNote = { not: null };

  const posts = await prisma.xPost.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    include: {
      actor: {
        select: { cssVar: true, colorRgb: true },
      },
    },
  });

  if (posts.length === 0 && !(await prisma.conflict.findUnique({ where: { id } }))) {
    return err('NOT_FOUND', `Conflict ${id} not found`, 404);
  }

  const data = posts.map(p => ({
    id: p.id,
    tweetId: p.tweetId,
    postType: p.postType,
    handle: p.handle,
    displayName: p.displayName,
    avatar: p.avatar,
    avatarColor: p.avatarColor,
    verified: p.verified,
    accountType: p.accountType,
    significance: p.significance,
    timestamp: p.timestamp.toISOString(),
    content: p.content,
    images: p.images,
    videoThumb: p.videoThumb,
    likes: p.likes,
    retweets: p.retweets,
    replies: p.replies,
    views: p.views,
    eventId: p.eventId,
    actorId: p.actorId,
    actorCssVar: p.actor?.cssVar ?? null,
    actorColorRgb: p.actor?.colorRgb ?? [],
    pharosNote: p.pharosNote,
    verificationStatus: p.verificationStatus,
    verifiedAt: p.verifiedAt?.toISOString() ?? null,
    xaiCitations: p.xaiCitations,
  }));

  return ok(data);
}
