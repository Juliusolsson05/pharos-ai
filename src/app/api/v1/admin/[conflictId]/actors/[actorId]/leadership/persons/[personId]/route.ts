import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { parseBodyWithSchema, toJsonValue } from '@/server/lib/admin-schema-utils';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { leadershipPersonPatchSchema } from '@/server/lib/leadership-schemas';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; actorId: string; personId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, actorId, personId } = await params;
  const body = await parseBodyWithSchema(req, leadershipPersonPatchSchema);
  if (body instanceof NextResponse) return body;

  const person = await prisma.leadershipPerson.findFirst({
    where: { conflictId, actorId, id: personId },
    select: { id: true },
  });
  if (!person) return err('NOT_FOUND', `Leadership person ${personId} not found`, 404);

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.status !== undefined) data.status = body.status;
  if (body.kind !== undefined) data.kind = body.kind;
  if (body.summary !== undefined) data.summary = body.summary;
  if (body.metadata !== undefined) data.metadata = toJsonValue(body.metadata);
  if (body.wikipediaQuery !== undefined) data.wikipediaQuery = body.wikipediaQuery;
  if (body.wikipediaTitle !== undefined) data.wikipediaTitle = body.wikipediaTitle;
  if (body.wikipediaPageUrl !== undefined) data.wikipediaPageUrl = body.wikipediaPageUrl;
  if (body.wikipediaImageUrl !== undefined) data.wikipediaImageUrl = body.wikipediaImageUrl;
  if (body.wikipediaResolvedAt !== undefined) {
    data.wikipediaResolvedAt = body.wikipediaResolvedAt ? new Date(body.wikipediaResolvedAt) : null;
  }

  const updated = await prisma.leadershipPerson.update({
    where: { conflictId_actorId_id: { conflictId, actorId, id: personId } },
    data,
  });

  return ok({ id: updated.id, updated: true });
}
