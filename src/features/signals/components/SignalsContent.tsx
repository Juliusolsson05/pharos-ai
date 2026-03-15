'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useXPosts } from '@/features/events/queries/x-posts';
import { SectionHeader } from '@/features/signals/components/SectionHeader';
import { type AccountType, SignalFilterRail, type Significance } from '@/features/signals/components/SignalFilterRail';
import { ListDetailScreenSkeleton } from '@/shared/components/loading/screen-skeletons';
import { EmptyState } from '@/shared/components/shared/EmptyState';
import { XPostCard } from '@/shared/components/shared/XPostCard';

import { track } from '@/shared/lib/analytics';
import { dayLabel, dayShort, getDayFromTimestamp, getPostsForDay } from '@/shared/lib/day-filter';
import { timeAgo } from '@/shared/lib/format';
import { useConflictDay } from '@/shared/hooks/use-conflict-day';
import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useLandscapeScrollEmitter } from '@/shared/hooks/use-landscape-scroll-emitter';
import { usePanelLayout } from '@/shared/hooks/use-panel-layout';

import type { XPost } from '@/types/domain';

export function SignalsContent() {
  const isMobile = useIsMobile(1024);
  const isLandscapePhone = useIsLandscapePhone();
  const usePageScroll = isMobile && isLandscapePhone;
  const onLandscapeScroll = useLandscapeScrollEmitter(usePageScroll);
  const [sigFilter,  setSigFilter]  = useState<Record<Significance, boolean>>({ BREAKING: true, HIGH: true, STANDARD: true });
  const [acctFilter, setAcctFilter] = useState<Record<AccountType, boolean>>({ military: true, government: true, journalist: true, analyst: true, official: true });
  const [pharosOnly, setPharosOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { defaultLayout, onLayoutChanged } = usePanelLayout({ id: 'signals' });
  const { currentDay, setDay, allDays } = useConflictDay();
  const { data: allPosts, isLoading, isError, error, refetch } = useXPosts();
  const [showAll, setShowAll] = useState(true);

  const filtered = useMemo(() => {
    const posts = allPosts ?? [];
    const base = showAll ? posts : getPostsForDay(posts, allDays, currentDay);
    return base.filter(p => {
      if (!sigFilter[p.significance as Significance])       return false;
      if (!acctFilter[p.accountType as AccountType])        return false;
      if (pharosOnly && !p.pharosNote)                      return false;
      if (verifiedOnly && p.verificationStatus !== 'VERIFIED') return false;
      return true;
    });
  }, [sigFilter, acctFilter, pharosOnly, verifiedOnly, currentDay, showAll, allPosts, allDays]);

  const dayGroups = useMemo(() => {
    const grouped = new Map<string, XPost[]>();
    for (const p of filtered) {
      const day = getDayFromTimestamp(p.timestamp, allDays);
      const arr = grouped.get(day);
      if (arr) arr.push(p as XPost);
      else grouped.set(day, [p as XPost]);
    }
    return [...grouped.keys()].sort().reverse().map(day => ({
      day,
      posts: grouped.get(day)!,
    }));
  }, [filtered, allDays]);

  const lastUpdated = useMemo(() => {
    const posts = allPosts ?? [];
    if (posts.length === 0) return '';
    const latest = posts.reduce((max, p) => {
      const ts = Date.parse(p.timestamp);
      return Number.isFinite(ts) && ts > max ? ts : max;
    }, 0);
    if (!latest) return '';
    return timeAgo(new Date(latest).toISOString());
  }, [allPosts]);

  const signalsList = (
    <>
      {dayGroups.map(({ day, posts }) => {
        const breaking = posts.filter(p => p.significance === 'BREAKING');
        const high     = posts.filter(p => p.significance === 'HIGH');
        const standard = posts.filter(p => p.significance === 'STANDARD');
        return (
          <div key={day} className="mb-6">
            {(showAll || dayGroups.length > 1) && (
              <div className="panel-header mb-3 sticky top-0 z-10">
                <span className="section-title">{dayLabel(day, allDays)} — {dayShort(day)}</span>
                <span className="label ml-auto text-[var(--t4)]">{posts.length} signals</span>
              </div>
            )}
            {breaking.length > 0 && (
              <div className="mb-5">
                <SectionHeader label="BREAKING" count={breaking.length} color="var(--danger)" />
                {breaking.map(p => <XPostCard key={p.id} post={p} />)}
              </div>
            )}
            {high.length > 0 && (
              <div className="mb-5">
                <SectionHeader label="HIGH SIGNIFICANCE" count={high.length} color="var(--warning)" />
                {high.map(p => <XPostCard key={p.id} post={p} />)}
              </div>
            )}
            {standard.length > 0 && (
              <div className="mb-5">
                <SectionHeader label="STANDARD" count={standard.length} color="var(--info)" />
                {standard.map(p => <XPostCard key={p.id} post={p} />)}
              </div>
            )}
          </div>
        );
      })}
      {filtered.length === 0 && (
        <div className="p-[60px] text-center">
          <span className="text-2xl text-[var(--t3)]">𝕏</span>
          <p className="label text-[var(--t3)] mt-3">No signals match current filters</p>
        </div>
      )}
    </>
  );

  const filterRail = (
    <SignalFilterRail
      sigFilter={sigFilter}
      acctFilter={acctFilter}
      pharosOnly={pharosOnly}
      verifiedOnly={verifiedOnly}
      totalShown={filtered.length}
      totalAll={allPosts?.length ?? 0}
      lastUpdated={lastUpdated}
      onSigChange={(s, v) => { setSigFilter(p => ({ ...p, [s]: v })); track('signals_filter_changed', { filter: 'significance', value: s, enabled: v }); }}
      onAcctChange={(a, v) => { setAcctFilter(p => ({ ...p, [a]: v })); track('signals_filter_changed', { filter: 'account_type', value: a, enabled: v }); }}
      onPharosOnly={v => { setPharosOnly(v); track('signals_filter_changed', { filter: 'pharos_only', enabled: v }); }}
      onVerifiedOnly={v => { setVerifiedOnly(v); track('signals_filter_changed', { filter: 'verified_only', enabled: v }); }}
      currentDay={currentDay}
      onDayChange={(day) => { setDay(day); setShowAll(false); }}
      showAll={showAll}
      onAllClick={() => setShowAll(true)}
      compact={usePageScroll}
      pageScroll={usePageScroll}
    />
  );

  if (isLoading) return <ListDetailScreenSkeleton />;
  if (isError && error) return <EmptyState variant="error" message="Signals could not be loaded." onRetry={() => { void refetch(); }} />;

  if (isMobile) {
    return (
      <div
        className={`flex flex-col flex-1 min-h-0 min-w-0 ${usePageScroll ? 'overflow-y-auto' : 'overflow-hidden'}`}
        onScroll={usePageScroll ? onLandscapeScroll : undefined}
      >
        {/* Header */}
        <div className={`panel-header shrink-0 ${usePageScroll ? 'h-8 min-h-8 safe-px' : ''}`}>
          <span className="section-title">Field Signals — Operation Epic Fury</span>
          <span className="label ml-auto text-[var(--t4)]">PHAROS-CURATED</span>
        </div>

        {/* Compact filter bar */}
        <div className={`shrink-0 flex items-center gap-2 border-b border-[var(--bd)] bg-[var(--bg-2)] ${usePageScroll ? 'py-1.5 safe-px' : 'px-3 py-[6px]'}`}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen(p => !p)}
            className={`text-[10px] h-auto px-2.5 py-1 font-semibold tracking-wide transition-colors mono ${
              filtersOpen
                ? 'border-[var(--blue)] bg-[var(--blue-dim)] text-[var(--blue-l)]'
                : 'border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t3)]'
            }`}
          >
            FILTERS
          </Button>
          <span className="mono text-[9px] text-[var(--t4)]">{filtered.length} / {allPosts?.length ?? 0} signals</span>
          <span className="mono text-[9px] text-[var(--t4)]">·</span>
          <span className="mono text-[9px] text-[var(--t3)]">{showAll ? 'ALL DAYS' : currentDay}</span>
          {lastUpdated && (
            <>
              <span className="mono text-[9px] text-[var(--t4)]">·</span>
              <span className="mono text-[9px] text-[var(--t3)]">UPDATED {lastUpdated}</span>
            </>
          )}
        </div>

        {/* Collapsible filter rail */}
        {filtersOpen && (
          <div className={`${usePageScroll ? '' : 'max-h-[45%] overflow-y-auto'} border-b border-[var(--bd)] shrink-0`}>
            {filterRail}
          </div>
        )}

        {/* Signals feed */}
        <div className={usePageScroll ? '' : 'flex-1 min-h-0 overflow-y-auto'}>
          <div className={usePageScroll ? 'safe-px py-3' : 'px-3 py-3'}>
            {signalsList}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
      <ResizablePanelGroup orientation="horizontal" defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged} className="flex-1 min-h-0 min-w-0 w-full">
        <ResizablePanel id="filters" defaultSize="22%" minSize="15%" maxSize="35%" className="flex flex-col overflow-hidden min-w-[180px]">
          {filterRail}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel id="content" defaultSize="78%" minSize="50%" className="flex flex-col overflow-hidden min-w-0">
          <div className="panel-header">
            <span className="section-title">Field Signals — Operation Epic Fury</span>
            <span className="label ml-auto text-[var(--t4)]">PHAROS-CURATED</span>
          </div>
          <ScrollArea className="flex-1 min-w-0">
            <div className="px-4 py-3 min-w-0">
              {signalsList}
            </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
