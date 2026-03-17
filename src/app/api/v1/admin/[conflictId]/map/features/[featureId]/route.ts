import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { validateOptionalEventId } from '@/server/lib/admin-relations';
import { parseBodyWithSchema, toJsonValue } from '@/server/lib/admin-schema-utils';
import { adminMapFeatureUpdateSchema } from '@/server/lib/admin-schemas';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; featureId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, featureId } = await params;
  const body = await parseBodyWithSchema(req, adminMapFeatureUpdateSchema);
  if (body instanceof NextResponse) return body;

  const feature = await prisma.mapFeature.findFirst({
    where: { id: featureId, conflictId },
  });
  if (!feature) return err('NOT_FOUND', `Map feature ${featureId} not found`, 404);

  const data: Record<string, unknown> = {};
  if (body.actor !== undefined) data.actor = body.actor;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.category !== undefined) data.category = body.category;
  if (body.type !== undefined) data.type = body.type;
  if (body.status !== undefined) data.status = body.status;
  if (body.geometry !== undefined) data.geometry = toJsonValue(body.geometry);
  if (body.properties !== undefined) data.properties = toJsonValue(body.properties);
  if (body.timestamp !== undefined) {
    data.timestamp = body.timestamp === null ? null : new Date(body.timestamp);
  }
  if (body.sourceEventId !== undefined) {
    const eventErr = await validateOptionalEventId(conflictId, body.sourceEventId ?? null);
    if (eventErr) return err('VALIDATION', eventErr);
    data.sourceEventId = body.sourceEventId;
  }

  const updated = await prisma.mapFeature.update({ where: { id: featureId }, data });

  return ok({ id: updated.id, updated: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; featureId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, featureId } = await params;

  const feature = await prisma.mapFeature.findFirst({
    where: { id: featureId, conflictId },
  });
  if (!feature) return err('NOT_FOUND', `Map feature ${featureId} not found`, 404);

  await prisma.mapFeature.delete({ where: { id: featureId } });

  return ok({ id: featureId, deleted: true });
}
