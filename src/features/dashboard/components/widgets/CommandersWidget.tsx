'use client';

import { useContext } from 'react';

import { DashCtx } from '../DashCtx';

export function CommandersWidget() {
  const { conflict } = useContext(DashCtx);
  const commanders = conflict?.commanders;
  if (!commanders) return null;
  const sides = [
    { label: 'US',   color: 'var(--blue)',   names: commanders.us ?? [] },
    { label: 'IDF',  color: 'var(--info)',   names: commanders.il ?? [] },
    { label: 'IRAN', color: 'var(--danger)', names: commanders.ir ?? [] },
  ];
  return (
    <div className="h-full overflow-y-auto px-4 py-3">
      {sides.map(side => (
        <div key={side.label} className="mb-5">
          <div className="label text-[length:var(--text-tiny)] font-bold mb-2 tracking-[0.12em]" style={{ color: side.color }}>{side.label}</div>
          {side.names.map((name: string, i: number) => (
            <div key={i} className="flex items-center gap-2 py-1 border-b border-[var(--bd-s)]">
              <div className="w-1 h-4 shrink-0" style={{ background: side.color, opacity: i === 0 ? 1 : 0.3 }} />
              <span className="text-[length:var(--text-body-sm)] text-[var(--t1)]">{name}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
