import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { parseBodyWithSchema } from '@/server/lib/admin-schema-utils';
import { adminStoryEventsAppendSchema, adminStoryEventsReplaceSchema } from '@/server/lib/admin-schemas';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { upsertMapStoryDocument } from '@/server/lib/rag/indexer';

/** POST — append events to a story */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; storyId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, storyId } = await params;
  const body = await parseBodyWithSchema(req, adminStoryEventsAppendSchema);
  if (body instanceof NextResponse) return body;

  const story = await prisma.mapStory.findFirst({ where: { id: storyId, conflictId } });
  if (!story) return err('NOT_FOUND', `Map story ${storyId} not found`, 404);

  const lastEvent = await prisma.mapStoryEvent.findFirst({
    where: { storyId },
    orderBy: { ord: 'desc' },
    select: { ord: true },
  });
  const startOrd = (lastEvent?.ord ?? -1) + 1;

  const created = await prisma.mapStoryEvent.createMany({
    data: body.events.map((e, i) => ({
      storyId,
      ord: startOrd + i,
      time: e.time,
      label: e.label,
      type: e.type,
    })),
  });

  await upsertMapStoryDocument(conflictId, storyId);

  return ok({ storyId, added: created.count });
}

/**
 * PUT — replace all events on a story.
 * Deletes existing events and creates the new set in a single transaction.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; storyId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, storyId } = await params;
  const body = await parseBodyWithSchema(req, adminStoryEventsReplaceSchema);
  if (body instanceof NextResponse) return body;

  const story = await prisma.mapStory.findFirst({ where: { id: storyId, conflictId } });
  if (!story) return err('NOT_FOUND', `Map story ${storyId} not found`, 404);

  const [, created] = await prisma.$transaction([
    prisma.mapStoryEvent.deleteMany({ where: { storyId } }),
    prisma.mapStoryEvent.createMany({
      data: body.events.map((e, i) => ({
        storyId,
        ord: i,
        time: e.time,
        label: e.label,
        type: e.type,
      })),
    }),
  ]);

  await upsertMapStoryDocument(conflictId, storyId);

  return ok({ storyId, replaced: created.count });
}
