import { NextRequest } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { err, ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ conflictId: string; actorId: string }> }) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId, actorId } = await params;
  const actor = await prisma.actor.findFirst({ where: { id: actorId, conflictId }, select: { id: true, name: true, countryCode: true } });
  if (!actor) return err('NOT_FOUND', `Actor ${actorId} not found`, 404);

  const [persons, roles, relations, tenures, controlStates, events] = await Promise.all([
    prisma.leadershipPerson.findMany({ where: { conflictId, actorId }, orderBy: { name: 'asc' } }),
    prisma.leadershipRole.findMany({ where: { conflictId, actorId }, orderBy: [{ level: 'asc' }, { ord: 'asc' }] }),
    prisma.leadershipRoleRelation.findMany({ where: { conflictId, actorId }, orderBy: { ord: 'asc' } }),
    prisma.leadershipTenure.findMany({ where: { conflictId, actorId }, orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }] }),
    prisma.leadershipControlState.findMany({ where: { conflictId, actorId } }),
    prisma.intelEvent.findMany({ where: { conflictId }, select: { id: true, title: true, timestamp: true }, orderBy: { timestamp: 'desc' }, take: 50 }),
  ]);

  return ok({
    actor,
    allowedRelationTypes: ['REPORTS_TO', 'ADVISES', 'COORDINATES_WITH', 'SUCCESSION'],
    allowedStatuses: ['ALIVE', 'DEAD', 'UNKNOWN', 'VACANT'],
    allowedControlStatuses: ['STABLE', 'VACANT', 'DISPUTED', 'UNKNOWN'],
    persons,
    roles,
    relations,
    tenures,
    controlStates,
    recentEvents: events.map((event: { id: string; title: string; timestamp: Date }) => ({ ...event, timestamp: event.timestamp.toISOString() })),
  });
}
