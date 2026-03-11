import type { Asset, HeatPoint,MissileTrack, StrikeArc, Target, ThreatZone } from '@/data/map-data';
import type { ActorMeta } from '@/data/map-tokens';
import { PRIORITY_META,STATUS_META, TYPE_META } from '@/data/map-tokens';

// Types

export type DataArrays = {
  strikes:  StrikeArc[];
  missiles: MissileTrack[];
  targets:  Target[];
  assets:   Asset[];
  zones:    ThreatZone[];
  heat:     HeatPoint[];
};

export type FacetOption = {
  key:    string;
  label:  string;
  count:  number;
  total:  number;
  color?: string;
  group?: string;
};

/** Per-dataset facets — what you see when you drill into one dataset */
export type DatasetFacets = {
  types:      FacetOption[];
  actors:     FacetOption[];
  statuses:   FacetOption[];
  priorities: FacetOption[];
  totalVisible: number;
  totalAll:     number;
};

export type FilterFacets = {
  /** Top-level dataset counts */
  datasets: FacetOption[];
  /** Per-dataset drill-down facets */
  perDataset: Record<string, DatasetFacets>;
  totalVisible: number;
  totalAll:     number;
};

export type FilterState = {
  datasets:   Set<string>;
  types:      Set<string>;
  actors:     Set<string>;
  statuses:   Set<string>;
  priorities: Set<string>;
  heat:       boolean;
  timeRange:  [number, number] | null;  // [startMs, endMs] or null = no time filter
};

export type FilteredData = {
  strikes:  StrikeArc[];
  missiles: MissileTrack[];
  targets:  Target[];
  assets:   Asset[];
  zones:    ThreatZone[];
  heat:     HeatPoint[];
};

type DataItem = { actor: string; priority: string; type: string; status?: string; timestamp?: string };

// Helpers

const DATASET_KEYS = ['strikes', 'missiles', 'targets', 'assets', 'zones'] as const;

const DATASET_LABELS: Record<string, string> = {
  strikes: 'Strikes', missiles: 'Missiles', targets: 'Targets', assets: 'Assets', zones: 'Zones',
};

function datasetItems(data: DataArrays, key: string): DataItem[] {
  switch (key) {
    case 'strikes':  return data.strikes;
    case 'missiles': return data.missiles;
    case 'targets':  return data.targets;
    case 'assets':   return data.assets;
    case 'zones':    return data.zones as unknown as DataItem[];
    default:         return [];
  }
}

function actorMeta(key: string, meta: Record<string, ActorMeta>) {
  const m = meta[key];
  return { label: m?.label ?? key, color: m?.cssVar, group: m?.group };
}

// Extract initial state

export function extractInitialState(data: DataArrays): FilterState {
  const datasets = new Set<string>();
  const types = new Set<string>();
  const actors = new Set<string>();
  const statuses = new Set<string>();
  const priorities = new Set<string>();

  for (const dk of DATASET_KEYS) {
    const items = datasetItems(data, dk);
    if (items.length > 0) datasets.add(dk);
    for (const d of items) {
      types.add(d.type);
      actors.add(d.actor);
      if (d.status) statuses.add(d.status);
      priorities.add(d.priority);
    }
  }

  return { datasets, types, actors, statuses, priorities, heat: true, timeRange: null };
}

/** Derive min/max timestamps from timestamped data only.
 *  Max is always at least "now" so the timeline extends to the current time. */
export function extractTimeExtent(data: DataArrays): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const dk of ['strikes', 'missiles', 'targets', 'assets', 'zones'] as const) {
    for (const d of datasetItems(data, dk)) {
      if (!d.timestamp) continue;
      const t = new Date(d.timestamp).getTime();
      if (t < min) min = t;
      if (t > max) max = t;
    }
  }
  const now = Date.now();
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return [now - 24 * 3600_000, now];
  }
  if (now > max) max = now;
  if (min > max) {
    const mid = (min + max) / 2;
    return [mid - 12 * 3600_000, mid + 12 * 3600_000];
  }
  return [min, max];
}

// Apply filters

