import { BrowsePageHeader } from '@/features/browse/components/layout/BrowsePageHeader';
import { Flag } from '@/shared/components/shared/Flag';

import { ACT_C, STA_C } from '@/data/iran-actors';
import type { ActivityLevel, Stance } from '@/types/domain';

import { ActorProfileActions } from './ActorProfileActions';
import { ActorProfileResponses } from './ActorProfileResponses';

type Actor = {
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
  doing: string[];
  assessment: string;
  keyFigures: string[];
  actions: { id: string; date: string; type: string; description: string; verified: boolean; significance: string }[];
  responses: { id: string; stance: string; type: string; statement: string; event: { id: string; title: string; timestamp: string } | null }[];
};

type Props = {
  actor: Actor;
};

const AFF_STYLE: Record<string, { color: string; label: string }> = {
  FRIENDLY: { color: 'var(--success)', label: 'Friendly' },
  HOSTILE:  { color: 'var(--danger)',  label: 'Hostile' },
  NEUTRAL:  { color: 'var(--t3)',      label: 'Neutral' },
};

export function ActorProfile({ actor }: Props) {
  const actC = ACT_C[actor.activityLevel] ?? 'var(--t2)';
  const staC = STA_C[actor.stance] ?? 'var(--t2)';
  const aff = actor.affiliation ? AFF_STYLE[actor.affiliation] : null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <BrowsePageHeader
        crumbs={[
          { label: 'Actors', href: '/browse/actors' },
          { label: actor.name },
        ]}
      />

      <header className="mt-6 mb-8">
        <div className="h-[3px] w-10 mb-5" style={{ background: actC }} />

        <div className="flex items-center gap-3 mb-2">
          {actor.countryCode && <Flag code={actor.countryCode} size={32} />}
          <div>
            <h1 className="text-lg font-bold text-[var(--t1)]">{actor.name}</h1>
            <p className="mono text-[11px] text-[var(--t3)]">{actor.fullName}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span
            className="mono text-[9px] font-bold px-2 py-0.5 rounded-sm"
            style={{ color: actC, border: `1px solid ${actC}`, background: `${actC}15` }}
          >
            {actor.activityLevel}
          </span>
          <span
            className="mono text-[9px] font-bold px-2 py-0.5 rounded-sm"
            style={{ color: staC, border: `1px solid ${staC}`, background: `${staC}15` }}
          >
            {actor.stance}
          </span>
          {aff && (
            <span
              className="mono text-[9px] px-2 py-0.5 rounded-sm"
              style={{ color: aff.color, border: `1px solid ${aff.color}`, background: `${aff.color}15` }}
            >
              {aff.label}
            </span>
          )}
          <span className="mono text-[9px] text-[var(--t4)]">{actor.type}</span>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <div className="h-[3px] flex-1 max-w-xs rounded-full bg-[var(--bg-3)]">
            <div className="h-full rounded-full" style={{ width: `${actor.activityScore}%`, background: actC }} />
          </div>
          <span className="mono text-[10px] font-bold" style={{ color: actC }}>{actor.activityScore}%</span>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="label mb-3">Assessment</h2>
        <p className="text-[15px] text-[var(--t1)] leading-[1.7]">{actor.assessment}</p>
      </section>

      <section className="mb-8">
        <h2 className="label mb-3">Current posture</h2>
        <blockquote className="border-l-2 border-[var(--bd)] pl-4 mb-4">
          <p className="text-[13px] text-[var(--t2)] italic leading-relaxed">
            &ldquo;{actor.saying}&rdquo;
          </p>
        </blockquote>
        {actor.doing.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {actor.doing.map((item, i) => (
              <li key={i} className="flex gap-2 text-xs text-[var(--t2)] leading-relaxed">
                <span className="text-[var(--t4)] shrink-0">&bull;</span>
                {item}
              </li>
            ))}
          </ul>
        )}
      </section>

      {actor.keyFigures.length > 0 && (
        <section className="mb-8">
          <h2 className="label mb-3">Key figures</h2>
          <div className="flex flex-wrap gap-2">
            {actor.keyFigures.map((fig) => (
              <span key={fig} className="mono text-[10px] text-[var(--t2)] px-2 py-1 rounded border border-[var(--bd-s)]">
                {fig}
              </span>
            ))}
          </div>
        </section>
      )}

      <ActorProfileActions actions={actor.actions} />
      <ActorProfileResponses responses={actor.responses} />
    </div>
  );
}
