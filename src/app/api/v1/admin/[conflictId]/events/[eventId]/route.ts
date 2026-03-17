import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { parseBodyWithSchema } from '@/server/lib/admin-schema-utils';
import { adminEventUpdateSchema } from '@/server/lib/admin-schemas';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { removeEventDocument, upsertEventDocument } from '@/server/lib/rag/indexer';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; eventId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, eventId } = await params;
  const body = await parseBodyWithSchema(req, adminEventUpdateSchema);
  if (body instanceof NextResponse) return body;

  const event = await prisma.intelEvent.findFirst({
    where: { id: eventId, conflictId },
  });
  if (!event) return err('NOT_FOUND', `Event ${eventId} not found`, 404);

  const data: Record<string, unknown> = {};
  if (body.severity !== undefined) data.severity = body.severity;
  if (body.type !== undefined) data.type = body.type;
  if (body.timestamp !== undefined) data.timestamp = new Date(body.timestamp);
  if (body.title !== undefined) data.title = body.title;
  if (body.location !== undefined) data.location = body.location;
  if (body.summary !== undefined) data.summary = body.summary;
  if (body.fullContent !== undefined) data.fullContent = body.fullContent;
  if (body.verified !== undefined) data.verified = body.verified;
  if (body.tags !== undefined) data.tags = body.tags;

  const updated = await prisma.intelEvent.update({
    where: { id: eventId },
    data,
  });

  await upsertEventDocument(conflictId, updated.id);

  return ok({ id: updated.id, updated: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; eventId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, eventId } = await params;

  const event = await prisma.intelEvent.findFirst({
    where: { id: eventId, conflictId },
  });
  if (!event) return err('NOT_FOUND', `Event ${eventId} not found`, 404);

  await prisma.intelEvent.delete({ where: { id: eventId } });
  await removeEventDocument(conflictId, eventId);

  return ok({ id: eventId, deleted: true });
}
