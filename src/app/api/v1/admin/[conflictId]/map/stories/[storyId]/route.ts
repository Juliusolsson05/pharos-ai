import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { validateOptionalEventId, validateOptionalEventIds } from '@/server/lib/admin-relations';
import { assertEnum, parseISODate, safeJson, STORY_ICON_NAMES } from '@/server/lib/admin-validate';
import { err,ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

import { StoryCategory } from '@/generated/prisma/client';

const CATEGORIES = Object.values(StoryCategory);

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; storyId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, storyId } = await params;
  const body = await safeJson(req);
  if (body instanceof NextResponse) return body;

  const story = await prisma.mapStory.findFirst({ where: { id: storyId, conflictId } });
  if (!story) return err('NOT_FOUND', `Map story ${storyId} not found`, 404);

  const data: Record<string, unknown> = {};

  // Guard: events are not updated via this endpoint
  if (body.events !== undefined) {
    return err('VALIDATION', 'Cannot update story events via PUT /map/stories/{id}. Use PUT /map/stories/{id}/events to replace all events, or POST /map/stories/{id}/events to append.');
  }

  if (body.category !== undefined) {
    const e = assertEnum(body.category, CATEGORIES, 'category');
    if (e) return err('VALIDATION', e);
    data.category = body.category;
  }
  if (body.iconName !== undefined) {
    const e = assertEnum(body.iconName, STORY_ICON_NAMES, 'iconName');
    if (e) return err('VALIDATION', e);
    data.iconName = body.iconName;
  }
  if (body.primaryEventId !== undefined) {
    const primaryErr = await validateOptionalEventId(conflictId, body.primaryEventId);
    if (primaryErr) return err('VALIDATION', primaryErr);
    data.primaryEventId = body.primaryEventId;
  }
  if (body.sourceEventIds !== undefined) {
    const sourceErr = await validateOptionalEventIds(conflictId, body.sourceEventIds);
    if (sourceErr) return err('VALIDATION', sourceErr);
    data.sourceEventIds = body.sourceEventIds;
  }
  if (body.timestamp !== undefined) {
    const ts = parseISODate(body.timestamp, 'timestamp');
    if (typeof ts === 'string') return err('VALIDATION', ts);
    data.timestamp = ts;
  }
  if (body.title !== undefined) data.title = body.title;
  if (body.tagline !== undefined) data.tagline = body.tagline;
  if (body.narrative !== undefined) data.narrative = body.narrative;
  if (body.highlightStrikeIds !== undefined) data.highlightStrikeIds = body.highlightStrikeIds;
  if (body.highlightMissileIds !== undefined) data.highlightMissileIds = body.highlightMissileIds;
  if (body.highlightTargetIds !== undefined) data.highlightTargetIds = body.highlightTargetIds;
  if (body.highlightAssetIds !== undefined) data.highlightAssetIds = body.highlightAssetIds;
  if (body.viewState !== undefined) data.viewState = body.viewState;
  if (body.keyFacts !== undefined) data.keyFacts = body.keyFacts;

  const updated = await prisma.mapStory.update({ where: { id: storyId }, data });

  return ok({ id: updated.id, updated: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; storyId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, storyId } = await params;

  const story = await prisma.mapStory.findFirst({ where: { id: storyId, conflictId } });
  if (!story) return err('NOT_FOUND', `Map story ${storyId} not found`, 404);

  await prisma.mapStory.delete({ where: { id: storyId } });

  return ok({ id: storyId, deleted: true });
}
