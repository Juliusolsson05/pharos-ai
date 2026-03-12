import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { validateOptionalEventId } from '@/server/lib/admin-relations';
import { assertEnum, INSTALLATION_STATUSES,INSTALLATION_TYPES, KINETIC_STATUSES, KINETIC_TYPES, MAP_ACTOR_KEYS, MAP_PRIORITIES, parseISODate, safeJson, ZONE_TYPES } from '@/server/lib/admin-validate';
import { err,ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ conflictId: string; featureId: string }> },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, featureId } = await params;
  const body = await safeJson(req);
  if (body instanceof NextResponse) return body;

  const feature = await prisma.mapFeature.findFirst({
    where: { id: featureId, conflictId },
  });
  if (!feature) return err('NOT_FOUND', `Map feature ${featureId} not found`, 404);

  // Determine valid type/status enums from the feature's existing featureType
  const isKinetic = feature.featureType === 'STRIKE_ARC' || feature.featureType === 'MISSILE_TRACK';
  const isZone = feature.featureType === 'THREAT_ZONE';
  const validTypes = isKinetic ? KINETIC_TYPES : isZone ? ZONE_TYPES : INSTALLATION_TYPES;
  const validStatuses = isKinetic ? KINETIC_STATUSES : INSTALLATION_STATUSES;

  if (body.actor !== undefined) {
    const e = assertEnum(body.actor, MAP_ACTOR_KEYS, 'actor');
    if (e) return err('VALIDATION', e);
  }
  if (body.priority !== undefined) {
    const e = assertEnum(body.priority, MAP_PRIORITIES, 'priority');
    if (e) return err('VALIDATION', e);
  }
  if (body.type !== undefined) {
    const e = assertEnum(body.type, validTypes, 'type');
    if (e) return err('VALIDATION', e);
  }
  if (body.status !== undefined && body.status !== null && !isZone) {
    const e = assertEnum(body.status, validStatuses, 'status');
    if (e) return err('VALIDATION', e);
  }

  const data: Record<string, unknown> = {};

  if (body.actor !== undefined) data.actor = body.actor;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.category !== undefined) data.category = body.category;
  if (body.type !== undefined) data.type = body.type;
  if (body.status !== undefined) data.status = body.status;
  if (body.geometry !== undefined) data.geometry = body.geometry;
  if (body.properties !== undefined) data.properties = body.properties;
  if (body.timestamp !== undefined) {
    if (body.timestamp === null) {
      data.timestamp = null;
    } else {
      const ts = parseISODate(body.timestamp, 'timestamp');
      if (typeof ts === 'string') return err('VALIDATION', ts);
      data.timestamp = ts;
    }
  }
  if (body.sourceEventId !== undefined) {
    const eventErr = await validateOptionalEventId(conflictId, body.sourceEventId);
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
