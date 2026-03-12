import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { validateOptionalEventId } from '@/server/lib/admin-relations';
import { assertEnum, assertRequired, MAP_ACTOR_KEYS, MAP_PRIORITIES, parseISODate, safeJson, ZONE_TYPES } from '@/server/lib/admin-validate';
import { err,ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;
  const body = await safeJson(req);
  if (body instanceof NextResponse) return body;

  const missing = assertRequired(body, ['id', 'actor', 'priority', 'category', 'type']);
  if (missing) return err('VALIDATION', missing);

  const actorErr = assertEnum(body.actor, MAP_ACTOR_KEYS, 'actor');
  if (actorErr) return err('VALIDATION', actorErr);

  const priorityErr = assertEnum(body.priority, MAP_PRIORITIES, 'priority');
  if (priorityErr) return err('VALIDATION', priorityErr);

  const typeErr = assertEnum(body.type, ZONE_TYPES, 'type');
  if (typeErr) return err('VALIDATION', typeErr);

  // Threat zone needs coordinates (polygon)
  if (!body.geometry?.coordinates) {
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
      geometry: body.geometry,
      properties: body.properties ?? {},
    },
  });

  return ok({ id: feature.id, created: true });
}
