import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ok, err } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-auth';
import { assertRequired, assertEnum, parseISODate, safeJson, POST_TYPES } from '@/lib/admin-validate';
import { checkXPostEnforcement } from '@/lib/enforcement';
import { isEnforcementMode, enforcementResponse } from '@/lib/enforcement-utils';
import { SignificanceLevel, AccountType, PostType } from '@/generated/prisma/client';

const SIGNIFICANCE_LEVELS = Object.values(SignificanceLevel);
const ACCOUNT_TYPES = Object.values(AccountType);
const POST_TYPE_VALUES = Object.values(PostType);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const body = await safeJson(req);
  if (body instanceof NextResponse) return body;

  const missing = assertRequired(body, [
    'id', 'handle', 'displayName', 'content', 'accountType', 'significance', 'timestamp',
  ]);
  if (missing) return err('VALIDATION', missing);

  const sigErr = assertEnum(body.significance, SIGNIFICANCE_LEVELS, 'significance');
  if (sigErr) return err('VALIDATION', sigErr);

  const accErr = assertEnum(body.accountType, ACCOUNT_TYPES, 'accountType');
  if (accErr) return err('VALIDATION', accErr);

  // postType validation — default XPOST
  const postType: PostType = body.postType ?? 'XPOST';
  const ptErr = assertEnum(postType, POST_TYPE_VALUES, 'postType');
  if (ptErr) return err('VALIDATION', ptErr);

  // tweetId required when postType = XPOST
  if (postType === PostType.XPOST && !body.tweetId) {
    return err('VALIDATION', 'tweetId is required when postType is XPOST. Provide a realistic numeric ID string (e.g. "1894731234567890123").');
  }

  const ts = parseISODate(body.timestamp, 'timestamp');
  if (typeof ts === 'string') return err('VALIDATION', ts);

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  // Enforcement dry-run
  if (isEnforcementMode(req)) {
    const issues = checkXPostEnforcement(body);
    return enforcementResponse(body, issues);
  }

  const existing = await prisma.xPost.findUnique({ where: { id: body.id } });
  if (existing) return err('DUPLICATE', `X post ${body.id} already exists`, 409);

  // FK validation for optional references
  if (body.eventId) {
    const event = await prisma.intelEvent.findFirst({ where: { id: body.eventId, conflictId } });
    if (!event) return err('VALIDATION', `Event ${body.eventId} not found`);
  }
  if (body.actorId) {
    const actor = await prisma.actor.findFirst({ where: { id: body.actorId, conflictId } });
    if (!actor) return err('VALIDATION', `Actor ${body.actorId} not found`);
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
    },
  });

  return ok({ id: post.id, created: true });
}
