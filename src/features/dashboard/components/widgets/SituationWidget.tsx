'use client';

import { useContext } from 'react';

import { CasChip } from '@/features/dashboard/components/CasChip';

import { getConflictForDay } from '@/shared/lib/day-filter';

import { DashCtx } from '../DashCtx';

export function SituationWidget() {
  const { day, snapshots, conflict } = useContext(DashCtx);
  const snap = getConflictForDay(snapshots, day);
  if (!snap) return null;
  return (
    <div className="h-full overflow-y-auto px-4 py-3">
      <div className="mb-2.5">
        <span className="label text-[length:var(--text-tiny)] text-[var(--t4)]">
          UNCLASSIFIED // PHAROS ANALYTICAL // {snap.dayLabel} — {day}
        </span>
      </div>
      <p className="text-[length:var(--text-body)] text-[var(--t1)] leading-relaxed mb-2.5">{snap.summary}</p>
      <div className="flex flex-col sm:flex-row gap-3 mt-2.5">
        <div className="flex-1 px-3 py-2 bg-[var(--bg-2)] border border-[var(--bd)] [border-left:3px_solid_var(--blue)]">
          <div className="label text-[length:var(--text-tiny)] mb-1 text-[var(--blue)]">US OBJECTIVE</div>
          <p className="text-[length:var(--text-body-sm)] text-[var(--t2)] leading-snug">{conflict?.objectives?.us}</p>
        </div>
        <div className="flex-1 px-3 py-2 bg-[var(--bg-2)] border border-[var(--bd)] [border-left:3px_solid_var(--info)]">
          <div className="label text-[length:var(--text-tiny)] mb-1 text-[var(--info)]">ISRAELI OBJECTIVE</div>
          <p className="text-[length:var(--text-body-sm)] text-[var(--t2)] leading-snug">{conflict?.objectives?.il}</p>
        </div>
      </div>
      <div className="flex gap-3 mt-3 flex-wrap">
        <CasChip label="US KIA"       val={String(snap.casualties.us.kia)}       color="var(--danger)"  />
        <CasChip label="IL Civilians" val={String(snap.casualties.israel.civilians)} color="var(--warning)" />
        <CasChip label="IR Killed"    val={String(snap.casualties.iran.killed)}   color="var(--t2)"      />
        <CasChip label="Regional"     val={String(Object.values(snap.casualties.regional).reduce((s, c) => s + c.killed, 0))} color="var(--t3)" />
      </div>
    </div>
  );
}
