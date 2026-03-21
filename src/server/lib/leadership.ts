export { projectLeadershipTree } from '@/server/lib/leadership-project';
export { leadershipBatchUpsertSchema } from '@/server/lib/leadership-schemas';
export { upsertLeadershipBatch } from '@/server/lib/leadership-upsert';
export { validateLeadershipBatch } from '@/server/lib/leadership-validate';

import { prisma } from '@/server/lib/db';
import { projectLeadershipTree } from '@/server/lib/leadership-project';

import type { LeadershipTreeResponse } from '@/types/domain';

export async function getLeadershipTree(conflictId: string, actorId: string): Promise<LeadershipTreeResponse | null> {
  const actor = await prisma.actor.findFirst({ where: { id: actorId, conflictId }, select: { id: true, name: true, countryCode: true } });
  if (!actor) return null;

  const [roles, persons, tenures, relations, states] = await Promise.all([
    prisma.leadershipRole.findMany({ where: { conflictId, actorId }, orderBy: [{ level: 'asc' }, { ord: 'asc' }] }),
    prisma.leadershipPerson.findMany({ where: { conflictId, actorId } }),
    prisma.leadershipTenure.findMany({ where: { conflictId, actorId }, orderBy: [{ startDate: 'desc' }] }),
    prisma.leadershipRoleRelation.findMany({ where: { conflictId, actorId }, orderBy: [{ ord: 'asc' }] }),
    prisma.leadershipControlState.findMany({ where: { conflictId, actorId } }),
  ]);

  return projectLeadershipTree({ conflictId, actor, roles, persons, tenures, relations, states });
}
