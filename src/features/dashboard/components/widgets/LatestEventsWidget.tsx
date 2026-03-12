'use client';

import { useContext, useMemo } from 'react';

import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

import { getEventsForDay } from '@/shared/lib/day-filter';
import { fmtTimeZ } from '@/shared/lib/format';
import { SEV_C } from '@/shared/lib/severity-colors';

import { DashCtx } from '../DashCtx';

const SEV_CLS: Record<string, string> = {
  CRITICAL: 'sev sev-crit', HIGH: 'sev sev-high', STANDARD: 'sev sev-std',
};

export function LatestEventsWidget() {
  const { day, events: allEvents, allDays } = useContext(DashCtx);
  const events = useMemo(
    () => getEventsForDay(allEvents, allDays, day)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 30),
    [allEvents, allDays, day],
  );
  return (
    <div className="h-full overflow-y-auto">
      {events.map((evt, i) => {
        const sc = SEV_C[evt.severity] ?? 'var(--info)';
        return (
          <Link key={evt.id} href={`/dashboard/feed?day=${day}&event=${evt.id}`} className="no-underline">
            <div
              className="flex gap-3 items-start px-4 py-2 cursor-pointer hover:bg-[var(--bg-3)] transition-colors"
              style={{ borderBottom: i < events.length - 1 ? '1px solid var(--bd-s)' : 'none' }}
            >
              <div className="shrink-0 flex flex-col gap-1 w-20">
                <span className={SEV_CLS[evt.severity]}>{evt.severity.slice(0, 4)}</span>
                <span className="mono text-[9px] text-[var(--t4)]">{fmtTimeZ(evt.timestamp)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--t1)] leading-snug mb-0.5 break-words">{evt.title}</p>
                <span className="mono text-[9px] text-[var(--t4)] truncate block">{evt.location}</span>
              </div>
              <div className="shrink-0 flex items-center">
                <div className="w-1 h-full min-h-[32px] mr-2 opacity-40" style={{ background: sc }} />
                <ArrowRight size={10} strokeWidth={1.5} className="text-[var(--t4)]" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
