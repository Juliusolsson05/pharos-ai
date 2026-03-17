import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { parseBodyWithSchema } from '@/server/lib/admin-schema-utils';
import { adminXPostCreateSchema } from '@/server/lib/admin-schemas';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { checkXPostEnforcement } from '@/server/lib/enforcement';
import { enforcementResponse, isEnforcementMode } from '@/server/lib/enforcement-utils';
import { upsertXPostDocument } from '@/server/lib/rag/indexer';
import { isXAIConfigured } from '@/server/lib/xai-client';
import { shouldSkipVerification, verifyXPost } from '@/server/lib/xai-verify';

import { PostType, VerificationStatus } from '@/generated/prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const body = await parseBodyWithSchema(req, adminXPostCreateSchema);
  if (body instanceof NextResponse) return body;
  const postType = body.postType;
  const ts = new Date(body.timestamp);

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  if (isEnforcementMode(req)) {
    const issues = checkXPostEnforcement(body);
    return enforcementResponse(body, issues);
  }

  const existing = await prisma.xPost.findUnique({ where: { id: body.id } });
  if (existing) return err('DUPLICATE', `X post ${body.id} already exists`, 409);

  // FK checks
  if (body.eventId) {
    const event = await prisma.intelEvent.findFirst({ where: { id: body.eventId, conflictId } });
    if (!event) return err('VALIDATION', `Event ${body.eventId} not found`);
  }
  if (body.actorId) {
    const actor = await prisma.actor.findFirst({ where: { id: body.actorId, conflictId } });
    if (!actor) return err('VALIDATION', `Actor ${body.actorId} not found`);
  }

  // Inline verification via X AI
  let verificationStatus: VerificationStatus = VerificationStatus.UNVERIFIED;
  let verificationResult: Record<string, unknown> | null = null;
  let verifiedAt: Date | null = null;
  let xaiCitations: string[] = [];

  const skipVerification = shouldSkipVerification(req.nextUrl.searchParams);

  if (!skipVerification && isXAIConfigured()) {
    const outcome = await verifyXPost({
      tweetId: body.tweetId,
      postType,
      handle: body.handle,
      content: body.content,
    });

    verificationStatus = outcome.status as VerificationStatus;
    verificationResult = outcome.result;
    verifiedAt = new Date();
    xaiCitations = outcome.citations;

    if (postType === PostType.XPOST && outcome.status === 'FAILED') {
      return err(
        'VERIFICATION_FAILED',
        `Tweet verification failed: ${outcome.result.discrepancies?.join('; ') ?? 'Tweet does not exist or content does not match'}. ` +
        `Use POST /verify/search to find real tweets, or add ?skipVerification=true to bypass (not recommended).`,
        422,
      );
    }
  }

  const post = await prisma.xPost.create({
    data: {
      id: body.id,
      conflictId,
      tweetId:     body.tweetId    ?? null,
      postType,
      handle:      body.handle,
      displayName: body.displayName,
      avatar:      body.avatar     ?? '',
      avatarColor: body.avatarColor ?? '#6B7280',
      verified:    body.verified   ?? false,
      accountType: body.accountType,
      significance: body.significance,
      timestamp:   ts,
      content:     body.content,
      images:      body.images     ?? [],
      videoThumb:  body.videoThumb ?? null,
      likes:       body.likes      ?? 0,
      retweets:    body.retweets   ?? 0,
      replies:     body.replies    ?? 0,
      views:       body.views      ?? 0,
      pharosNote:  body.pharosNote ?? null,
      eventId:     body.eventId    ?? null,
      actorId:     body.actorId    ?? null,
      verificationStatus,
      verificationResult: (verificationResult ?? undefined) as import('@/generated/prisma/client').Prisma.InputJsonValue | undefined,
      verifiedAt,
      xaiCitations,
    },
  });

  await upsertXPostDocument(conflictId, post.id);

  return ok({
    id: post.id,
    created: true,
    verificationStatus,
    verifiedAt: verifiedAt?.toISOString() ?? null,
  });
}
