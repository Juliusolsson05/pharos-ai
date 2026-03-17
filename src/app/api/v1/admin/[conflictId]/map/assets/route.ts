import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { validateOptionalEventId } from '@/server/lib/admin-relations';
import { parseBodyWithSchema, toJsonValue } from '@/server/lib/admin-schema-utils';
import { adminAssetCreateSchema } from '@/server/lib/admin-schemas';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { checkMapFeatureEnforcement } from '@/server/lib/enforcement';
import { enforcementResponse, isEnforcementMode } from '@/server/lib/enforcement-utils';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const body = await parseBodyWithSchema(req, adminAssetCreateSchema);
  if (body instanceof NextResponse) return body;

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  const eventErr = await validateOptionalEventId(conflictId, body.sourceEventId ?? null);
  if (eventErr) return err('VALIDATION', eventErr);

  if (isEnforcementMode(req)) {
    const issues = checkMapFeatureEnforcement(body, 'ASSET');
    return enforcementResponse(body, issues);
  }

  const existing = await prisma.mapFeature.findUnique({ where: { id: body.id } });
  if (existing) return err('DUPLICATE', `Map feature ${body.id} already exists`, 409);

  const feature = await prisma.mapFeature.create({
    data: {
      id: body.id,
      conflictId,
      featureType: 'ASSET',
      sourceEventId: body.sourceEventId ?? null,
      actor: body.actor,
      priority: body.priority,
      category: body.category,
      type: body.type,
      status: body.status ?? null,
      timestamp: body.timestamp ? new Date(body.timestamp) : null,
      geometry: toJsonValue(body.geometry),
      properties: toJsonValue(body.properties ?? {}),
    },
  });

  return ok({ id: feature.id, created: true });
}
