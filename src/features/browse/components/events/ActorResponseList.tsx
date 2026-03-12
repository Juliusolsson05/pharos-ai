import Link from 'next/link';

import type { ActorResponse } from '@/types/domain';

const STANCE_STYLE: Record<string, string> = {
  SUPPORTING: 'text-[var(--success)]',
  OPPOSING: 'text-[var(--danger)]',
  NEUTRAL: 'text-[var(--t3)]',
  CONDEMNING: 'text-[var(--warning)]',
  UNKNOWN: 'text-[var(--t4)]',
};

type Props = {
  responses: ActorResponse[];
};

export function ActorResponseList({ responses }: Props) {
  if (responses.length === 0) return null;

  return (
    <section>
      <p className="label mb-3">Actor responses</p>
      <div className="flex flex-col gap-2">
        {responses.map((r, i) => (
          <div key={`${r.actorId}-${i}`} className="card">
            <div className="card-header">
              <Link
                href={`/browse/actors/${r.actorId}`}
                className="no-underline text-xs font-bold text-[var(--blue-l)] hover:text-[var(--t1)] transition-colors"
              >
                {r.actorName}
              </Link>
              <span className={`mono text-[9px] font-bold ${STANCE_STYLE[r.stance] ?? STANCE_STYLE.UNKNOWN}`}>
                {r.stance}
              </span>
              <span className="mono text-[10px] text-[var(--t4)] ml-auto">{r.type}</span>
            </div>
            <div className="card-body">
              <p className="text-xs text-[var(--t2)] leading-relaxed">{r.statement}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
