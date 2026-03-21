import { prisma } from '@/server/lib/db';
import { upsertLeadershipBatch } from '@/server/lib/leadership';
import type { LeadershipBatchUpsert } from '@/server/lib/leadership-schemas';

import { HEZBOLLAH_TREE } from '../../src/data/hezbollah';
import { IRAN_TREE } from '../../src/data/iran-tree';
import { IRGC_TREE } from '../../src/data/irgc';
import { ISRAEL_TREE } from '../../src/data/israel';
import { UNITED_STATES_TREE } from '../../src/data/united-states';

type TreeEntity = {
  id: string;
  metadata?: Record<string, unknown>;
};

type LooseTreeEntity = {
  id?: string;
  metadata?: Record<string, unknown>;
};

type TreeRole = TreeEntity & {
  title: string;
  level: number;
  parentRoleId?: string;
  reportsTo?: readonly string[];
};

type TreeTenure = TreeEntity & {
  roleId: string;
  personId?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  predecessorId?: string;
  successorId?: string;
  endReason?: string;
};

type TreeControlState = LooseTreeEntity & {
  roleId: string;
  deFactoHolderId?: string | null;
  deJureHolderId?: string | null;
  contested?: boolean;
};

type TreeEvent = LooseTreeEntity & {
  roleId?: string;
  personId?: string;
  tenureId?: string;
  type?: string;
  description?: string;
};

type BatchEventLink = LeadershipBatchUpsert['eventLinks'][number];

type LeadershipSeedTree = {
  persons: Record<string, TreeEntity & { name: string; status?: string }>;
  roles: Record<string, TreeRole>;
  tenures: Record<string, TreeTenure>;
  controlStates: Record<string, TreeControlState>;
  events?: Record<string, TreeEvent>;
};

function toBatch(tree: LeadershipSeedTree): LeadershipBatchUpsert {
  const persons = Object.values(tree.persons).map(person => ({
    id: person.id,
    name: person.name,
    status: String(person.status ?? 'UNKNOWN').toUpperCase() as 'ALIVE' | 'DEAD' | 'UNKNOWN' | 'VACANT',
    kind: typeof person.metadata?.type === 'string' ? person.metadata.type : undefined,
    summary: typeof person.metadata?.notes === 'string' ? person.metadata.notes : typeof person.metadata?.background === 'string' ? person.metadata.background : undefined,
    metadata: person.metadata,
  }));
  const personIdSet = new Set(persons.map(person => person.id));

  const roles = Object.values(tree.roles).map((role, index) => ({
    id: role.id,
    title: role.title,
    level: role.level,
    ord: index,
    description: typeof role.metadata?.description === 'string' ? role.metadata.description : undefined,
    metadata: role.metadata,
  }));

  const relationMap = new Map<string, LeadershipBatchUpsert['relations'][number]>();
  for (const role of Object.values(tree.roles)) {
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

  const tenures = Object.values(tree.tenures).map(tenure => ({
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

  const controlStates = Object.values(tree.controlStates).map(state => ({
    roleId: state.roleId,
    deFactoPersonId: state.deFactoHolderId ?? null,
    deJurePersonId: state.deJureHolderId ?? null,
    status: (state.contested ? 'DISPUTED' : (state.deFactoHolderId || state.deJureHolderId ? 'STABLE' : 'VACANT')) as 'DISPUTED' | 'STABLE' | 'VACANT',
    contested: Boolean(state.contested),
    note: typeof state.metadata?.note === 'string' ? state.metadata.note : undefined,
    metadata: state.metadata,
  }));

  const eventLinks: BatchEventLink[] = [];
  Object.values(tree.events ?? {}).forEach((event, ord) => {
    if (!event.id || !(event.roleId || event.personId || event.tenureId)) return;

    eventLinks.push({
      eventId: event.id,
      roleId: event.roleId,
      personId: event.personId,
      tenureId: event.tenureId,
      kind: String(event.type ?? 'EVENT').toUpperCase(),
      ord,
      metadata: { description: event.description },
    });
  });

  return {
    persons,
    roles,
    relations: Array.from(relationMap.values()),
    tenures,
    controlStates,
    eventLinks,
    pruneMissing: true,
  };
}

async function main() {
  const conflictId = 'iran-2026';
  const actors = await prisma.actor.findMany({ where: { conflictId }, select: { id: true, name: true, countryCode: true } });
  const eventIds = new Set((await prisma.intelEvent.findMany({ where: { conflictId }, select: { id: true } })).map(event => event.id));
  const actorIdByName = new Map(actors.map(actor => [actor.name.toLowerCase(), actor.id]));

  const mappings = [
    { actorId: actorIdByName.get('iran') ?? 'iran', tree: IRAN_TREE },
    { actorId: actorIdByName.get('united states') ?? 'us', tree: UNITED_STATES_TREE },
    { actorId: actorIdByName.get('israel') ?? 'idf', tree: ISRAEL_TREE },
    { actorId: actorIdByName.get('hezbollah') ?? 'hezbollah', tree: HEZBOLLAH_TREE },
    { actorId: actorIdByName.get('irgc') ?? 'irgc', tree: IRGC_TREE },
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
