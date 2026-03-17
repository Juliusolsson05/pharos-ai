import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { parseBodyWithSchema } from '@/server/lib/admin-schema-utils';
import { adminActorSnapshotCreateSchema } from '@/server/lib/admin-schemas';
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
  const body = await parseBodyWithSchema(req, adminActorSnapshotCreateSchema);
  if (body instanceof NextResponse) return body;

  const actor = await prisma.actor.findFirst({ where: { id: actorId, conflictId } });
  if (!actor) return err('NOT_FOUND', `Actor ${actorId} not found`, 404);

  const day = new Date(body.day + 'T00:00:00Z');

  const existing = await prisma.actorDaySnapshot.findUnique({
    where: { actorId_day: { actorId, day } },
  });
  if (existing) return err('DUPLICATE', `Snapshot for ${actorId} on ${body.day} already exists`, 409);

  const snapshot = await prisma.actorDaySnapshot.create({
    data: {
      actorId,
      day,
      activityLevel: body.activityLevel,
      activityScore: body.activityScore,
      stance: body.stance,
      saying: body.saying,
      doing: body.doing,
      assessment: body.assessment,
    },
  });

  await upsertActorDocument(conflictId, actorId);

  return ok({ id: snapshot.id, created: true });
}
