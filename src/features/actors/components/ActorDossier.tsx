'use client';

import { useState } from 'react';

import { ChevronDown } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

import { ActorIntelTab } from '@/features/actors/components/ActorIntelTab';
import { ActorMilitaryTab } from '@/features/actors/components/ActorMilitaryTab';
import { ISO2_TO_ISO3 } from '@/features/actors/lib/country-codes';
import { useXPostsByActor } from '@/features/events/queries/x-posts';
import { ActorLeadershipGraph } from '@/features/leadership/components/ActorLeadershipGraph';
import { isLeadershipActor } from '@/features/leadership/lib/leadership-tree-config';
import { useActorLeadership } from '@/features/leadership/queries';
import { Flag } from '@/shared/components/shared/Flag';
import { IntelTabBar, TabsContent } from '@/shared/components/shared/IntelTabs';
import { XPostCard } from '@/shared/components/shared/XPostCard';

import { dayAbbrev,getActorForDay } from '@/shared/lib/day-filter';
import { cn } from '@/shared/lib/utils';
import { useConflictDay } from '@/shared/hooks/use-conflict-day';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

import { ACT_C, STA_C } from '@/data/iran-actors';
import type { Actor, XPost } from '@/types/domain';

type DossierTab = 'intel' | 'signals' | 'leadership' | 'military';

type Props = {
  actor: Actor;
  tab: DossierTab;
  onTabChange: (t: DossierTab) => void;
  currentDay: string;
  compact?: boolean;
  pageScroll?: boolean;
};

