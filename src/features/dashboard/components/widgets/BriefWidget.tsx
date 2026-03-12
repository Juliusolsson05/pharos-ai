'use client';

import { useContext, useMemo } from 'react';

import Link from 'next/link';

import { getConflictForDay, getEventsForDay } from '@/shared/lib/day-filter';
import { fmtTimeZ } from '@/shared/lib/format';
import { SEV_C } from '@/shared/lib/severity-colors';

import { DashCtx } from '../DashCtx';

const SEV_CLS: Record<string, string> = {
  CRITICAL: 'sev sev-crit', HIGH: 'sev sev-high', STANDARD: 'sev sev-std',
};

export function BriefWidget() {
  const { day, snapshots, events: allEvents, allDays, conflict } = useContext(DashCtx);
  const snap = getConflictForDay(snapshots, day);
  const dayEvents = useMemo(() => getEventsForDay(allEvents, allDays, day), [allEvents, allDays, day]);
  const topEvents = useMemo(
    () => [...dayEvents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8),
    [dayEvents],
  );

  const critCount = dayEvents.filter(e => e.severity === 'CRITICAL').length;
  const highCount = dayEvents.filter(e => e.severity === 'HIGH').length;

  if (!snap) return null;

  return (
    <div className="h-full overflow-y-auto">
      {/* classification banner */}
      <div className="px-4 py-2.5 bg-[var(--bg-2)] border-b border-[var(--bd)]">
        <div className="mono text-[8px] text-[var(--t4)] tracking-[0.14em] mb-1">UNCLASSIFIED // PHAROS ANALYTICAL</div>
        <div className="mono text-[13px] font-bold text-[var(--t1)] tracking-[0.04em]">DAILY INTELLIGENCE BRIEF</div>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="mono text-[9px] text-[var(--t3)]">{snap.dayLabel} — OPERATIONS ONGOING</span>
          <span className="mono text-[9px] text-[var(--t4)]">•</span>
          <span className="mono text-[9px] text-[var(--t3)]">AS OF 12:00 UTC</span>
        </div>
      </div>

      {/* escalation meter */}
      <div className="px-4 py-3 border-b border-[var(--bd)]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="label text-[8px] text-[var(--t4)] tracking-[0.10em]">ESCALATION INDEX</span>
          <span className="mono text-lg font-bold text-[var(--danger)] leading-none">{snap.escalation}</span>
        </div>
        <div className="w-full h-1.5 bg-[var(--bg-3)] rounded-sm overflow-hidden">
          <div className="h-full bg-[var(--danger)] rounded-sm transition-all" style={{ width: `${snap.escalation}%` }} />
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="dot dot-danger" />
            <span className="mono text-[9px] text-[var(--t3)]">{critCount} CRITICAL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="dot dot-warning" />
            <span className="mono text-[9px] text-[var(--t3)]">{highCount} HIGH</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="dot" style={{ background: 'var(--blue)' }} />
            <span className="mono text-[9px] text-[var(--t3)]">{dayEvents.length} TOTAL</span>
          </div>
        </div>
      </div>

      {/* executive summary */}
      <div className="px-4 py-3 border-b border-[var(--bd)]">
        <div className="label text-[8px] text-[var(--t4)] mb-1.5 tracking-[0.10em]">EXECUTIVE SUMMARY</div>
        <p className="text-[11px] text-[var(--t2)] leading-relaxed">{snap.summary.slice(0, 600)}...</p>
      </div>

      {/* top events */}
      <div className="px-4 py-3 border-b border-[var(--bd)]">
        <div className="label text-[8px] text-[var(--t4)] mb-1.5 tracking-[0.10em]">TOP EVENTS — {snap.dayLabel}</div>
        {topEvents.map((evt, i) => {
          const sc = SEV_C[evt.severity] ?? 'var(--info)';
          return (
            <Link key={evt.id} href={`/dashboard/feed?day=${day}&event=${evt.id}`} className="no-underline">
              <div
                className="flex gap-2.5 items-start py-1.5 hover:bg-[var(--bg-3)] transition-colors"
                style={{ borderBottom: i < topEvents.length - 1 ? '1px solid var(--bd-s)' : 'none', borderLeft: `3px solid ${sc}` }}
              >
                <div className="shrink-0 flex flex-col gap-0.5 pl-2">
                  <span className={SEV_CLS[evt.severity]}>{evt.severity.slice(0, 4)}</span>
                  <span className="mono text-[8px] text-[var(--t4)]">{fmtTimeZ(evt.timestamp)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[var(--t1)] leading-snug">{evt.title}</p>
                  <span className="mono text-[8px] text-[var(--t4)]">{evt.location}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* strategic objectives */}
      <div className="px-4 py-3 border-b border-[var(--bd)]">
        <div className="label text-[8px] text-[var(--t4)] mb-1.5 tracking-[0.10em]">STRATEGIC OBJECTIVES</div>
        <div className="flex gap-3">
          <div className="flex-1 px-3 py-2 bg-[var(--bg-2)] border border-[var(--bd)] [border-left:3px_solid_var(--blue)]">
            <div className="label text-[8px] mb-1 text-[var(--blue)]">US / COALITION</div>
            <p className="text-[10px] text-[var(--t2)] leading-snug">{conflict?.objectives?.us}</p>
          </div>
          <div className="flex-1 px-3 py-2 bg-[var(--bg-2)] border border-[var(--bd)] [border-left:3px_solid_var(--info)]">
            <div className="label text-[8px] mb-1 text-[var(--info)]">ISRAEL</div>
            <p className="text-[10px] text-[var(--t2)] leading-snug">{conflict?.objectives?.il}</p>
          </div>
        </div>
      </div>

      {/* link to full brief */}
      <div className="px-4 py-2.5">
        <Link href={`/dashboard/brief?day=${day}`} className="no-underline flex items-center gap-1">
          <span className="text-[9px] text-[var(--blue-l)] font-semibold">Read Full Brief →</span>
        </Link>
      </div>
    </div>
  );
}
