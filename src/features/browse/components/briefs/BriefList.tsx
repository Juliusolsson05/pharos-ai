import Link from 'next/link';

import { EscalationBar } from '@/features/browse/components/briefs/EscalationBar';

type BriefItem = {
  id: string;
  day: string;
  dayLabel: string;
  summary: string;
  escalation: number;
  keyFacts: string[];
};

type Props = {
  briefs: BriefItem[];
};

export function BriefList({ briefs }: Props) {
  if (briefs.length === 0) {
    return <p className="text-sm text-[var(--t3)]">No briefs available.</p>;
  }

  return (
    <div className="flex flex-col">
      {briefs.map((brief) => (
        <Link
          key={brief.id}
          href={`/browse/brief/${brief.day}`}
          className="no-underline block group"
        >
          <article className="py-6 border-b border-[var(--bd-s)]">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-sm font-semibold text-[var(--t1)] group-hover:text-[var(--blue)] transition-colors">
                {brief.dayLabel}
              </h2>
              <span className="mono text-[10px] text-[var(--t4)]">{brief.day}</span>
              <span className="mono text-[10px] text-[var(--t4)]">
                {brief.keyFacts.length} key facts
              </span>
            </div>

            <div className="mb-3 max-w-xs">
              <EscalationBar escalation={brief.escalation} />
            </div>

            <p className="text-[13px] text-[var(--t2)] leading-relaxed line-clamp-2">
              {brief.summary}
            </p>
          </article>
        </Link>
      ))}
    </div>
  );
}
