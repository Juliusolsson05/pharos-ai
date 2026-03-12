import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { validateOptionalEventId, validateOptionalEventIds } from '@/server/lib/admin-relations';
import { assertEnum, assertRequired, parseISODate, safeJson, STORY_ICON_NAMES } from '@/server/lib/admin-validate';
import { err,ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { checkStoryEnforcement } from '@/server/lib/enforcement';
import { enforcementResponse,isEnforcementMode } from '@/server/lib/enforcement-utils';

import { StoryCategory } from '@/generated/prisma/client';

const CATEGORIES = Object.values(StoryCategory);

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
    'id', 'title', 'tagline', 'iconName', 'category', 'narrative', 'viewState', 'timestamp',
  ]);
  if (missing) return err('VALIDATION', missing);

  const catErr = assertEnum(body.category, CATEGORIES, 'category');
  if (catErr) return err('VALIDATION', catErr);

  const iconErr = assertEnum(body.iconName, STORY_ICON_NAMES, 'iconName');
  if (iconErr) return err('VALIDATION', iconErr);

  const ts = parseISODate(body.timestamp, 'timestamp');
  if (typeof ts === 'string') return err('VALIDATION', ts);

  // Validate inline event time fields are ISO 8601
  if (Array.isArray(body.events)) {
    for (let i = 0; i < body.events.length; i++) {
      const e = body.events[i];
      const timeCheck = parseISODate(e.time, `events[${i}].time`);
      if (typeof timeCheck === 'string') return err('VALIDATION', timeCheck);
    }
  }

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  const primaryErr = await validateOptionalEventId(conflictId, body.primaryEventId ?? null);
  if (primaryErr) return err('VALIDATION', primaryErr);

  const sourceIdsErr = await validateOptionalEventIds(conflictId, body.sourceEventIds ?? []);
  if (sourceIdsErr) return err('VALIDATION', sourceIdsErr);

  // Enforcement dry-run — quality checks, no DB write
  if (isEnforcementMode(req)) {
    const existingTitles = (
      await prisma.mapStory.findMany({ where: { conflictId }, select: { title: true } })
    ).map(s => s.title);
    const issues = checkStoryEnforcement(body, { existingTitles });
    return enforcementResponse(body, issues);
  }

  const existing = await prisma.mapStory.findUnique({ where: { id: body.id } });
  if (existing) return err('DUPLICATE', `Map story ${body.id} already exists`, 409);

  const story = await prisma.mapStory.create({
    data: {
      id: body.id,
      conflictId,
      primaryEventId: body.primaryEventId ?? null,
      sourceEventIds: body.sourceEventIds ?? [],
      title: body.title,
      tagline: body.tagline,
      iconName: body.iconName,
      category: body.category,
      narrative: body.narrative,
      highlightStrikeIds: body.highlightStrikeIds ?? [],
      highlightMissileIds: body.highlightMissileIds ?? [],
      highlightTargetIds: body.highlightTargetIds ?? [],
      highlightAssetIds: body.highlightAssetIds ?? [],
      viewState: body.viewState,
      keyFacts: body.keyFacts ?? [],
      timestamp: ts,
      events: body.events?.length
        ? {
            create: body.events.map(
              (e: { time: string; label: string; type: string }, i: number) => ({
                ord: i,
                time: e.time,
                label: e.label,
                type: e.type,
              }),
            ),
          }
        : undefined,
    },
  });

  return ok({ id: story.id, created: true });
}
