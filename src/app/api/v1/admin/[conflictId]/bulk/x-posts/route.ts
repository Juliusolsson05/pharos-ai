import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { parseBodyWithSchema } from '@/server/lib/admin-schema-utils';
import { adminBulkXPostsSchema } from '@/server/lib/admin-schemas';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { upsertXPostDocument } from '@/server/lib/rag/indexer';
import { isXAIConfigured } from '@/server/lib/xai-client';
import { shouldSkipVerification, verifyXPost } from '@/server/lib/xai-verify';

import { AccountType, PostType, SignificanceLevel, VerificationStatus } from '@/generated/prisma/client';

type ValidatedPost = {
  id: string;
  handle: string;
  displayName: string;
  content: string;
  accountType: string;
  significance: string;
  timestamp: Date;
  postType: string;
  tweetId: string | null;
  avatar: string;
  avatarColor: string;
  verified: boolean;
  images: string[];
  videoThumb: string | null;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  pharosNote: string | null;
  eventId: string | null;
  actorId: string | null;
  verificationStatus: VerificationStatus;
  verificationResult: Record<string, unknown> | null;
  verifiedAt: Date | null;
  xaiCitations: string[];
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const body = await parseBodyWithSchema(req, adminBulkXPostsSchema);
  if (body instanceof NextResponse) return body;

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  const skipVerification = shouldSkipVerification(req.nextUrl.searchParams);
  const xaiConfigured = isXAIConfigured();

  const errors: { index: number; error: string }[] = [];
  const validated: ValidatedPost[] = [];

  for (let i = 0; i < body.posts.length; i++) {
    const item = body.posts[i];
    const postType = item.postType;

    let verificationStatus: VerificationStatus = VerificationStatus.UNVERIFIED;
    let verificationResult: Record<string, unknown> | null = null;
    let verifiedAt: Date | null = null;
    let xaiCitations: string[] = [];

    if (!skipVerification && xaiConfigured) {
      const outcome = await verifyXPost({
        tweetId: item.tweetId,
        postType,
        handle: item.handle,
        content: item.content,
      });

      verificationStatus = outcome.status as VerificationStatus;
      verificationResult = outcome.result;
      verifiedAt = new Date();
      xaiCitations = outcome.citations;

      if (postType === 'XPOST' && outcome.status === 'FAILED') {
        errors.push({
          index: i,
          error: `Tweet verification failed for "${item.handle}": ${outcome.result.discrepancies?.join('; ') ?? 'Tweet does not exist or content does not match'}`,
        });
        continue;
      }
    }

    validated.push({
      id: item.id,
      handle: item.handle,
      displayName: item.displayName,
      content: item.content,
      accountType: item.accountType,
      significance: item.significance,
      timestamp: new Date(item.timestamp),
      postType,
      tweetId: item.tweetId ?? null,
      avatar: item.avatar ?? '',
      avatarColor: item.avatarColor ?? '#6B7280',
      verified: item.verified ?? false,
      images: item.images ?? [],
      videoThumb: item.videoThumb ?? null,
      likes: item.likes ?? 0,
      retweets: item.retweets ?? 0,
      replies: item.replies ?? 0,
      views: item.views ?? 0,
      pharosNote: item.pharosNote ?? null,
      eventId: item.eventId ?? null,
      actorId: item.actorId ?? null,
      verificationStatus,
      verificationResult,
      verifiedAt,
      xaiCitations,
    });
  }

  if (errors.length > 0) {
    return err(
      'VALIDATION',
      `${errors.length} item(s) failed verification: ${errors.map((e) => `[${e.index}] ${e.error}`).join('; ')}`,
      400,
    );
  }

  const ids = validated.map((v) => v.id);
  const existing = await prisma.xPost.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  if (existing.length > 0) {
    const dupes = existing.map((e) => e.id);
    return err('DUPLICATE', `X posts already exist: ${dupes.join(', ')}`, 409);
  }

  const created: string[] = [];
  await prisma.$transaction(async (tx) => {
    for (const item of validated) {
      await tx.xPost.create({
        data: {
          id: item.id,
          conflictId,
          tweetId: item.tweetId,
          postType: item.postType as PostType,
          handle: item.handle,
          displayName: item.displayName,
          content: item.content,
          accountType: item.accountType as AccountType,
          significance: item.significance as SignificanceLevel,
          timestamp: item.timestamp,
          avatar: item.avatar,
          avatarColor: item.avatarColor,
          verified: item.verified,
          images: item.images,
          videoThumb: item.videoThumb,
          likes: item.likes,
          retweets: item.retweets,
          replies: item.replies,
          views: item.views,
          pharosNote: item.pharosNote,
          eventId: item.eventId,
          actorId: item.actorId,
          verificationStatus: item.verificationStatus,
          verificationResult: (item.verificationResult ?? undefined) as
            | import('@/generated/prisma/client').Prisma.InputJsonValue
            | undefined,
          verifiedAt: item.verifiedAt,
          xaiCitations: item.xaiCitations,
        },
      });
      created.push(item.id);
    }
  });

  await Promise.all(created.map((id) => upsertXPostDocument(conflictId, id)));

  return ok({ created, errors: [] });
}
