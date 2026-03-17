import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { validateOptionalEventId, validateOptionalEventIds } from '@/server/lib/admin-relations';
import { parseBodyWithSchema } from '@/server/lib/admin-schema-utils';
import { adminMapStoryUpdateSchema } from '@/server/lib/admin-schemas';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { removeMapStoryDocument, upsertMapStoryDocument } from '@/server/lib/rag/indexer';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; storyId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, storyId } = await params;
  const body = await parseBodyWithSchema(req, adminMapStoryUpdateSchema);
  if (body instanceof NextResponse) return body;

  const story = await prisma.mapStory.findFirst({ where: { id: storyId, conflictId } });
  if (!story) return err('NOT_FOUND', `Map story ${storyId} not found`, 404);

  if (body.primaryEventId !== undefined && body.primaryEventId !== null) {
    const primaryErr = await validateOptionalEventId(conflictId, body.primaryEventId);
    if (primaryErr) return err('VALIDATION', primaryErr);
  }
  if (body.sourceEventIds !== undefined) {
    const sourceErr = await validateOptionalEventIds(conflictId, body.sourceEventIds);
    if (sourceErr) return err('VALIDATION', sourceErr);
  }

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.tagline !== undefined) data.tagline = body.tagline;
  if (body.iconName !== undefined) data.iconName = body.iconName;
  if (body.category !== undefined) data.category = body.category;
  if (body.narrative !== undefined) data.narrative = body.narrative;
  if (body.primaryEventId !== undefined) data.primaryEventId = body.primaryEventId;
  if (body.sourceEventIds !== undefined) data.sourceEventIds = body.sourceEventIds;
  if (body.highlightStrikeIds !== undefined) data.highlightStrikeIds = body.highlightStrikeIds;
  if (body.highlightMissileIds !== undefined) data.highlightMissileIds = body.highlightMissileIds;
  if (body.highlightTargetIds !== undefined) data.highlightTargetIds = body.highlightTargetIds;
  if (body.highlightAssetIds !== undefined) data.highlightAssetIds = body.highlightAssetIds;
  if (body.viewState !== undefined) data.viewState = body.viewState;
  if (body.keyFacts !== undefined) data.keyFacts = body.keyFacts;
  if (body.timestamp !== undefined) data.timestamp = new Date(body.timestamp);

  const updated = await prisma.mapStory.update({ where: { id: storyId }, data });

  await upsertMapStoryDocument(conflictId, updated.id);

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
  await removeMapStoryDocument(conflictId, storyId);

  return ok({ id: storyId, deleted: true });
}
