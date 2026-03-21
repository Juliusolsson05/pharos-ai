import {
  HEZBOLLAH_ROLE_IDS,
  IRAN_ROLE_IDS,
  IRGC_ROLE_IDS,
  ISRAEL_ROLE_IDS,
  UNITED_STATES_ROLE_IDS,
} from '@/features/leadership/lib/leadership-tree-constants';

import { HEZBOLLAH_TREE } from '@/data/hezbollah';
import { IRAN_TREE } from '@/data/iran-tree';
import { IRGC_TREE } from '@/data/irgc';
import { ISRAEL_TREE } from '@/data/israel';
import { UNITED_STATES_TREE } from '@/data/united-states';
import type { Actor } from '@/types/domain';

type LooseRecord = Record<string, unknown>;
type Role = LooseRecord & {
  id: string;
  title: string;
  level: number;
  parentRoleId?: string;
  reportsTo?: readonly string[];
  metadata?: LooseRecord;
};
type Tenure = LooseRecord & {
  id?: string;
  personId?: string;
  roleId: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  metadata?: LooseRecord;
};
type Person = LooseRecord & { id: string; name: string; status?: string; metadata?: LooseRecord };
type TreeShape = {
  persons: Record<string, Person>;
  roles: Record<string, Role>;
  tenures: Record<string, Tenure>;
  controlStates: Record<string, LooseRecord & { roleId: string; metadata?: LooseRecord }>;
};

export type LeadershipCard = {
  id: string;
  title: string;
  holder: string;
  holderQuery: string;
  status: 'ALIVE' | 'DEAD' | 'UNKNOWN' | 'VACANT';
  level: number;
  reportsTo: string[];
  startedAt?: string;
  endedAt?: string;
  summary: string;
  previous: {
    id: string;
    name: string;
    query: string;
    status: 'ALIVE' | 'DEAD' | 'UNKNOWN' | 'VACANT';
    startedAt?: string;
    endedAt?: string;
    summary: string;
  }[];
};

type LeadershipConfig = {
  tree: TreeShape;
  querySuffix: string;
  actorMatch: (actor: Actor) => boolean;
  roleIds: readonly string[];
};

const LEADERSHIP_CONFIGS: LeadershipConfig[] = [
  {
    tree: IRAN_TREE as unknown as TreeShape,
    querySuffix: 'iran',
    actorMatch: actor => actor.countryCode === 'IR' || `${actor.name} ${actor.fullName}`.toLowerCase().includes('iran'),
    roleIds: IRAN_ROLE_IDS,
  },
  {
    tree: UNITED_STATES_TREE as unknown as TreeShape,
    querySuffix: 'united states',
    actorMatch: actor => actor.countryCode === 'US' || `${actor.name} ${actor.fullName}`.toLowerCase().includes('united states') || `${actor.name} ${actor.fullName}`.toLowerCase().includes('america'),
    roleIds: UNITED_STATES_ROLE_IDS,
  },
  {
    tree: ISRAEL_TREE as unknown as TreeShape,
    querySuffix: 'israel',
    actorMatch: actor => actor.countryCode === 'IL' || `${actor.name} ${actor.fullName}`.toLowerCase().includes('israel'),
    roleIds: ISRAEL_ROLE_IDS,
  },
  {
    tree: HEZBOLLAH_TREE as unknown as TreeShape,
    querySuffix: 'hezbollah',
    actorMatch: actor => `${actor.name} ${actor.fullName}`.toLowerCase().includes('hezbollah'),
    roleIds: HEZBOLLAH_ROLE_IDS,
  },
  {
    tree: IRGC_TREE as unknown as TreeShape,
    querySuffix: 'iran irgc',
    actorMatch: actor => actor.id === 'irgc' || `${actor.name} ${actor.fullName}`.toLowerCase().includes('irgc'),
    roleIds: IRGC_ROLE_IDS,
  },
];

function getLeadershipConfig(actor: Actor): LeadershipConfig | null {
  return LEADERSHIP_CONFIGS.find(config => config.actorMatch(actor)) ?? null;
}

function getPerson(tree: TreeShape, personId?: string | null): Person | null {
  if (!personId) return null;
  return tree.persons[personId] ?? null;
}

