import Link from 'next/link';

import { fmtDate } from '@/shared/lib/format';

import { CategoryBadge } from './CategoryBadge';

type Props = {
  id: string;
  title: string;
  tagline: string;
  category: string;
  narrative: string;
  keyFacts: string[];
  timestamp: string;
  eventCount: number;
};

export function StoryCard(props: Props) {
  return (
    <Link href={`/browse/stories/${props.id}`} className="no-underline block group">
      <article className="rounded-md border border-[var(--bd-s)] px-5 py-4 transition-colors hover:border-[var(--bd)] hover:bg-[var(--bg-3)]/20">
        <div className="flex items-center gap-2.5 mb-3">
          <CategoryBadge category={props.category} />
          <span className="mono text-[length:var(--text-label)] text-[var(--t4)]">
            {fmtDate(props.timestamp)}
          </span>
        </div>

        <h2 className="text-[length:var(--text-subhead)] font-bold text-[var(--t1)] leading-snug mb-1 group-hover:text-[var(--blue)] transition-colors">
          {props.title}
        </h2>
        <p className="text-xs text-[var(--t3)] mb-3">{props.tagline}</p>

        <p className="text-[length:var(--text-body)] text-[var(--t2)] leading-relaxed line-clamp-3 mb-3">
          {props.narrative}
        </p>

        <div className="flex items-center gap-3 text-[length:var(--text-label)] mono text-[var(--t4)]">
          <span>{props.keyFacts.length} key facts</span>
          <span>&middot;</span>
          <span>{props.eventCount} timeline events</span>
        </div>
      </article>
    </Link>
  );
}
