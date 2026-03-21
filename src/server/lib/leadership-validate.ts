import { prisma } from '@/server/lib/db';
import type { LeadershipBatchUpsert } from '@/server/lib/leadership-schemas';

export async function validateLeadershipBatch(conflictId: string, actorId: string, payload: LeadershipBatchUpsert) {
  const actor = await prisma.actor.findFirst({ where: { id: actorId, conflictId }, select: { id: true } });
  if (!actor) return ['Actor not found for conflict'];

  const eventIds = new Set((await prisma.intelEvent.findMany({ where: { conflictId }, select: { id: true } })).map(event => event.id));
  const roleIds = new Set(payload.roles.map(role => role.id));
  const personIds = new Set(payload.persons.map(person => person.id));
  const tenureIds = new Set(payload.tenures.map(tenure => tenure.id));
  const issues: string[] = [];

  for (const relation of payload.relations) {
    if (!roleIds.has(relation.fromRoleId)) issues.push(`Missing fromRoleId ${relation.fromRoleId}`);
    if (!roleIds.has(relation.toRoleId)) issues.push(`Missing toRoleId ${relation.toRoleId}`);
  }

  for (const tenure of payload.tenures) {
    if (!roleIds.has(tenure.roleId)) issues.push(`Missing role for tenure ${tenure.id}`);
    if (tenure.personId && !personIds.has(tenure.personId)) issues.push(`Missing person ${tenure.personId} for tenure ${tenure.id}`);
    if (tenure.predecessorTenureId && !tenureIds.has(tenure.predecessorTenureId)) issues.push(`Missing predecessor tenure ${tenure.predecessorTenureId}`);
    if (tenure.successorTenureId && !tenureIds.has(tenure.successorTenureId)) issues.push(`Missing successor tenure ${tenure.successorTenureId}`);
  }

  for (const state of payload.controlStates) {
    if (!roleIds.has(state.roleId)) issues.push(`Missing role ${state.roleId} for control state`);
    if (state.deFactoPersonId && !personIds.has(state.deFactoPersonId)) issues.push(`Missing deFactoPersonId ${state.deFactoPersonId}`);
    if (state.deJurePersonId && !personIds.has(state.deJurePersonId)) issues.push(`Missing deJurePersonId ${state.deJurePersonId}`);
  }

  for (const link of payload.eventLinks) {
    if (!eventIds.has(link.eventId)) issues.push(`Missing event ${link.eventId} for leadership event link`);
  }

  const activeRoleCount = new Map<string, number>();
  for (const tenure of payload.tenures.filter(tenure => tenure.isActive && !tenure.isActing)) {
    activeRoleCount.set(tenure.roleId, (activeRoleCount.get(tenure.roleId) ?? 0) + 1);
  }

  for (const [roleId, count] of activeRoleCount) {
    if (count > 1) issues.push(`Role ${roleId} has ${count} active tenures`);
  }

  return issues;
}
