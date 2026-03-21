import type { LeadershipEdge, LeadershipNode, LeadershipTreeResponse } from '@/types/domain';

function getCountryQuerySuffix(actor: { name: string; countryCode?: string | null }): string {
  const code = actor.countryCode?.toUpperCase();
  if (code === 'US') return 'united states';
  if (code === 'IL') return 'israel';
  if (code === 'IR') return 'iran';
  return actor.name.toLowerCase();
}

function buildNodeId(roleId: string, tenureId?: string | null): string {
  return tenureId ? `${roleId}::${tenureId}` : roleId;
}

type TreeInputs = {
  conflictId: string;
  actor: { id: string; name: string; countryCode?: string | null };
  roles: Array<{ id: string; title: string; level: number; description: string | null; metadata: unknown }>;
  persons: Array<{
    id: string;
    name: string;
    summary: string | null;
    status: string;
    wikipediaQuery: string | null;
    wikipediaPageUrl: string | null;
    wikipediaImageUrl: string | null;
  }>;
  tenures: Array<{
    id: string;
    roleId: string;
    personId: string | null;
    isActive: boolean;
    startDate: Date;
    endDate: Date | null;
  }>;
  relations: Array<{ fromRoleId: string; toRoleId: string; relationType: string }>;
  states: Array<{ roleId: string; contested: boolean }>;
};

export function projectLeadershipTree({ conflictId, actor, roles, persons, tenures, relations, states }: TreeInputs): LeadershipTreeResponse {
  const personsById = new Map(persons.map(person => [person.id, person]));
  const rolesById = new Map(roles.map(role => [role.id, role]));
  const activeTenuresByRole = new Map(tenures.filter(tenure => tenure.isActive).map(tenure => [tenure.roleId, tenure]));
  const previousTenuresByRole = new Map<string, typeof tenures>();

  for (const tenure of tenures.filter(tenure => !tenure.isActive)) {
    const list = previousTenuresByRole.get(tenure.roleId) ?? [];
    list.push(tenure);
    previousTenuresByRole.set(tenure.roleId, list);
  }

  const nodes: LeadershipNode[] = [];
  const edges: LeadershipEdge[] = [];
  const activeNodeIdsByRole = new Map<string, string>();
  const suffix = getCountryQuerySuffix(actor);

  for (const role of roles) {
    const tenure = activeTenuresByRole.get(role.id);
    const person = tenure?.personId ? personsById.get(tenure.personId) : null;
    const reportsTo = relations
      .filter(relation => relation.fromRoleId === role.id && relation.relationType === 'REPORTS_TO')
      .map(relation => rolesById.get(relation.toRoleId)?.title)
      .filter((value): value is string => Boolean(value));
    const nodeId = buildNodeId(role.id, tenure?.id);

    nodes.push({
      id: nodeId,
      roleId: role.id,
      personId: person?.id ?? null,
      kind: 'active',
      title: role.title,
      name: person?.name ?? 'Vacant / unannounced',
      status: (person?.status?.toUpperCase() as LeadershipNode['status']) ?? 'VACANT',
      tier: role.level,
      summary: role.description ?? (typeof role.metadata === 'object' && role.metadata && 'note' in (role.metadata as Record<string, unknown>) ? String((role.metadata as Record<string, unknown>).note) : 'Leadership role'),
      query: person?.wikipediaQuery ?? `${person?.name ?? role.title} ${suffix}`,
      wikipediaPageUrl: person?.wikipediaPageUrl ?? null,
      wikipediaImageUrl: person?.wikipediaImageUrl ?? null,
      dateLabel: tenure?.startDate?.toISOString().slice(0, 10),
      reportsTo,
      hasSuccession: (previousTenuresByRole.get(role.id)?.length ?? 0) > 0,
    });
    activeNodeIdsByRole.set(role.id, nodeId);

    const previous = (previousTenuresByRole.get(role.id) ?? []).slice(0, 3);
    previous.forEach((prev, index) => {
      const previousPerson = prev.personId ? personsById.get(prev.personId) : null;
      const prevNodeId = buildNodeId(role.id, prev.id);
      nodes.push({
        id: prevNodeId,
        roleId: role.id,
        personId: previousPerson?.id ?? null,
        kind: 'previous',
        title: `Previous ${role.title}`,
        name: previousPerson?.name ?? 'Unknown',
        status: (previousPerson?.status?.toUpperCase() as LeadershipNode['status']) ?? 'UNKNOWN',
        tier: role.level,
        summary: previousPerson?.summary ?? 'Previous officeholder in the succession chain.',
        query: previousPerson?.wikipediaQuery ?? `${previousPerson?.name ?? role.title} ${suffix}`,
        wikipediaPageUrl: previousPerson?.wikipediaPageUrl ?? null,
        wikipediaImageUrl: previousPerson?.wikipediaImageUrl ?? null,
        dateLabel: `${prev.startDate.toISOString().slice(0, 10)} - ${prev.endDate?.toISOString().slice(0, 10) ?? 'present'}`,
        reportsTo: [],
        hasSuccession: false,
        successionIndex: index,
      });

      edges.push({
        id: `${index === 0 ? nodeId : buildNodeId(role.id, previous[index - 1]?.id)}-${prevNodeId}`,
        source: index === 0 ? nodeId : buildNodeId(role.id, previous[index - 1]?.id),
        target: prevNodeId,
        kind: 'succession',
        relationType: 'SUCCESSION',
        tier: role.level,
      });
    });
  }

  for (const relation of relations.filter(relation => relation.relationType === 'REPORTS_TO')) {
    const source = activeNodeIdsByRole.get(relation.toRoleId);
    const target = activeNodeIdsByRole.get(relation.fromRoleId);
    if (!source || !target) continue;

    edges.push({
      id: `${source}-${target}`,
      source,
      target,
      kind: 'hierarchy',
      relationType: 'REPORTS_TO',
      tier: rolesById.get(relation.fromRoleId)?.level ?? 0,
    });
  }

  return {
    actorId: actor.id,
    conflictId,
    actorName: actor.name,
    countryQuerySuffix: suffix,
    nodes,
    edges,
    vacancies: nodes.filter(node => node.status === 'VACANT' && node.kind === 'active').map(node => node.roleId),
    contestedRoles: states.filter(state => state.contested).map(state => state.roleId),
  };
}
