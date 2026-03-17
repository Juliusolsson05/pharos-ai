import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { parseBodyWithSchema } from '@/server/lib/admin-schema-utils';
import { adminActorActionCreateSchema } from '@/server/lib/admin-schemas';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { upsertActorDocument } from '@/server/lib/rag/indexer';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; actorId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, actorId } = await params;
  const body = await parseBodyWithSchema(req, adminActorActionCreateSchema);
  if (body instanceof NextResponse) return body;

  const actor = await prisma.actor.findFirst({ where: { id: actorId, conflictId } });
  if (!actor) return err('NOT_FOUND', `Actor ${actorId} not found`, 404);

  const action = await prisma.actorAction.create({
    data: {
      actorId,
      date: body.date,
      type: body.type,
      description: body.description,
      verified: body.verified ?? false,
      significance: body.significance,
    },
  });

  await upsertActorDocument(conflictId, actorId);

  return ok({ id: action.id, created: true });
}
