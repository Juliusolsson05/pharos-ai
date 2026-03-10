import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; actorId: string }> }) {
  const { id, actorId } = await params;

  const posts = await prisma.xPost.findMany({
    where: { conflictId: id, actorId },
    orderBy: { timestamp: 'desc' },
    include: {
      actor: {
        select: { cssVar: true, colorRgb: true },
      },
    },
  });

  return ok(posts.map(p => ({
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
  })));
}
