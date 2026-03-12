import Link from 'next/link';

import { Flag } from '@/shared/components/shared/Flag';

import { ACT_C, STA_C } from '@/data/iran-actors';
import type { ActivityLevel, Stance } from '@/types/domain';

type Props = {
  id: string;
  name: string;
  fullName: string;
  countryCode: string | null;
  type: string;
  affiliation: string | null;
  activityLevel: ActivityLevel;
  activityScore: number;
  stance: Stance;
  saying: string;
  assessment: string;
};

export function ActorCard(props: Props) {
  const actC = ACT_C[props.activityLevel] ?? 'var(--t2)';
  const staC = STA_C[props.stance] ?? 'var(--t2)';

  return (
    <Link
      href={`/browse/actors/${props.id}`}
      className="no-underline block group"
    >
      <article className="relative rounded-md border border-[var(--bd-s)] px-4 py-3.5 h-full transition-colors hover:border-[var(--bd)] hover:bg-[var(--bg-3)]/20">
        <div className="flex items-center gap-2.5 mb-2.5">
          {props.countryCode && <Flag code={props.countryCode} size={22} />}
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-bold text-[var(--t1)] group-hover:text-[var(--blue)] transition-colors truncate">
              {props.name}
            </h3>
            <span className="mono text-[9px] text-[var(--t4)]">{props.type.replace('_', ' ')}</span>
          </div>
          <span
            className="mono text-[18px] font-bold shrink-0 leading-none"
            style={{ color: actC }}
          >
            {props.activityScore}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          <span
            className="mono text-[8px] font-bold px-1.5 py-px rounded-sm"
            style={{ color: staC, background: `${staC}12` }}
          >
            {props.stance}
          </span>
          <span
            className="mono text-[8px] font-bold px-1.5 py-px rounded-sm"
            style={{ color: actC, background: `${actC}12` }}
          >
            {props.activityLevel}
          </span>
        </div>

        <p className="text-[11px] text-[var(--t2)] leading-[1.6] line-clamp-2">
          {props.assessment}
        </p>

        <div className="mt-3 h-[2px] rounded-full bg-[var(--bg-3)]">
          <div
            className="h-full rounded-full"
            style={{ width: `${props.activityScore}%`, background: actC }}
          />
        </div>
      </article>
    </Link>
  );
}
