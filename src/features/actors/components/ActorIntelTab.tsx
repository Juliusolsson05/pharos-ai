'use client';

import { CheckCircle } from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';

import { SectionDivider } from '@/shared/components/shared/SectionDivider';

import { TYPE_C } from '@/shared/lib/severity-colors';

import type { Actor } from '@/types/domain';
import type { ActorDaySnapshot, ConflictDay, RecentAction } from '@/types/domain';

type Props = {
  actor: Actor;
  snap: ActorDaySnapshot;
  actC: string;
  staC: string;
  currentDay: ConflictDay;
  dayActions: RecentAction[];
  showKeyFigures?: boolean;
  leadershipStatus?: 'loading' | 'available' | 'unavailable';
  footer?: React.ReactNode;
};

export function ActorIntelTab({
  actor,
  snap,
  actC,
  staC,
  currentDay,
  dayActions,
  showKeyFigures = true,
  leadershipStatus,
  footer,
}: Props) {
  return (
    <ScrollArea className="h-full">
      <div className="px-[22px] py-[18px]">
        <div className="mb-5">
          <SectionDivider label="SAYING — OFFICIAL POSITION" />
          <div className="pl-3" style={{ borderLeft: `3px solid ${staC}` }}>
            <p className="text-[length:var(--text-body)] text-[var(--t1)] leading-relaxed italic">
              {snap.saying}
            </p>
          </div>
        </div>

        <div className="mb-5">
          <SectionDivider label="DOING — VERIFIED ACTIONS" />
          <div className="flex flex-col gap-1">
            {snap.doing.map((action, i) => (
              <div key={i} className="flex gap-2.5 px-2.5 py-1.5 border border-[var(--bd)]">
                <span className="text-xs shrink-0 mt-px" style={{ color: actC }}>▸</span>
                <span className="text-xs text-[var(--t1)] leading-snug">{action}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <SectionDivider label="PHAROS ASSESSMENT" />
          <div className="border-l-[3px] border-[var(--blue)] pl-3">
            <p className="text-[length:var(--text-body)] text-[var(--t1)] leading-relaxed">{snap.assessment}</p>
          </div>
        </div>

        <div className="mb-5">
          <SectionDivider label={`RECENT ACTIONS — ${currentDay} (${dayActions.length})`} />
          <div className="flex flex-col gap-1">
            {dayActions.map((action, i) => {
              const ac = TYPE_C[action.type] ?? 'var(--t2)';
              return (
                <div key={i} className="grid grid-cols-[86px_64px_1fr] py-1.5 border-b border-[var(--bd-s)]">
                  <span className="mono text-[length:var(--text-label)] text-[var(--t3)] self-start pt-px">{action.date}</span>
                  <div className="flex flex-col gap-[3px]">
                    <span
                      className="text-[length:var(--text-tiny)] font-bold px-[5px] py-px tracking-[0.04em]"
                      style={{ background: ac + '18', color: ac }}
                    >
                      {action.type}
                    </span>
                    <div className="flex gap-1 items-center">
                      {action.verified
                        ? <CheckCircle size={8} className="text-[var(--success)]" strokeWidth={2} />
                        : <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)]">UNCFMD</span>}
                    </div>
                  </div>
                  <p className="text-[length:var(--text-body-sm)] text-[var(--t1)] leading-snug pl-1">{action.description}</p>
                </div>
              );
            })}
            {dayActions.length === 0 && (
              <p className="text-[length:var(--text-label)] text-[var(--t4)] py-2">No recorded actions for this day</p>
            )}
          </div>
        </div>

        {showKeyFigures && (
          <div className="mb-5">
            <SectionDivider label="KEY FIGURES" />
            <div className="flex gap-1.5 flex-wrap">
              {actor.keyFigures.map((fig, i) => (
                <div key={i} className="px-2.5 py-[3px] border border-[var(--bd)] bg-[var(--bg-2)]">
                  <span className="text-[length:var(--text-label)] text-[var(--t2)]">{fig}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {leadershipStatus === 'loading' && (
          <div className="mb-5 border border-[var(--bd)] bg-[var(--bg-1)] px-4 py-3">
            <div className="label mb-1 text-[length:var(--text-tiny)] text-[var(--t4)]">LEADERSHIP STRUCTURE</div>
            <div className="section-title mb-2 text-[length:var(--text-body-sm)] text-[var(--t1)]">Loading leadership tree...</div>
            <p className="text-[length:var(--text-body-sm)] leading-relaxed text-[var(--t3)]">
              Pharos is resolving the command structure for this actor.
            </p>
          </div>
        )}

        {leadershipStatus === 'unavailable' && !showKeyFigures && (
          <div className="mb-5 border border-dashed border-[var(--bd)] bg-[var(--bg-1)] px-4 py-3">
            <div className="label mb-1 text-[length:var(--text-tiny)] text-[var(--t4)]">LEADERSHIP STRUCTURE</div>
            <div className="section-title mb-2 text-[length:var(--text-body-sm)] text-[var(--t1)]">Not available</div>
            <p className="text-[length:var(--text-body-sm)] leading-relaxed text-[var(--t3)]">
              No leadership tree is currently available for this actor.
            </p>
          </div>
        )}

        {footer && <div className="mt-8">{footer}</div>}
      </div>
    </ScrollArea>
  );
}