export function applyFilters(
  data: DataArrays,
  state: FilterState,
  am: Record<string, ActorMeta>,
): { filtered: FilteredData; facets: FilterFacets } {

  const inTime = (item: DataItem): boolean => {
    if (!state.timeRange) return true;
    if (!item.timestamp) return true;
    const t = new Date(item.timestamp).getTime();
    return t >= state.timeRange[0] && t <= state.timeRange[1];
  };

  const passes = (item: DataItem): boolean =>
    state.types.has(item.type) &&
    state.actors.has(item.actor) &&
    state.priorities.has(item.priority) &&
    (!item.status || state.statuses.has(item.status)) &&
    inTime(item);

  const filtered: FilteredData = {
    strikes:  state.datasets.has('strikes')  ? data.strikes.filter(passes)  : [],
    missiles: state.datasets.has('missiles') ? data.missiles.filter(passes) : [],
    targets:  state.datasets.has('targets')  ? data.targets.filter(passes)  : [],
    assets:   state.datasets.has('assets')   ? data.assets.filter(d => passes(d))   : [],
    zones:    state.datasets.has('zones')    ? data.zones.filter(d => passes(d as unknown as DataItem)) : [],
    heat:     state.heat ? data.heat : [],
  };

  let totalVisible = 0;
  let totalAll = 0;

  const perDataset: Record<string, DatasetFacets> = {};

  for (const dk of DATASET_KEYS) {
    const items = datasetItems(data, dk);
    if (items.length === 0) continue;

    totalAll += items.length;
    const dsVisible = state.datasets.has(dk) ? items.filter(passes).length : 0;
    totalVisible += dsVisible;

    // Facets scoped to this dataset
    const tMap = new Map<string, { t: number; c: number }>();
    const aMap = new Map<string, { t: number; c: number }>();
    const sMap = new Map<string, { t: number; c: number }>();
    const pMap = new Map<string, { t: number; c: number }>();

    for (const d of items) {
      // Types: cross-filter excludes type
      const te = tMap.get(d.type) ?? { t: 0, c: 0 };
      te.t++;
      if (state.actors.has(d.actor) && state.priorities.has(d.priority) &&
          (!d.status || state.statuses.has(d.status))) te.c++;
      tMap.set(d.type, te);

      // Actors: cross-filter excludes actor
      const ae = aMap.get(d.actor) ?? { t: 0, c: 0 };
      ae.t++;
      if (state.types.has(d.type) && state.priorities.has(d.priority) &&
          (!d.status || state.statuses.has(d.status))) ae.c++;
      aMap.set(d.actor, ae);

      // Statuses: cross-filter excludes status
      if (d.status) {
        const se = sMap.get(d.status) ?? { t: 0, c: 0 };
        se.t++;
        if (state.types.has(d.type) && state.actors.has(d.actor) &&
            state.priorities.has(d.priority)) se.c++;
        sMap.set(d.status, se);
      }

      // Priorities: cross-filter excludes priority
      const pe = pMap.get(d.priority) ?? { t: 0, c: 0 };
      pe.t++;
      if (state.types.has(d.type) && state.actors.has(d.actor) &&
          (!d.status || state.statuses.has(d.status))) pe.c++;
      pMap.set(d.priority, pe);
    }

    perDataset[dk] = {
      types: [...tMap.entries()].map(([k, v]) => ({
        key: k, label: TYPE_META[k]?.label ?? k, count: v.c, total: v.t,
      })),
      actors: [...aMap.entries()].map(([k, v]) => {
        const m = actorMeta(k, am);
        return { key: k, label: m.label, count: v.c, total: v.t, color: m.color, group: m.group };
      }),
      statuses: [...sMap.entries()].map(([k, v]) => ({
        key: k, label: STATUS_META[k as keyof typeof STATUS_META]?.label ?? k,
        count: v.c, total: v.t, color: STATUS_META[k as keyof typeof STATUS_META]?.cssVar,
      })),
      priorities: [...pMap.entries()].map(([k, v]) => ({
        key: k, label: PRIORITY_META[k as keyof typeof PRIORITY_META]?.label ?? k,
        count: v.c, total: v.t, color: PRIORITY_META[k as keyof typeof PRIORITY_META]?.cssVar,
      })),
      totalVisible: dsVisible,
      totalAll: items.length,
    };
  }

  const datasets: FacetOption[] = DATASET_KEYS
    .filter(k => perDataset[k])
    .map(k => ({
      key: k, label: DATASET_LABELS[k] ?? k,
      count: perDataset[k].totalVisible, total: perDataset[k].totalAll,
    }));

  return {
    filtered,
    facets: { datasets, perDataset, totalVisible, totalAll },
  };
}
