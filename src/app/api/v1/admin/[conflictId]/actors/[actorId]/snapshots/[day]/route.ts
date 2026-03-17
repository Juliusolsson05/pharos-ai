import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { parseBodyWithSchema, parseDayParam } from '@/server/lib/admin-schema-utils';
import { adminActorSnapshotUpdateSchema } from '@/server/lib/admin-schemas';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { upsertActorDocument } from '@/server/lib/rag/indexer';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; actorId: string; day: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, actorId, day: dayStr } = await params;
  const body = await parseBodyWithSchema(req, adminActorSnapshotUpdateSchema);
  if (body instanceof NextResponse) return body;

  const actor = await prisma.actor.findFirst({ where: { id: actorId, conflictId } });
  if (!actor) return err('NOT_FOUND', `Actor ${actorId} not found`, 404);

  const day = parseDayParam(dayStr);
  if (!day) return err('VALIDATION', 'Invalid day format', 422);

  const snapshot = await prisma.actorDaySnapshot.findUnique({
    where: { actorId_day: { actorId, day } },
  });
  if (!snapshot) return err('NOT_FOUND', `Snapshot for ${actorId} on ${dayStr} not found`, 404);

  const data: Record<string, unknown> = {};
  if (body.activityLevel !== undefined) data.activityLevel = body.activityLevel;
  if (body.stance !== undefined) data.stance = body.stance;
  if (body.activityScore !== undefined) data.activityScore = body.activityScore;
  if (body.saying !== undefined) data.saying = body.saying;
  if (body.doing !== undefined) data.doing = body.doing;
  if (body.assessment !== undefined) data.assessment = body.assessment;

  const updated = await prisma.actorDaySnapshot.update({
    where: { id: snapshot.id },
    data,
  });

  await upsertActorDocument(conflictId, actorId);

  return ok({ id: updated.id, updated: true });
}
