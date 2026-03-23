import { toJsonValue } from '@/server/lib/admin-schema-utils';
import { prisma } from '@/server/lib/db';
import type { LeadershipBatchUpsert } from '@/server/lib/leadership-schemas';
import { resolveLeadershipWikipedia } from '@/server/lib/leadership-wikipedia';

export async function upsertLeadershipBatch(conflictId: string, actorId: string, payload: LeadershipBatchUpsert) {
  const actor = await prisma.actor.findFirst({ where: { id: actorId, conflictId }, select: { id: true, name: true, countryCode: true } });
  if (!actor) throw new Error(`Actor ${actorId} not found for conflict ${conflictId}`);

  const existingPersons = await prisma.leadershipPerson.findMany({
    where: { conflictId, actorId },
    select: { id: true, wikipediaResolvedAt: true },
  });
  const resolvedSet = new Set(existingPersons.filter(p => p.wikipediaResolvedAt !== null).map(p => p.id));

  const wikipediaByPersonId = new Map<string, Awaited<ReturnType<typeof resolveLeadershipWikipedia>>>();
  for (const person of payload.persons) {
    if (!resolvedSet.has(person.id)) {
      wikipediaByPersonId.set(person.id, await resolveLeadershipWikipedia(person.name, actor));
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  }

  await prisma.$transaction(async tx => {
    const roleIds = payload.roles.map(role => role.id);
    const personIds = payload.persons.map(person => person.id);
    const tenureIds = payload.tenures.map(tenure => tenure.id);

    await tx.leadershipEventLink.deleteMany({ where: { conflictId, actorId } });
    await tx.leadershipControlState.deleteMany({ where: { conflictId, actorId } });
    await tx.leadershipRoleRelation.deleteMany({ where: { conflictId, actorId } });

    for (const person of payload.persons) {
      const wikipedia = wikipediaByPersonId.get(person.id);
      const wikiFields = wikipedia
        ? {
            wikipediaQuery: wikipedia.wikipediaQuery ?? null,
            wikipediaTitle: wikipedia.wikipediaTitle ?? null,
            wikipediaPageUrl: wikipedia.wikipediaPageUrl ?? null,
            wikipediaImageUrl: wikipedia.wikipediaImageUrl ?? null,
            wikipediaResolvedAt: new Date(),
          }
        : {};
      await tx.leadershipPerson.upsert({
        where: { conflictId_actorId_id: { conflictId, actorId, id: person.id } },
        create: {
          conflictId,
          actorId,
          ...person,
          ...wikiFields,
          metadata: toJsonValue(person.metadata),
        },
        update: {
          ...person,
          ...wikiFields,
          metadata: toJsonValue(person.metadata),
        },
      });
    }

    for (const role of payload.roles) {
      await tx.leadershipRole.upsert({
        where: { conflictId_actorId_id: { conflictId, actorId, id: role.id } },
        create: { conflictId, actorId, ...role, metadata: toJsonValue(role.metadata) },
        update: { ...role, metadata: toJsonValue(role.metadata) },
      });
    }

    for (const tenure of payload.tenures) {
      await tx.leadershipTenure.upsert({
        where: { conflictId_actorId_id: { conflictId, actorId, id: tenure.id } },
        create: {
          conflictId,
          actorId,
          ...tenure,
          startDate: new Date(`${tenure.startDate}T00:00:00Z`),
          endDate: tenure.endDate ? new Date(`${tenure.endDate}T00:00:00Z`) : null,
          metadata: toJsonValue(tenure.metadata),
        },
        update: {
          ...tenure,
          startDate: new Date(`${tenure.startDate}T00:00:00Z`),
          endDate: tenure.endDate ? new Date(`${tenure.endDate}T00:00:00Z`) : null,
          metadata: toJsonValue(tenure.metadata),
        },
      });
    }

    for (const relation of payload.relations) {
      await tx.leadershipRoleRelation.create({
        data: {
          id: relation.id,
          conflictId,
          actorId,
          fromRoleId: relation.fromRoleId,
          toRoleId: relation.toRoleId,
          relationType: relation.relationType,
          ord: relation.ord,
          metadata: toJsonValue(relation.metadata),
        },
      });
    }

    for (const state of payload.controlStates) {
      await tx.leadershipControlState.create({
        data: { conflictId, actorId, ...state, metadata: toJsonValue(state.metadata) },
      });
    }

    for (const link of payload.eventLinks) {
      await tx.leadershipEventLink.create({
        data: { id: link.id, conflictId, actorId, ...link, metadata: toJsonValue(link.metadata) },
      });
    }

    if (payload.pruneMissing) {
      await tx.leadershipTenure.deleteMany({ where: { conflictId, actorId, id: { notIn: tenureIds.length ? tenureIds : ['__none__'] } } });
      await tx.leadershipRole.deleteMany({ where: { conflictId, actorId, id: { notIn: roleIds.length ? roleIds : ['__none__'] } } });
      await tx.leadershipPerson.deleteMany({ where: { conflictId, actorId, id: { notIn: personIds.length ? personIds : ['__none__'] } } });
    }
  }, {
    maxWait: 15_000,
    timeout: 120_000,
  });
}
