import Link from 'next/link';

import { SeverityBadge } from '@/features/browse/components/events/SeverityBadge';

import { fmtDate, fmtTimeZ } from '@/shared/lib/format';

import type { IntelEvent } from '@/types/domain';

type EventItem = Pick<IntelEvent, 'id' | 'timestamp' | 'severity' | 'type' | 'title' | 'location' | 'summary' | 'verified'>;

type Props = {
  events: EventItem[];
  page?: number;
  filterBar?: React.ReactNode;
};

function groupByDay(events: EventItem[]): Map<string, EventItem[]> {
  const groups = new Map<string, EventItem[]>();
  for (const e of events) {
    const day = fmtDate(e.timestamp);
    const list = groups.get(day) ?? [];
    list.push(e);
    groups.set(day, list);
  }
  return groups;
}

export function EventList({ events, page = 1, filterBar }: Props) {
  if (events.length === 0) return null;

  const showHero = page === 1;
  const listEvents = showHero ? events.slice(1) : events;
  const grouped = groupByDay(listEvents);

  return (
    <div className="flex flex-col">
      {showHero && <LatestEvent event={events[0]} />}

      {filterBar && (
        <div className="flex justify-end py-4">
          {filterBar}
        </div>
      )}

      {Array.from(grouped.entries()).map(([day, dayEvents]) => (
        <section key={day} className="mt-10">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-sm font-semibold text-[var(--t1)]">{day}</h2>
            <span className="mono text-[10px] text-[var(--t4)]">
              {dayEvents.length} events
            </span>
            <div className="flex-1 h-px bg-[var(--bd)]" />
          </div>

          <div className="flex flex-col">
            {dayEvents.map((e) => (
              <EventListItem key={e.id} event={e} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function LatestEvent({ event }: { event: EventItem }) {
  return (
    <Link href={`/browse/events/${event.id}`} className="no-underline block group">
      <article className="pb-8 border-b border-[var(--bd)]">
        <div className="h-[3px] w-10 bg-[var(--danger)] mb-5" />

        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-bold text-[var(--danger)] tracking-[0.08em]">
            LATEST
          </span>
          <SeverityBadge severity={event.severity} />
          <span className="mono text-[10px] text-[var(--t4)]">{event.type}</span>
          {event.verified && (
            <span className="mono text-[9px] font-bold text-[var(--success)]">VERIFIED</span>
          )}
        </div>

        <h2 className="text-[26px] sm:text-[32px] font-bold text-[var(--t1)] leading-[1.15] mb-4 group-hover:text-[var(--blue)] transition-colors">
          {event.title}
        </h2>

        <p className="text-[15px] text-[var(--t2)] leading-[1.7] mb-4">
          {event.summary}
        </p>

        <div className="flex items-center gap-2 text-[var(--t4)]">
          <time className="mono text-[11px]">
            {fmtDate(event.timestamp)} · {fmtTimeZ(event.timestamp)}
          </time>
          <span className="text-[11px]">·</span>
          <span className="text-[11px]">{event.location}</span>
        </div>
      </article>
    </Link>
  );
}

function EventListItem({ event }: { event: EventItem }) {
  return (
    <Link
      href={`/browse/events/${event.id}`}
      className="no-underline block group py-5 border-b border-[var(--bd-s)]"
    >
      <article>
        <div className="flex items-center gap-2 mb-1.5">
          <SeverityBadge severity={event.severity} />
          <span className="mono text-[10px] text-[var(--t4)]">{event.type}</span>
          <span className="mono text-[10px] text-[var(--t4)]">·</span>
          <span className="mono text-[10px] text-[var(--t4)]">
            {fmtTimeZ(event.timestamp)}
          </span>
          {event.verified && (
            <span className="mono text-[9px] text-[var(--success)] font-bold">VERIFIED</span>
          )}
        </div>

        <h3 className="text-[18px] font-semibold text-[var(--t1)] leading-snug mb-1.5 group-hover:text-[var(--blue)] transition-colors">
          {event.title}
        </h3>

        <p className="text-[13px] text-[var(--t3)] leading-relaxed line-clamp-2 mb-1.5">
          {event.summary}
        </p>

        <span className="text-[11px] text-[var(--t4)]">{event.location}</span>
      </article>
    </Link>
  );
}
