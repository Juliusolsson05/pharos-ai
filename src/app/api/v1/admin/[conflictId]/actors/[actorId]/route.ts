import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { parseBodyWithSchema } from '@/server/lib/admin-schema-utils';
import { adminActorUpdateSchema } from '@/server/lib/admin-schemas';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { upsertActorDocument } from '@/server/lib/rag/indexer';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; actorId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, actorId } = await params;
  const body = await parseBodyWithSchema(req, adminActorUpdateSchema);
  if (body instanceof NextResponse) return body;

  const actor = await prisma.actor.findFirst({ where: { id: actorId, conflictId } });
  if (!actor) return err('NOT_FOUND', `Actor ${actorId} not found`, 404);

  const data: Record<string, unknown> = {};
  if (body.activityLevel !== undefined) data.activityLevel = body.activityLevel;
  if (body.stance !== undefined) data.stance = body.stance;
  if (body.activityScore !== undefined) data.activityScore = body.activityScore;
  if (body.saying !== undefined) data.saying = body.saying;
  if (body.doing !== undefined) data.doing = body.doing;
  if (body.assessment !== undefined) data.assessment = body.assessment;
  if (body.keyFigures !== undefined) data.keyFigures = body.keyFigures;
  if (body.linkedEventIds !== undefined) data.linkedEventIds = body.linkedEventIds;

  const updated = await prisma.actor.update({ where: { id: actorId }, data });

  await upsertActorDocument(conflictId, updated.id);

  return ok({ id: updated.id, updated: true });
}
