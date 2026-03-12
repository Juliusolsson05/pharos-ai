'use client';

import { useMemo } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { BROWSE_POLL } from '@/features/browse/constants';
import { useEvents } from '@/features/events/queries';

import { timeAgo } from '@/shared/lib/format';

const HOURS_32 = 32 * 60 * 60 * 1000;

export function CriticalTimeline() {
  const pathname = usePathname();
  const { data: events, dataUpdatedAt } = useEvents(
    undefined,
    { severity: 'CRITICAL' },
    { refetchInterval: BROWSE_POLL },
  );

  const all = events ?? [];

  // dataUpdatedAt changes only when the query refetches, making this stable
  const { isRecent, items } = useMemo(() => {
    const cutoff = Date.now() - HOURS_32;
    const recent = all.filter(
      (e) => new Date(e.timestamp).getTime() >= cutoff,
    );
    const hasRecent = recent.length > 0;
    return { isRecent: hasRecent, items: hasRecent ? recent : all.slice(0, 10) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUpdatedAt]);

  return (
    <aside className="w-48 shrink-0 p-4 overflow-y-auto">
      <h2 className="label mb-4 tracking-widest">
        {isRecent ? 'CRITICAL · 32H' : 'CRITICAL · LATEST'}
      </h2>

      {items.length === 0 ? (
        <p className="text-[11px] text-[var(--t4)]">No critical events</p>
      ) : (
        <ol className="relative list-none">
          {items.map((event, i) => {
            const isFirst = i === 0;
            const isLast = i === items.length - 1;
            const isActive = pathname === `/browse/events/${event.id}`;

            return (
              <li
                key={event.id}
                className={`relative rounded-sm pl-5 pb-5 transition-colors last:pb-0 ${
                  isActive ? 'bg-[var(--bg-sel)]' : 'hover:bg-[var(--bg-2)]'
                }`}
              >
                {!isLast && (
                  <span
                    className="absolute left-[3.5px] top-[10px] bottom-0 w-px bg-[var(--danger-bd)]"
                  />
                )}

                <span
                  className="absolute left-0 top-[1px] size-2 rounded-full"
                  style={{
                    background: 'var(--danger)',
                    boxShadow:
                      '0 0 6px var(--danger), 0 0 12px var(--danger-dim)',
                    animation: isFirst ? 'pulse-danger 2s ease-in-out infinite' : undefined,
                  }}
                />

                <Link
                  href={`/browse/events/${event.id}`}
                  className="block no-underline group"
                >
                  <time className="mono text-[10px] text-[var(--t4)]">
                    {timeAgo(event.timestamp)}
                  </time>
                  <p
                    className={`text-[11px] line-clamp-2 transition-colors ${
                      isActive
                        ? 'text-[var(--t1)]'
                        : 'text-[var(--t2)] group-hover:text-[var(--t1)]'
                    }`}
                  >
                    {event.title}
                  </p>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}
