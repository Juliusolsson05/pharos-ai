/** Batch verify X posts (max 20 for cost control). */

import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { parseBodyWithSchema } from '@/server/lib/admin-schema-utils';
import { adminVerifyBatchSchema } from '@/server/lib/admin-schemas';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { upsertXPostDocument } from '@/server/lib/rag/indexer';
import { isXAIConfigured } from '@/server/lib/xai-client';
import { verifyXPost } from '@/server/lib/xai-verify';

import type { Prisma } from '@/generated/prisma/client';
import { PostType, VerificationStatus } from '@/generated/prisma/client';

const MAX_BATCH = 20;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const body = await parseBodyWithSchema(req, adminVerifyBatchSchema);
  if (body instanceof NextResponse) return body;

  if (!isXAIConfigured()) {
    return err('SERVER_ERROR', 'XAI_API_KEY is not configured. Cannot verify posts.', 503);
  }

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  let posts;

  if (body.postIds && body.postIds.length > 0) {
    posts = await prisma.xPost.findMany({
      where: { id: { in: body.postIds }, conflictId },
    });
  } else {
    const where: Prisma.XPostWhereInput = { conflictId };
    const limit = Math.min(body.filter?.limit ?? MAX_BATCH, MAX_BATCH);

    if (body.filter?.status) {
      where.verificationStatus = body.filter.status as VerificationStatus;
    } else {
      where.verificationStatus = 'UNVERIFIED';
    }

    if (body.filter?.postType) {
      where.postType = body.filter.postType as PostType;
    }

    posts = await prisma.xPost.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  if (posts.length === 0) {
    return ok({
      results: [],
      summary: { verified: 0, failed: 0, partial: 0, skipped: 0, total: 0 },
    });
  }

  const results: {
    postId: string;
    handle: string;
    postType: string;
    previousStatus: string;
    newStatus: string;
    result: Record<string, unknown>;
    citations: string[];
  }[] = [];

  const summary = { verified: 0, failed: 0, partial: 0, skipped: 0, total: posts.length };

  for (const post of posts) {
    const outcome = await verifyXPost({
      tweetId: post.tweetId,
      postType: post.postType,
      handle: post.handle,
      content: post.content,
    });

    await prisma.xPost.update({
      where: { id: post.id },
      data: {
        verificationStatus: outcome.status as VerificationStatus,
        verificationResult:
          outcome.result as import('@/generated/prisma/client').Prisma.InputJsonValue,
        verifiedAt: new Date(),
        xaiCitations: outcome.citations,
      },
    });
    await upsertXPostDocument(conflictId, post.id);

    results.push({
      postId: post.id,
      handle: post.handle,
      postType: post.postType,
      previousStatus: post.verificationStatus,
      newStatus: outcome.status,
      result: outcome.result,
      citations: outcome.citations,
    });

    switch (outcome.status) {
      case 'VERIFIED':
        summary.verified++;
        break;
      case 'FAILED':
        summary.failed++;
        break;
      case 'PARTIAL':
        summary.partial++;
        break;
      case 'SKIPPED':
        summary.skipped++;
        break;
    }
  }

  return ok({ results, summary });
}
