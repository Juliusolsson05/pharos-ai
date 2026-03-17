import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { parseBodyWithSchema } from '@/server/lib/admin-schema-utils';
import { adminActorResponseCreateSchema } from '@/server/lib/admin-schemas';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { upsertActorDocument, upsertEventDocument } from '@/server/lib/rag/indexer';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; actorId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, actorId } = await params;
  const body = await parseBodyWithSchema(req, adminActorResponseCreateSchema);
  if (body instanceof NextResponse) return body;

  const actor = await prisma.actor.findFirst({ where: { id: actorId, conflictId } });
  if (!actor) return err('NOT_FOUND', `Actor ${actorId} not found`, 404);

  const event = await prisma.intelEvent.findFirst({
    where: { id: body.eventId, conflictId },
  });
  if (!event) return err('VALIDATION', `Event ${body.eventId} not found`);

  const response = await prisma.eventActorResponse.create({
    data: {
      eventId: body.eventId,
      actorId,
      actorName: actor.name,
      stance: body.stance,
      type: body.type,
      statement: body.statement,
    },
  });

  await Promise.all([
    upsertActorDocument(conflictId, actorId),
    upsertEventDocument(conflictId, body.eventId),
  ]);

  return ok({ id: response.id, created: true });
}
