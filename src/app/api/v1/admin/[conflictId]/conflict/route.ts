import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { parseBodyWithSchema } from '@/server/lib/admin-schema-utils';
import { adminConflictUpdateSchema } from '@/server/lib/admin-schemas';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const body = await parseBodyWithSchema(req, adminConflictUpdateSchema);
  if (body instanceof NextResponse) return body;

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  const data: Record<string, unknown> = {};
  if (body.status !== undefined) data.status = body.status;
  if (body.threatLevel !== undefined) data.threatLevel = body.threatLevel;
  if (body.escalation !== undefined) data.escalation = body.escalation;
  if (body.name !== undefined) data.name = body.name;
  if (body.summary !== undefined) data.summary = body.summary;
  if (body.keyFacts !== undefined) data.keyFacts = body.keyFacts;
  if (body.timezone !== undefined) data.timezone = body.timezone;

  const updated = await prisma.conflict.update({ where: { id: conflictId }, data });

  return ok({ id: updated.id, updated: true });
}
