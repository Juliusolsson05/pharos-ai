/* eslint-disable @typescript-eslint/no-explicit-any */

import { readFileSync } from 'fs';

import { prisma } from '@/server/lib/db';
import { upsertLeadershipBatch } from '@/server/lib/leadership';
import type { LeadershipBatchUpsert } from '@/server/lib/leadership-schemas';

function loadTree(path: string) {
  const raw = readFileSync(path, 'utf8');
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('} as const;');
  return JSON.parse(raw.slice(start, end + 1));
}

function toBatch(tree: any): LeadershipBatchUpsert {
  const persons = Object.values<any>(tree.persons).map(person => ({
    id: person.id,
    name: person.name,
    status: String(person.status ?? 'UNKNOWN').toUpperCase() as 'ALIVE' | 'DEAD' | 'UNKNOWN' | 'VACANT',
    kind: typeof person.metadata?.type === 'string' ? person.metadata.type : undefined,
    summary: typeof person.metadata?.notes === 'string' ? person.metadata.notes : typeof person.metadata?.background === 'string' ? person.metadata.background : undefined,
    metadata: person.metadata,
  }));
  const personIdSet = new Set(persons.map(person => person.id));

  const roles = Object.values<any>(tree.roles).map((role, index) => ({
    id: role.id,
    title: role.title,
    level: role.level,
    ord: index,
    description: typeof role.metadata?.description === 'string' ? role.metadata.description : undefined,
    metadata: role.metadata,
  }));

  const relationMap = new Map<string, LeadershipBatchUpsert['relations'][number]>();
  for (const role of Object.values<any>(tree.roles)) {
    const parents = [
      ...(role.parentRoleId ? [role.parentRoleId] : []),
      ...(Array.isArray(role.reportsTo) ? role.reportsTo : []),
    ];
    parents.forEach((parentRoleId, ord) => {
      relationMap.set(`${role.id}:${parentRoleId}:REPORTS_TO`, {
        fromRoleId: role.id,
        toRoleId: parentRoleId,
        relationType: 'REPORTS_TO',
        ord,
      });
    });
  }

  const tenures = Object.values<any>(tree.tenures).map(tenure => ({
    id: tenure.id,
    roleId: tenure.roleId,
    personId: tenure.personId && personIdSet.has(tenure.personId) ? tenure.personId : null,
    startDate: tenure.startDate,
    endDate: tenure.endDate,
    isActive: Boolean(tenure.isActive),
    isActing: Boolean(String(tenure.metadata?.note ?? '').toLowerCase().includes('acting')) || (tenure.personId ? !personIdSet.has(tenure.personId) : true),
    isNominee: tenure.metadata?.status === 'nominated_pending_confirmation',
    startReason: undefined,
    endReason: tenure.endReason,
    predecessorTenureId: tenure.predecessorId,
    successorTenureId: tenure.successorId,
    metadata: tenure.metadata,
  }));

  const controlStates = Object.values<any>(tree.controlStates).map(state => ({
    roleId: state.roleId,
    deFactoPersonId: state.deFactoHolderId ?? null,
    deJurePersonId: state.deJureHolderId ?? null,
    status: (state.contested ? 'DISPUTED' : (state.deFactoHolderId || state.deJureHolderId ? 'STABLE' : 'VACANT')) as 'DISPUTED' | 'STABLE' | 'VACANT',
    contested: Boolean(state.contested),
    note: typeof state.metadata?.note === 'string' ? state.metadata.note : undefined,
    metadata: state.metadata,
  }));

  const eventLinks = Object.values<any>(tree.events ?? {})
    .map((event, ord) => ({
      eventId: event.id,
      roleId: event.roleId,
      personId: event.personId,
      tenureId: event.tenureId,
      kind: String(event.type ?? 'EVENT').toUpperCase(),
      ord,
      metadata: { description: event.description },
    }))
    .filter(link => link.roleId || link.personId || link.tenureId);

  return {
    persons,
    roles,
    relations: Array.from(relationMap.values()),
    tenures,
    controlStates,
    eventLinks,
  };
}

async function main() {
  const conflictId = 'iran-2026';
  const actors = await prisma.actor.findMany({ where: { conflictId }, select: { id: true, name: true, countryCode: true } });
  const eventIds = new Set((await prisma.intelEvent.findMany({ where: { conflictId }, select: { id: true } })).map(event => event.id));
  const actorIdByName = new Map(actors.map(actor => [actor.name.toLowerCase(), actor.id]));

  const mappings = [
    { actorId: actorIdByName.get('iran') ?? 'iran', tree: loadTree('./src/data/iran-tree.ts') },
    { actorId: actorIdByName.get('united states') ?? 'us', tree: loadTree('./src/data/united-states.ts') },
    { actorId: actorIdByName.get('israel') ?? 'idf', tree: loadTree('./src/data/israel.ts') },
    { actorId: actorIdByName.get('hezbollah') ?? 'hezbollah', tree: loadTree('./src/data/hezbollah.ts') },
    { actorId: actorIdByName.get('irgc') ?? 'irgc', tree: loadTree('./src/data/irgc.ts') },
  ];

  for (const mapping of mappings) {
    const batch = toBatch(mapping.tree);
    batch.eventLinks = batch.eventLinks.filter(link => eventIds.has(link.eventId));
    await upsertLeadershipBatch(conflictId, mapping.actorId, batch);
  }

  await prisma.$disconnect();
}

main().catch(async error => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