function getRole(tree: TreeShape, roleId: string): Role | null {
  return tree.roles[roleId] ?? null;
}

function getActiveTenure(tree: TreeShape, roleId: string): Tenure | null {
  return Object.values(tree.tenures).find(tenure => tenure.roleId === roleId && tenure.isActive) ?? null;
}

function getStatus(person: Person | null): LeadershipCard['status'] {
  if (!person) return 'VACANT';
  if (person.status === 'alive') return 'ALIVE';
  if (person.status === 'dead') return 'DEAD';
  return 'UNKNOWN';
}

function getPersonSummary(person: Person | null): string {
  const personMeta = (person?.metadata ?? {}) as Record<string, string>;
  return personMeta.notes ?? personMeta.background ?? 'Previous officeholder in the command or succession chain.';
}

function getQueryForName(name: string, suffix: string): string {
  return `${name} ${suffix}`;
}

function isHistoricalPrevious(tenure: Tenure): boolean {
  const meta = (tenure.metadata ?? {}) as Record<string, string>;
  return !tenure.isActive && meta.status !== 'nominated_pending_confirmation';
}

function getPreviousHolders(tree: TreeShape, roleId: string, querySuffix: string): LeadershipCard['previous'] {
  return Object.values(tree.tenures)
    .filter(tenure => tenure.roleId === roleId && isHistoricalPrevious(tenure))
    .sort((a, b) => (b.endDate ?? '').localeCompare(a.endDate ?? ''))
    .slice(0, 3)
    .map(tenure => {
      const person = getPerson(tree, tenure.personId);
      return {
        id: String(tenure.id ?? `${roleId}-${tenure.personId ?? 'unknown'}`),
        name: person?.name ?? 'Unknown',
        query: getQueryForName(person?.name ?? 'state official', querySuffix),
        status: getStatus(person),
        startedAt: tenure.startDate,
        endedAt: tenure.endDate,
        summary: getPersonSummary(person),
      };
    });
}

function getSummary(tree: TreeShape, roleId: string, person: Person | null, role: Role | null, tenure: Tenure | null): string {
  const controlState = Object.values(tree.controlStates).find(state => state.roleId === roleId);
  const roleMeta = (role?.metadata ?? {}) as Record<string, string>;
  const personMeta = (person?.metadata ?? {}) as Record<string, string>;
  const tenureMeta = (tenure?.metadata ?? {}) as Record<string, string>;
  const controlMeta = (controlState?.metadata ?? {}) as Record<string, string>;

  return String(
    controlMeta.note ??
    roleMeta.description ??
    roleMeta.note ??
    tenureMeta.note ??
    personMeta.notes ??
    personMeta.background ??
    'Leadership role active in the current command structure.'
  );
}

export function isLeadershipActor(actor: Actor): boolean {
  return getLeadershipConfig(actor) !== null;
}

export function getLeadershipCards(actor?: Actor): LeadershipCard[] {
  const config = actor ? getLeadershipConfig(actor) : LEADERSHIP_CONFIGS[0];
  if (!config) return [];

  return config.roleIds
    .map<LeadershipCard | null>(roleId => {
      const role = getRole(config.tree, roleId);
      if (!role) return null;

      const tenure = getActiveTenure(config.tree, roleId);
      const person = getPerson(config.tree, tenure?.personId ?? null);
      const reportsTo = [
        ...(role.parentRoleId ? [role.parentRoleId] : []),
        ...(Array.isArray(role.reportsTo) ? role.reportsTo : []),
      ]
        .map(parentId => getRole(config.tree, parentId)?.title)
        .filter((value): value is string => Boolean(value));

      return {
        id: roleId,
        title: role.title,
        holder: person?.name ?? 'Vacant / unannounced',
        holderQuery: getQueryForName(person?.name ?? role.title, config.querySuffix),
        status: getStatus(person),
        level: role.level,
        reportsTo,
        startedAt: tenure?.startDate,
        endedAt: tenure?.endDate,
        summary: getSummary(config.tree, roleId, person, role, tenure),
        previous: getPreviousHolders(config.tree, roleId, config.querySuffix),
      };
    })
    .filter((card): card is LeadershipCard => card !== null);
}