export function ActorDossier({ actor, tab, onTabChange, currentDay, compact = false, pageScroll = false }: Props) {
  const [inlineLeadershipOpen, setInlineLeadershipOpen] = useState(true);
  const isMobile = useIsMobile(1024);
  const snap   = getActorForDay(actor, currentDay);
  const actC   = ACT_C[snap?.activityLevel] ?? 'var(--t2)';
  const staC   = STA_C[snap?.stance] ?? 'var(--t2)';
  const { data: xPosts } = useXPostsByActor(undefined, actor.id);
  const { allDays } = useConflictDay();
  const dayActions = actor.recentActions.filter(a => a.date === currentDay);

  const posts = xPosts ?? [];
  const iso3 = ISO2_TO_ISO3[actor.countryCode ?? ''];
  const supportsLeadershipGraph = isLeadershipActor(actor);
  const { data: leadershipTree, isLoading: isLeadershipLoading } = useActorLeadership(undefined, actor.id);
  const hasLeadershipTree = Boolean(leadershipTree?.nodes?.some(node => node.kind === 'active'));
  const showLeadershipGraph = supportsLeadershipGraph && hasLeadershipTree;
  const leadershipStatus = supportsLeadershipGraph
    ? isLeadershipLoading
      ? 'loading'
      : hasLeadershipTree
        ? 'available'
        : 'unavailable'
    : undefined;

  const tabs: { value: DossierTab; label: string }[] = [
    { value: 'intel', label: 'ACTOR INTELLIGENCE' },
    { value: 'signals', label: `𝕏 SIGNALS${posts.length > 0 ? ` (${posts.length})` : ''}` },
  ];
  if (showLeadershipGraph) tabs.push({ value: 'leadership', label: 'LEADERSHIP TREE' });
  if (iso3) tabs.push({ value: 'military', label: 'MILITARY PROFILE' });

  if (!snap) {
    return (
      <div className={cn(pageScroll ? 'flex flex-col p-3 gap-2' : 'flex-1 flex flex-col p-3 gap-2')}>
        <Skeleton className="h-10 w-full bg-[var(--bg-3)]" />
        <Skeleton className="h-8 w-full bg-[var(--bg-3)]" />
        <Skeleton className="h-24 w-full bg-[var(--bg-3)]" />
      </div>
    );
  }

  return (
    <div className={cn(pageScroll ? 'flex flex-col' : 'flex-1 flex flex-col overflow-hidden')}>
      {/* Header */}
      <div className={cn('border-b border-[var(--bd)] bg-[var(--bg-2)] shrink-0', compact ? (pageScroll ? 'safe-px py-2' : 'px-3 py-2') : 'px-5 py-3')}>
        <div className="label text-[length:var(--text-tiny)] text-[var(--t3)] mb-2">
          ACTOR INTELLIGENCE DOSSIER // PHAROS THREAT ANALYSIS // OPERATION EPIC FURY
        </div>
        <div className="flex items-start gap-3.5 mb-2.5">
          <Flag actorId={actor.id} code={actor.countryCode} size={36} />
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-base font-bold text-[var(--t1)] leading-[1.1]">
                {actor.name.toUpperCase()}
              </h1>
              <span
                className="text-[length:var(--text-tiny)] font-bold tracking-[0.06em] px-2 py-0.5"
                style={{ border: `1px solid ${actC}`, color: actC }}
              >
                {snap.activityLevel}
              </span>
              <span
                className="text-[length:var(--text-tiny)] font-bold tracking-[0.06em] px-2 py-0.5"
                style={{ border: `1px solid ${staC}`, color: staC }}
              >
                {snap.stance}
              </span>
            </div>
            <span className="mono text-[length:var(--text-label)] text-[var(--t2)]">{actor.fullName}</span>
            <span className="label ml-2.5 text-[length:var(--text-tiny)] text-[var(--t3)]">{actor.type}</span>
          </div>
          <div className="shrink-0 flex items-center gap-1.5">
            {!isMobile && (
              <div className="h-1.5 w-20 bg-[var(--bd)]">
                <div style={{ width: `${snap.activityScore}%`, height: '100%', background: actC }} />
              </div>
            )}
            <span className="mono text-[length:var(--text-body-sm)]" style={{ color: actC }}>{snap.activityScore}%</span>
          </div>
        </div>

        {/* Stance timeline */}
        <div className="flex items-center gap-1 mt-1 overflow-x-auto touch-scroll hide-scrollbar">
          <span className="label text-[length:var(--text-micro)] text-[var(--t4)] mr-1">STANCE</span>
          {allDays.map(day => {
            const ds = getActorForDay(actor, day);
            if (!ds) return null;
            const sc = STA_C[ds.stance] ?? 'var(--t2)';
            const isCurrent = day === currentDay;
            return (
              <div
                key={day}
                className="flex items-center gap-[3px] px-[6px] py-[2px]"
                style={{
                  background: sc + '18',
                  border: `1px solid ${isCurrent ? sc : 'transparent'}`,
                }}
              >
                <span className="mono text-[length:var(--text-micro)] font-bold" style={{ color: sc }}>{dayAbbrev(day, allDays)}</span>
                <span className="text-[length:var(--text-micro)] font-bold tracking-[0.04em]" style={{ color: sc }}>{ds.stance}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <IntelTabBar value={tab} onValueChange={onTabChange} tabs={tabs} compact={compact} safeEdges={pageScroll}>
        <TabsContent value="intel" className={pageScroll ? '' : 'flex-1 min-h-0 overflow-hidden'}>
          <ActorIntelTab
            actor={actor}
            snap={snap}
            actC={actC}
            staC={staC}
            currentDay={currentDay}
            dayActions={dayActions}
            showKeyFigures={!showLeadershipGraph}
            leadershipStatus={leadershipStatus}
            footer={showLeadershipGraph ? (
              <Collapsible open={inlineLeadershipOpen} onOpenChange={setInlineLeadershipOpen}>
                <div className="border border-[var(--bd)] bg-[var(--bg-1)]">
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--bg-2)]">
                    <div>
                      <div className="label mb-1 text-[length:var(--text-tiny)] text-[var(--t4)]">LEADERSHIP STRUCTURE</div>
                      <div className="section-title text-[length:var(--text-body-sm)] text-[var(--t1)]">Leadership tree available</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="mono text-[length:var(--text-label)] text-[var(--t4)]">{inlineLeadershipOpen ? 'Expanded' : 'Collapsed'}</span>
                      <ChevronDown className={cn('h-4 w-4 text-[var(--t3)] transition-transform', inlineLeadershipOpen && 'rotate-180')} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-[var(--bd)] bg-[var(--bg-app)]">
                      <ActorLeadershipGraph actor={actor} pageScroll />
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ) : undefined}
          />
        </TabsContent>

        <TabsContent value="signals" className={pageScroll ? '' : 'flex-1 min-h-0 overflow-hidden'}>
          {pageScroll ? (
            <div className={cn(compact ? (pageScroll ? 'safe-px py-3' : 'px-3 py-3') : 'px-4 py-3')}>
              {posts.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="text-xl text-[var(--t3)]">𝕏</span>
                  <p className="label text-[var(--t3)] mt-2">
                    No signals indexed for this actor
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-2.5">
                    <span className="label text-[length:var(--text-tiny)]">
                      {posts.length} POSTS · PHAROS-CURATED · {actor.name.toUpperCase()}
                    </span>
                  </div>
                  {posts.map(p => <XPostCard key={p.id} post={p as XPost} />)}
                </>
              )}
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className={cn(compact ? (pageScroll ? 'safe-px py-3' : 'px-3 py-3') : 'px-4 py-3')}>
                {posts.length === 0 ? (
                  <div className="p-12 text-center">
                    <span className="text-xl text-[var(--t3)]">𝕏</span>
                    <p className="label text-[var(--t3)] mt-2">
                      No signals indexed for this actor
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-2.5">
                      <span className="label text-[length:var(--text-tiny)]">
                        {posts.length} POSTS · PHAROS-CURATED · {actor.name.toUpperCase()}
                      </span>
                    </div>
                    {posts.map(p => <XPostCard key={p.id} post={p as XPost} />)}
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {showLeadershipGraph && (
          <TabsContent value="leadership" className={pageScroll ? '' : 'flex-1 min-h-0 overflow-hidden'}>
            <ActorLeadershipGraph actor={actor} pageScroll={pageScroll} />
          </TabsContent>
        )}

        {iso3 && (
          <TabsContent value="military" className={pageScroll ? '' : 'flex-1 min-h-0 overflow-hidden'}>
            <ActorMilitaryTab actor={actor} iso3={iso3} pageScroll={pageScroll} />
          </TabsContent>
        )}
      </IntelTabBar>

    </div>
  );
}
