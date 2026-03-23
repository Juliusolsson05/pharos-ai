'use client';

import { Button } from '@/components/ui/button';

import { FilterRow } from '@/features/map/components/FilterRow';
import type { FacetOption } from '@/features/map/lib/map-filter-engine';

// Types

type Props = {
  title:      string;
  options:    FacetOption[];
  activeKeys: Set<string>;
  onToggle:   (key: string) => void;
  isGrouped?: boolean;
};

// Component

export function FilterSection({ title, options, activeKeys, onToggle, isGrouped }: Props) {
  if (options.length === 0) return null;

  const allOn = options.every(o => activeKeys.has(o.key));

  const handleToggleAll = () => {
    for (const o of options) onToggle(o.key);
  };

  // Group by option.group if isGrouped
  const groups = isGrouped
    ? [...options.reduce((m, o) => {
        const g = o.group ?? '';
        m.set(g, [...(m.get(g) ?? []), o]);
        return m;
      }, new Map<string, FacetOption[]>()).entries()]
    : null;

  return (
    <div className="py-1.5" style={{ borderTop: '1px solid var(--bd-s)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 mb-0.5">
        <span className="label">{title}</span>
        <Button
          variant="ghost"
          className="h-4 px-1 text-[length:var(--text-caption)] text-[var(--t4)] hover:text-[var(--t2)] rounded-sm"
          onClick={handleToggleAll}
        >
          {allOn ? 'none' : 'all'}
        </Button>
      </div>

      {/* Rows */}
      {groups ? (
        groups.map(([group, opts]) => (
          <div key={group}>
            {group && (
              <span className="label block px-2.5 mt-1 mb-0.5 text-[length:var(--text-tiny)] text-[var(--t4)]">{group}</span>
            )}
            {opts.map(o => (
              <FilterRow key={o.key} option={o} isOn={activeKeys.has(o.key)} onToggle={() => onToggle(o.key)} />
            ))}
          </div>
        ))
      ) : (
        options.map(o => (
          <FilterRow key={o.key} option={o} isOn={activeKeys.has(o.key)} onToggle={() => onToggle(o.key)} />
        ))
      )}
    </div>
  );
}
