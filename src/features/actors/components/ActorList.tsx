'use client';
import { useMemo } from 'react';

import { ArrowRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useActors } from '@/features/actors/queries';
import { useXPosts } from '@/features/events/queries/x-posts';
import { DaySelector } from '@/shared/components/shared/DaySelector';
import { Flag } from '@/shared/components/shared/Flag';

import { getActorForDay } from '@/shared/lib/day-filter';
import { cn } from '@/shared/lib/utils';

import { ACT_C, STA_C } from '@/data/iran-actors';
import type { Actor, ConflictDay } from '@/types/domain';

type Props = {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  currentDay: ConflictDay;
  onDayChange: (day: ConflictDay) => void;
  compact?: boolean;
  pageScroll?: boolean;
};

export function ActorList({ selectedId, onSelect, currentDay, onDayChange, compact = false, pageScroll = false }: Props) {
  const { data: actors } = useActors(undefined, currentDay || undefined);
  const { data: allPosts } = useXPosts();

  const actorPostCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of allPosts ?? []) {
      if (p.actorId) map.set(p.actorId, (map.get(p.actorId) ?? 0) + 1);
    }
    return map;
  }, [allPosts]);

  // Sort actors by selected day's activity score
  const sorted = [...(actors ?? [])].sort((a, b) =>
    (getActorForDay(b, currentDay)?.activityScore ?? 0) - (getActorForDay(a, currentDay)?.activityScore ?? 0)
  );

  return (
    <div className={cn(pageScroll ? 'flex flex-col' : 'flex-1 flex flex-col overflow-hidden')}>
      <div className={cn('panel-header justify-between', compact && (pageScroll ? 'h-8 min-h-8 safe-px' : 'h-8 min-h-8 px-3'))}>
        <span className="section-title">Actors</span>
        <Badge variant="outline" className="text-[length:var(--text-caption)] text-[var(--t4)] border-[var(--bd)]">{sorted.length}</Badge>
      </div>

      {/* Day selector */}
      <div className={cn(pageScroll ? 'safe-px' : 'px-3', 'border-b border-[var(--bd)] bg-[var(--bg-2)] shrink-0', compact ? 'py-1.5' : 'py-2')}>
        <DaySelector currentDay={currentDay} onDayChange={onDayChange} />
      </div>

      {/* Column headers */}
      <div className={cn('grid grid-cols-[1fr_60px_30px] py-1 border-b border-[var(--bd)] bg-[var(--bg-2)] shrink-0', pageScroll ? 'safe-px' : 'px-3')}>
        {['ACTOR', 'ACTIVITY', ''].map(h => <span key={h} className="label text-[length:var(--text-tiny)]">{h}</span>)}
      </div>

      {pageScroll ? (
        <div>
          {sorted.map((actor: Actor) => {
            const snap   = getActorForDay(actor, currentDay);
            if (!snap) return null;
            const isOn   = selectedId === actor.id;
            const actC   = ACT_C[snap.activityLevel] ?? 'var(--t2)';
            const staC   = STA_C[snap.stance] ?? 'var(--t2)';
            const xCount = actorPostCounts.get(actor.id) ?? 0;
            return (
              <Button
                key={actor.id}
                variant="ghost"
                onClick={() => onSelect(isOn ? null : actor.id)}
                className={cn(
                  'grid grid-cols-[1fr_60px_30px] gap-0 w-full h-auto rounded-none justify-start items-center border-b border-[var(--bd-s)]',
                  pageScroll ? 'safe-px' : 'px-3',
                  compact ? 'py-1.5' : 'py-2',
                )}
                style={{
                  borderLeft: `3px solid ${isOn ? actC : 'transparent'}`,
                  background: isOn ? 'var(--bg-sel)' : 'transparent',
                }}
              >
                {/* Name + flag + stance */}
                <div>
                  <div className="flex items-center gap-[5px] mb-[3px]">
                    <Flag actorId={actor.id} code={actor.countryCode} size={18} />
                    <span className="text-[length:var(--text-body-sm)] font-bold text-[var(--t1)] text-left">
                      {actor.name}
                    </span>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <Badge
                      variant="outline"
                      className="text-[length:var(--text-micro)] px-1 py-px tracking-[0.04em] rounded-sm"
                      style={{ color: staC, borderColor: staC, background: `${staC}15` }}
                    >
                      {snap.stance}
                    </Badge>
                    {xCount > 0 && <span className="mono text-[length:var(--text-tiny)] text-[var(--t3)]">𝕏{xCount}</span>}
                  </div>
                </div>

                {/* Activity progress bar */}
                <div className="flex flex-col justify-center gap-[3px]">
                  <Progress
                    value={snap.activityScore}
                    className="h-[3px] rounded-[1px] bg-[var(--bd)]"
                    indicatorStyle={{ background: actC }}
                  />
                  <span className="mono text-[length:var(--text-tiny)]" style={{ color: actC }}>{snap.activityScore}</span>
                </div>

                <ArrowRight size={9} className="text-[var(--t3)] self-center" strokeWidth={1.5} />
              </Button>
            );
          })}
        </div>
      ) : (
        <ScrollArea className="flex-1">
          {sorted.map((actor: Actor) => {
            const snap   = getActorForDay(actor, currentDay);
            if (!snap) return null;
            const isOn   = selectedId === actor.id;
            const actC   = ACT_C[snap.activityLevel] ?? 'var(--t2)';
            const staC   = STA_C[snap.stance] ?? 'var(--t2)';
            const xCount = actorPostCounts.get(actor.id) ?? 0;
            return (
              <Button
                key={actor.id}
                variant="ghost"
                onClick={() => onSelect(isOn ? null : actor.id)}
                className={cn(
                  'grid grid-cols-[1fr_60px_30px] gap-0 w-full h-auto rounded-none justify-start items-center border-b border-[var(--bd-s)]',
                  pageScroll ? 'safe-px' : 'px-3',
                  compact ? 'py-1.5' : 'py-2',
                )}
                style={{
                  borderLeft: `3px solid ${isOn ? actC : 'transparent'}`,
                  background: isOn ? 'var(--bg-sel)' : 'transparent',
                }}
              >
                {/* Name + flag + stance */}
                <div>
                  <div className="flex items-center gap-[5px] mb-[3px]">
                    <Flag actorId={actor.id} code={actor.countryCode} size={18} />
                    <span className="text-[length:var(--text-body-sm)] font-bold text-[var(--t1)] text-left">
                      {actor.name}
                    </span>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <Badge
                      variant="outline"
                      className="text-[length:var(--text-micro)] px-1 py-px tracking-[0.04em] rounded-sm"
                      style={{ color: staC, borderColor: staC, background: `${staC}15` }}
                    >
                      {snap.stance}
                    </Badge>
                    {xCount > 0 && <span className="mono text-[length:var(--text-tiny)] text-[var(--t3)]">𝕏{xCount}</span>}
                  </div>
                </div>

                {/* Activity progress bar */}
                <div className="flex flex-col justify-center gap-[3px]">
                  <Progress
                    value={snap.activityScore}
                    className="h-[3px] rounded-[1px] bg-[var(--bd)]"
                    indicatorStyle={{ background: actC }}
                  />
                  <span className="mono text-[length:var(--text-tiny)]" style={{ color: actC }}>{snap.activityScore}</span>
                </div>

                <ArrowRight size={9} className="text-[var(--t3)] self-center" strokeWidth={1.5} />
              </Button>
            );
          })}
        </ScrollArea>
      )}
    </div>
  );
}
