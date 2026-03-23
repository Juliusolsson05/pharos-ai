'use client';

import { Button } from '@/components/ui/button';

import type { FacetOption } from '@/features/map/lib/map-filter-engine';

type Props = {
  option:   FacetOption;
  isOn:     boolean;
  onToggle: () => void;
};

export function FilterRow({ option, isOn, onToggle }: Props) {
  const dotColor = option.color ?? 'var(--t4)';

  return (
    <Button
      variant="ghost"
      onClick={onToggle}
      className="w-full justify-start rounded-none px-2.5 py-0 h-5 hover:bg-[var(--bg-3)]"
    >
      {/* Checkbox dot */}
      <span
        className="flex-shrink-0 rounded-sm"
        style={{
          width: 8,
          height: 8,
          border: `1px solid ${isOn ? dotColor : 'var(--t4)'}`,
          background: isOn ? dotColor : 'transparent',
        }}
      />

      {/* Label */}
      <span
        className="mono flex-shrink-0 ml-1.5 truncate text-left"
        style={{ color: isOn ? 'var(--t2)' : 'var(--t4)', fontSize: 'var(--text-label)' }}
      >
        {option.label}
      </span>

      {/* Spacer */}
      <span className="flex-1" />

      {/* Count */}
      <span
        className="mono flex-shrink-0 tabular-nums"
        style={{ color: isOn ? 'var(--t3)' : 'var(--t4)', fontSize: 'var(--text-caption)', minWidth: 16, textAlign: 'right' }}
      >
        {option.count}
      </span>
    </Button>
  );
}
