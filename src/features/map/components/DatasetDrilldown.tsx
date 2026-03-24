'use client';

import { FilterSection } from '@/features/map/components/FilterSection';
import { DATASET_LABEL } from '@/features/map/hooks/use-map-filters';
import type { DatasetFacets, FilterState } from '@/features/map/lib/map-filter-engine';

type Props = {
  dataset:         string;
  facets:          DatasetFacets;
  state:           FilterState;
  onToggleType:     (t: string) => void;
  onToggleActor:    (a: string) => void;
  onToggleStatus:   (s: string) => void;
  onTogglePriority: (p: string) => void;
};

export function DatasetDrilldown({ dataset, facets, state, onToggleType, onToggleActor, onToggleStatus, onTogglePriority }: Props) {
  const label = DATASET_LABEL[dataset as keyof typeof DATASET_LABEL] ?? dataset;

  return (
    <div
      className="rounded-sm overflow-y-auto"
      style={{
        background: 'rgba(28,33,39,0.97)',
        border: '1px solid var(--bd)',
        width: 'min(240px, 100%)',
        maxHeight: 'calc(100vh - 120px)',
      }}
    >
      {/* Header */}
      <div className="px-2.5 py-1.5" style={{ borderBottom: '1px solid var(--bd-s)' }}>
        <div className="flex items-center justify-between">
          <span className="mono text-[length:var(--text-label)] font-bold text-[var(--t1)]">{label}</span>
          <span className="mono text-[length:var(--text-caption)] text-[var(--t4)]">
            {facets.totalVisible}/{facets.totalAll}
          </span>
        </div>
      </div>

      {/* Type — the primary drill-down */}
      {facets.types.length > 0 && (
        <FilterSection title="TYPE" options={facets.types} activeKeys={state.types} onToggle={onToggleType} />
      )}

      {/* Actor — scoped to this dataset */}
      {facets.actors.length > 0 && (
        <FilterSection title="ACTOR" options={facets.actors} activeKeys={state.actors} onToggle={onToggleActor} isGrouped />
      )}

      {/* Status — scoped to this dataset */}
      {facets.statuses.length > 0 && (
        <FilterSection title="STATUS" options={facets.statuses} activeKeys={state.statuses} onToggle={onToggleStatus} />
      )}

      {/* Priority */}
      {facets.priorities.length > 0 && (
        <FilterSection title="PRIORITY" options={facets.priorities} activeKeys={state.priorities} onToggle={onTogglePriority} />
      )}
    </div>
  );
}
