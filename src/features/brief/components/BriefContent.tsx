'use client';

import { ScrollArea } from '@/components/ui/scroll-area';

import { useActors } from '@/features/actors/queries';
import { BRIEF_SOURCES, TIER_C } from '@/features/brief/components/brief-constants';
import { BriefSection, EconChip, ScenarioCard } from '@/features/brief/components/BriefSection';
import { useConflictDaySnapshot } from '@/features/dashboard/queries/conflicts';
import { BriefScreenSkeleton } from '@/shared/components/loading/screen-skeletons';
import { DaySelector } from '@/shared/components/shared/DaySelector';
import { Flag } from '@/shared/components/shared/Flag';

import { getAnalyticsLayoutMode, trackBriefViewChanged } from '@/shared/lib/analytics';
import { useConflictDay } from '@/shared/hooks/use-conflict-day';
import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useLandscapeScrollEmitter } from '@/shared/hooks/use-landscape-scroll-emitter';

import { ACT_C, STA_C } from '@/data/iran-actors';

const MAJOR_IDS = ['us', 'idf', 'iran', 'irgc', 'houthis'];

export function BriefContent() {
  const { currentDay, setDay, dayLabel, dayIndex } = useConflictDay();
  const { data: snapshot, isLoading: snapshotLoading } = useConflictDaySnapshot(undefined, currentDay || undefined);
  const { data: actors, isLoading: actorsLoading } = useActors(undefined, currentDay || undefined);
  const isLandscapePhone = useIsLandscapePhone();
  const isMobile = useIsMobile(1024);
  const onLandscapeScroll = useLandscapeScrollEmitter(isLandscapePhone);
  const layoutMode = getAnalyticsLayoutMode({ isLandscapePhone, isMobile });

  const majorActors = actors?.filter(a => MAJOR_IDS.includes(a.id)) ?? [];

  if (snapshotLoading || actorsLoading) return <BriefScreenSkeleton />;
  if (!snapshot) return null;

  const content = (
    <div className={`max-w-[720px] mx-auto ${isLandscapePhone ? 'safe-px pt-4 pb-8' : 'px-6 pt-8 pb-[60px]'}`}>

        {/* Classification header */}
        <div className="text-center mb-8 pb-5 border-b-2 border-[var(--bd)]">
          <div className="mb-2">
            <span className="mono text-[length:var(--text-caption)] font-bold tracking-[0.16em] text-[var(--t4)] uppercase">
              UNCLASSIFIED // PHAROS ANALYTICAL
            </span>
          </div>
          <h1 className="mono text-[22px] font-bold text-[var(--t1)] tracking-[0.04em] mb-[6px]">
            DAILY INTELLIGENCE BRIEF
          </h1>
          <h2 className="mono text-[length:var(--text-subhead)] font-bold text-[var(--danger)] tracking-[0.08em] mb-2.5">
            OPERATION EPIC FURY / ROARING LION
          </h2>
          <div className="flex justify-center gap-5 mb-4">
            <span className="mono text-[length:var(--text-label)] text-[var(--t3)]">DATE: {currentDay}</span>
            <span className="mono text-[length:var(--text-label)] text-[var(--t3)]">AS OF: 12:00 UTC</span>
            <span className="mono text-[length:var(--text-label)] text-[var(--t3)]">DAY {dayIndex + 1} OF OPERATIONS</span>
          </div>
          <div className="flex justify-center">
            <DaySelector
              currentDay={currentDay}
              onDayChange={day => {
                if (day === currentDay) return;

                setDay(day);
                trackBriefViewChanged({
                  control: 'day',
                  day,
                  layout_mode: layoutMode,
                  pathname: '/dashboard/brief',
                  surface: 'dashboard_brief',
                  value: day,
                });
              }}
            />
          </div>
        </div>

        <BriefSection number="1" title="EXECUTIVE SUMMARY">
          <p className="leading-[1.8] text-[var(--t1)]">{snapshot.summary}</p>
        </BriefSection>

        <BriefSection number="2" title={`KEY DEVELOPMENTS — ${dayLabel}`}>
          <div className="flex flex-col gap-[6px]">
            {snapshot.keyFacts.map((fact, i) => (
              <div key={i} className="flex gap-3 px-3 py-2 bg-[var(--bg-2)] border border-[var(--bd)] [border-left:3px_solid_var(--danger)]">
                <span className="mono text-[length:var(--text-label)] font-bold text-[var(--danger)] shrink-0 pt-[1px]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-[length:var(--text-body)] text-[var(--t1)] leading-normal">{fact}</p>
              </div>
            ))}
          </div>
        </BriefSection>

        <BriefSection number="3" title="SITUATION BY ACTOR">
          <div className="flex flex-col gap-3">
            {majorActors.map(actor => {
              const actC = ACT_C[actor.activityLevel] ?? 'var(--t2)';
              const staC = STA_C[actor.stance] ?? 'var(--t2)';
              return (
                <div key={actor.id} className="px-4 py-3 bg-[var(--bg-2)] border border-[var(--bd)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Flag actorId={actor.id} code={actor.countryCode} size={18} />
                    <span className="text-[length:var(--text-body)] font-bold text-[var(--t1)]">{actor.fullName}</span>
                    <span className="text-[length:var(--text-tiny)] font-bold px-[6px] py-[2px] ml-auto"
                      style={{ background: actC + '18', color: actC }}>
                      {actor.activityLevel}
                    </span>
                    <span className="text-[length:var(--text-tiny)] font-bold px-[6px] py-[2px]"
                      style={{ background: staC + '18', color: staC }}>
                      {actor.stance}
                    </span>
                  </div>
                  <p className="text-[length:var(--text-body)] text-[var(--t2)] leading-relaxed">{actor.assessment}</p>
                </div>
              );
            })}
          </div>
        </BriefSection>

        <BriefSection number="4" title="ECONOMIC IMPACT">
          <p className="leading-[1.8] text-[var(--t2)] mb-3">
            {snapshot.economicImpact.narrative}
          </p>
          <div className="flex gap-[10px] mb-3 flex-wrap">
            {snapshot.economicImpact.chips.map((chip, i) => (
              <EconChip key={i} label={chip.label} val={chip.val} sub={chip.sub} color={chip.color} />
            ))}
          </div>
        </BriefSection>

        <BriefSection number="5" title="OUTLOOK">
          <div className="flex flex-col gap-[10px]">
            {snapshot.scenarios.map((s, i) => (
              <ScenarioCard key={i} label={s.label} subtitle={s.subtitle} color={s.color} prob={s.prob} body={s.body} />
            ))}
          </div>
        </BriefSection>

        <BriefSection number="6" title="SOURCES">
          <div className="flex flex-col gap-1">
            {BRIEF_SOURCES.map((src, i) => (
              <div key={i} className="flex items-center gap-[10px] px-[10px] py-[6px] border border-[var(--bd)]">
                <span
                  className="text-[length:var(--text-tiny)] font-bold px-[5px] py-[1px] shrink-0"
                  style={{ background: TIER_C[src.tier] + '22', color: TIER_C[src.tier] }}
                >
                  T{src.tier}
                </span>
                {'url' in src && src.url ? (
                  <a
                    href={(src as { url: string }).url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[length:var(--text-body-sm)] font-semibold min-w-[180px] hover:underline"
                    style={{ color: 'var(--blue-l)', textDecoration: 'none' }}
                  >
                    {src.name} ↗
                  </a>
                ) : (
                  <span className="text-[length:var(--text-body-sm)] font-semibold text-[var(--t1)] min-w-[180px]">{src.name}</span>
                )}
                <span className="text-[length:var(--text-label)] text-[var(--t3)] flex-1">{src.note}</span>
              </div>
            ))}
          </div>
        </BriefSection>

    </div>
  );

  return (
    isLandscapePhone ? (
      <div className="flex-1 bg-[var(--bg-1)] overflow-y-auto" onScroll={onLandscapeScroll}>
        {content}
      </div>
    ) : (
      <ScrollArea className="flex-1 bg-[var(--bg-1)]">
        {content}
      </ScrollArea>
    )
  );
}
