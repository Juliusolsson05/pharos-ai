'use client';

import { Skeleton } from '@/components/ui/skeleton';

import { useConflict } from '@/features/dashboard/queries/conflicts';
import { useEvents } from '@/features/events/queries';

import { fmtDate }  from '@/shared/lib/format';
import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';

export function SummaryBar() {
  const { data: conflict, isLoading: conflictLoading } = useConflict();
  const { data: events, isLoading: eventsLoading } = useEvents();
  const isLandscapePhone = useIsLandscapePhone();

  if (conflictLoading || eventsLoading) {
    return (
      <div className={`flex items-center gap-1.5 shrink-0 overflow-x-auto bg-[var(--bg-app)] border-b border-[var(--bd)] ${isLandscapePhone ? 'h-8 safe-px' : 'h-9 px-4'}`}>
        <Skeleton className="h-3 w-14 bg-[var(--bg-3)]" />
        <Skeleton className="h-3 w-20 bg-[var(--bg-3)]" />
        <Skeleton className="h-3 w-16 bg-[var(--bg-3)]" />
        <Skeleton className="h-3 w-32 bg-[var(--bg-3)] ml-auto" />
      </div>
    );
  }

  if (!conflict || !events) return null;

  const start = new Date(conflict.startDate).getTime();
  const latest = events.reduce((max, e) => {
    const t = new Date(e.timestamp).getTime();
    return t > max ? t : max;
  }, start);
  const day = Math.floor((latest - start) / 86_400_000) + 1;

  const latestDate = [...events]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.timestamp;
  const endDateStr = latestDate ? fmtDate(latestDate) : fmtDate(conflict.startDate);

  const chips: { label: string; danger: boolean }[] = [
    { label: 'KHAMENEI KILLED',           danger: true  },
    { label: 'HORMUZ CLOSED',             danger: true  },
    { label: `DAY ${day}`,                 danger: false },
  ];

  return (
    <div
      className={`flex items-center gap-1.5 shrink-0 overflow-x-auto touch-scroll hide-scrollbar bg-[var(--bg-app)] border-b border-[var(--bd)] ${isLandscapePhone ? 'h-8 safe-px' : 'h-9 px-4'}`}
    >
      <span className="label shrink-0 text-[length:var(--text-tiny)] text-[var(--t4)]">KEY FACTS</span>
      <div className="shrink-0 w-px h-3.5 bg-[var(--bd)]" />
      {chips.map(chip => (
        <div
          key={chip.label}
          className={`flex items-center shrink-0 px-2 py-0.5 border ${chip.danger ? 'bg-[var(--danger-dim)] border-[var(--danger-bd)]' : 'bg-[var(--bg-2)] border-[var(--bd)]'}`}
        >
          <span className={`mono text-[length:var(--text-caption)] font-bold tracking-[0.06em] ${chip.danger ? 'text-[var(--danger)]' : 'text-[var(--t2)]'}`}>
            {chip.label}
          </span>
        </div>
      ))}
      <div className="shrink-0">
        <span className="mono text-[length:var(--text-caption)] text-[var(--t4)]">
          {fmtDate(conflict.startDate)} – {endDateStr} · OPERATIONS {conflict.status}
        </span>
      </div>
    </div>
  );
}
