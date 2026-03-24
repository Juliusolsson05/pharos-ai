'use client';

import { useState } from 'react';

import { ChevronDown, ChevronUp,SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { DatasetDrilldown } from '@/features/map/components/DatasetDrilldown';
import type { DatasetName } from '@/features/map/hooks/use-map-filters';
import { ALL_DATASETS, DATASET_LABEL } from '@/features/map/hooks/use-map-filters';
import type { FilterFacets, FilterState } from '@/features/map/lib/map-filter-engine';

import { LAYER_DISPLAY } from '@/data/map-tokens';

type Props = {
  state: FilterState; facets: FilterFacets; isFiltered: boolean;
  onToggleDataset: (d: string) => void; onToggleType: (t: string) => void;
  onToggleActor: (a: string) => void; onTogglePriority: (p: string) => void;
  onToggleStatus: (s: string) => void; onToggleHeat: () => void; onReset: () => void;
  defaultExpanded?: boolean;
};

function DatasetBtn({ name, isOn, isActive, onToggle, onDrill }: {
  name: DatasetName; isOn: boolean; isActive: boolean; onToggle: () => void; onDrill: () => void;
}) {
  const m = LAYER_DISPLAY[name];
  return (
    <div className="flex items-center">
      <Button
        variant="ghost" size="xs" onClick={onToggle}
        className="mono rounded-none rounded-l-sm px-1.5 py-0 h-5 text-[length:var(--text-tiny)] font-bold tracking-wider"
        style={{
          border: `1px solid ${isOn ? m.border : 'var(--bd)'}`,
          borderRight: 'none',
          background: isOn ? m.bg : 'var(--bg-1)',
          color: isOn ? m.color : 'var(--t4)',
        }}
      >
        {DATASET_LABEL[name]}
      </Button>
      <Button
        variant="ghost" size="xs" onClick={onDrill}
        className="rounded-none rounded-r-sm px-0.5 py-0 h-5"
        style={{
          border: `1px solid ${isActive ? m.border : isOn ? m.border : 'var(--bd)'}`,
          background: isActive ? m.bg : isOn ? m.bg : 'var(--bg-1)',
          color: isActive ? m.color : isOn ? m.color : 'var(--t4)',
        }}
      >
        {isActive ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
      </Button>
    </div>
  );
}

export function MapFilterPanel(props: Props) {
  const { state, facets, isFiltered } = props;
  const { onToggleDataset, onToggleType, onToggleActor, onTogglePriority, onToggleStatus, onToggleHeat, onReset, defaultExpanded = false } = props;
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [drillDataset, setDrillDataset] = useState<string | null>(null);

  const heatMeta = LAYER_DISPLAY.heat;
  const drill = drillDataset ? facets.perDataset[drillDataset] : null;

  return (
    <div className="flex flex-col items-end gap-1 min-w-0" style={{ maxWidth: '100%' }}>

      {/* Collapsed: single icon button */}
      {!expanded && (
        <Button
          variant="ghost" size="xs"
          onClick={() => setExpanded(true)}
          className="mono rounded-sm px-1.5 py-0 h-7 w-7"
          style={{
            background: isFiltered ? 'rgba(45,114,210,0.18)' : 'rgba(28,33,39,0.95)',
            border: `1px solid ${isFiltered ? 'var(--blue)' : 'var(--bd)'}`,
            color: isFiltered ? 'var(--blue-l)' : 'var(--t3)',
          }}
          title="Open filters"
        >
          <SlidersHorizontal size={12} strokeWidth={2} />
        </Button>
      )}

      {/* Expanded: full dataset bar */}
      {expanded && (
        <>
          <div
            className="flex items-center gap-0.5 flex-wrap rounded-sm"
            style={{
              background: 'rgba(28,33,39,0.95)',
              border: '1px solid var(--bd)',
              padding: '4px 6px',
              maxWidth: 'min(100%, 520px)',
              minWidth: 0,
            }}
          >
            {ALL_DATASETS.map(d => (
              <DatasetBtn key={d} name={d} isOn={state.datasets.has(d)}
                isActive={drillDataset === d}
                onToggle={() => onToggleDataset(d)}
                onDrill={() => setDrillDataset(drillDataset === d ? null : d)}
              />
            ))}

            <Button variant="ghost" size="xs" onClick={onToggleHeat}
              className="mono rounded-sm px-1.5 py-0 h-5 text-[length:var(--text-tiny)] font-bold tracking-wider"
              style={{
                border: `1px solid ${state.heat ? heatMeta.border : 'var(--bd)'}`,
                background: state.heat ? heatMeta.bg : 'var(--bg-1)',
                color: state.heat ? heatMeta.color : 'var(--t4)',
              }}
            >HEAT</Button>

            <div className="w-px h-3.5 bg-[var(--bd)] mx-0.5 flex-shrink-0" />

            <div className="w-px h-3.5 bg-[var(--bd)] mx-0.5 flex-shrink-0" />
            {isFiltered && (
              <Button variant="ghost" size="xs" onClick={onReset}
                className="mono rounded-sm px-1.5 py-0 h-5 text-[length:var(--text-tiny)] font-bold tracking-wider"
                style={{ border: '1px solid var(--danger)', background: 'var(--danger-dim)', color: 'var(--danger)' }}
              >CLEAR</Button>
            )}

            <Button
              variant="ghost"
              size="xs"
              onClick={() => { setExpanded(false); setDrillDataset(null); }}
              className="mono rounded-sm px-1.5 py-0 h-5 text-[length:var(--text-tiny)] font-bold tracking-wider"
              style={{ border: '1px solid var(--bd)', background: 'var(--bg-1)', color: 'var(--t4)' }}
              title="Close filters"
            >
              CLOSE
            </Button>
          </div>

          {/* Per-dataset drilldown */}
          {drill && drillDataset && (
            <DatasetDrilldown
              dataset={drillDataset}
              facets={drill}
              state={state}
              onToggleType={onToggleType}
              onToggleActor={onToggleActor}
              onToggleStatus={onToggleStatus}
              onTogglePriority={onTogglePriority}
            />
          )}
        </>
      )}
    </div>
  );
}
