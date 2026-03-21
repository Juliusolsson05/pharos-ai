import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { validateOptionalEventId } from '@/server/lib/admin-relations';
import { parseBodyWithSchema, toJsonValue } from '@/server/lib/admin-schema-utils';
import { adminThreatZoneCreateSchema } from '@/server/lib/admin-schemas';
import { parseISODate } from '@/server/lib/admin-validate';
import { err,ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { normalizePolygonGeometry } from '@/server/lib/map-feature-geometry';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const body = await parseBodyWithSchema(req, adminThreatZoneCreateSchema);
  if (body instanceof NextResponse) return body;

  const geometry = normalizePolygonGeometry(body.geometry);
  if (!geometry) {
    return err('VALIDATION', 'Threat zone geometry requires coordinates array');
  }

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);

  const eventErr = await validateOptionalEventId(conflictId, body.sourceEventId ?? null);
  if (eventErr) return err('VALIDATION', eventErr);

  const existing = await prisma.mapFeature.findUnique({ where: { id: body.id } });
  if (existing) return err('DUPLICATE', `Map feature ${body.id} already exists`, 409);

  let timestamp: Date | null = null;
  if (body.timestamp) {
    const ts = parseISODate(body.timestamp, 'timestamp');
    if (typeof ts === 'string') return err('VALIDATION', ts);
    timestamp = ts;
  }

  const feature = await prisma.mapFeature.create({
    data: {
      id: body.id,
      conflictId,
      featureType: 'THREAT_ZONE',
      sourceEventId: body.sourceEventId ?? null,
      actor: body.actor,
      priority: body.priority,
      category: body.category,
      type: body.type,
      status: body.status ?? null,
      timestamp,
      geometry,
      properties: toJsonValue(body.properties ?? {}),
    },
  });

  return ok({ id: feature.id, created: true });
}
