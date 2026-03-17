/** Verify a single X post against the X AI API. */

import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { parseBodyWithSchema } from '@/server/lib/admin-schema-utils';
import { adminVerifyPostSchema } from '@/server/lib/admin-schemas';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { upsertXPostDocument } from '@/server/lib/rag/indexer';
import { isXAIConfigured } from '@/server/lib/xai-client';
import { verifyXPost } from '@/server/lib/xai-verify';

import { VerificationStatus } from '@/generated/prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const body = await parseBodyWithSchema(req, adminVerifyPostSchema);
  if (body instanceof NextResponse) return body;

  if (!isXAIConfigured()) {
    return err('SERVER_ERROR', 'XAI_API_KEY is not configured. Cannot verify posts.', 503);
  }

  const post = await prisma.xPost.findFirst({
    where: { id: body.postId, conflictId },
  });
  if (!post) {
    return err('NOT_FOUND', `X post ${body.postId} not found in conflict ${conflictId}`, 404);
  }

  const previousStatus = post.verificationStatus;

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

  return ok({
    postId: post.id,
    previousStatus,
    newStatus: outcome.status,
    result: outcome.result,
    citations: outcome.citations,
  });
}
