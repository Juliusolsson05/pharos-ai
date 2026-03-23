'use client';

import { useContext } from 'react';

import { getConflictForDay } from '@/shared/lib/day-filter';

import { DashCtx } from '../DashCtx';

export function CasualtiesWidget() {
  const { day, snapshots } = useContext(DashCtx);
  const snap = getConflictForDay(snapshots, day);
  if (!snap) return null;
  const cas = snap.casualties;
  const rows = [
    { label: 'US KIA',            val: cas.us.kia,          sub: `${cas.us.wounded} wounded`,       color: 'var(--blue)' },
    { label: 'US Civilians',      val: cas.us.civilians,    sub: 'civilian deaths',                 color: 'var(--t3)' },
    { label: 'Israeli Civilians', val: cas.israel.civilians, sub: `${cas.israel.injured}+ injured`, color: 'var(--warning)' },
    { label: 'Iran Killed',       val: cas.iran.killed,     sub: `${snap.dayLabel} cumulative`,     color: 'var(--danger)' },
  ];
  return (
    <div className="h-full overflow-y-auto px-4 py-3">
      <div className="grid grid-cols-1 min-[260px]:grid-cols-2 gap-3 mb-4">
        {rows.map(r => (
          <div key={r.label} className="px-3 py-3 bg-[var(--bg-2)] border border-[var(--bd)]" style={{ borderLeft: `3px solid ${r.color}` }}>
            <div className="label text-[length:var(--text-tiny)] mb-1 text-[var(--t4)]">{r.label}</div>
            <div className="mono text-lg sm:text-xl font-bold leading-none mb-1 break-all" style={{ color: r.color }}>
              {r.val?.toLocaleString?.() ?? r.val}
            </div>
            <div className="mono text-[length:var(--text-caption)] text-[var(--t4)]">{r.sub}</div>
          </div>
        ))}
      </div>
      <div className="text-[length:var(--text-label)] text-[var(--t3)] leading-relaxed border-t border-[var(--bd)] pt-3">
        {Object.entries(cas.regional).map(([k, v]) => `${k.toUpperCase()}: ${v.killed} killed, ${v.injured} injured`).join(' · ')}
      </div>
    </div>
  );
}
