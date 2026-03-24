'use client';

import { useContext } from 'react';

import { getConflictForDay } from '@/shared/lib/day-filter';

import { DashCtx } from '../DashCtx';

export function KeyFactsWidget() {
  const { day, snapshots } = useContext(DashCtx);
  const snap = getConflictForDay(snapshots, day);
  if (!snap) return null;
  return (
    <div className="h-full overflow-y-auto">
      {snap.keyFacts.map((fact, i) => (
        <div
          key={i}
          className="flex gap-3 items-start px-4 py-2 hover:bg-[var(--bg-3)] transition-colors"
          style={{ borderBottom: i < snap.keyFacts.length - 1 ? '1px solid var(--bd-s)' : 'none' }}
        >
          <span className="mono text-[length:var(--text-caption)] text-[var(--blue)] shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
          <p className="text-[length:var(--text-body-sm)] text-[var(--t2)] leading-snug">{fact}</p>
        </div>
      ))}
    </div>
  );
}
