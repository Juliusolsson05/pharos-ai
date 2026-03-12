import Link from 'next/link';

import { STA_C } from '@/data/iran-actors';
import type { Stance } from '@/types/domain';

type EventResponse = {
  id: string;
  stance: string;
  type: string;
  statement: string;
  event: {
    id: string;
    title: string;
    timestamp: string;
  } | null;
};

type Props = {
  responses: EventResponse[];
};

export function ActorProfileResponses({ responses }: Props) {
  if (responses.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="label mb-3">Event responses</h2>
      <div className="flex flex-col gap-3">
        {responses.map((r) => {
          const rStaC = STA_C[r.stance as Stance] ?? 'var(--t3)';
          return (
            <div key={r.id} className="rounded-md border border-[var(--bd-s)] p-3">
              {r.event && (
                <Link
                  href={`/browse/events/${r.event.id}`}
                  className="no-underline text-[11px] font-bold text-[var(--blue)] hover:text-[var(--t1)] transition-colors block mb-1"
                >
                  {r.event.title}
                </Link>
              )}
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="mono text-[8px] font-bold px-1.5 py-0.5 rounded-sm"
                  style={{ color: rStaC, border: `1px solid ${rStaC}`, background: `${rStaC}15` }}
                >
                  {r.stance}
                </span>
                <span className="mono text-[9px] text-[var(--t4)]">{r.type}</span>
              </div>
              <p className="text-xs text-[var(--t2)] leading-relaxed">{r.statement}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
