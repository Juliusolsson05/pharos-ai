'use client';

import { useState, useMemo } from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { usePanelLayout } from '@/hooks/use-panel-layout';
import { useConflictDay } from '@/hooks/use-conflict-day';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useIsLandscapePhone } from '@/hooks/use-is-landscape-phone';
import { useLandscapeScrollEmitter } from '@/hooks/use-landscape-scroll-emitter';
import type { Severity, EventType } from '@/types/domain';
import { useEvent, useEvents } from '@/features/events/queries';
import { FeedFilterRail, ALL_TYPES } from '@/features/events/components/FeedFilterRail';
import { EventLog } from '@/features/events/components/EventLog';
import { EventDetail } from '@/features/events/components/EventDetail';
import { EmptyState } from '@/shared/components/shared/EmptyState';
import { ListDetailScreenSkeleton } from '@/shared/components/loading/screen-skeletons';

export function FeedContent() {
  const initEvent = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('event');
  }, []);
  const isMobile = useIsMobile(1024);
  const isLandscapePhone = useIsLandscapePhone();
  const usePageScroll = isMobile && isLandscapePhone;
  const onLandscapeScroll = useLandscapeScrollEmitter(usePageScroll);
  const { currentDay, setDay } = useConflictDay();
  const [showAllDays, setShowAllDays] = useState(true);
  const { data: allEvents, isLoading } = useEvents(undefined, showAllDays ? undefined : { day: currentDay });

  const [sevFilter,  setSevFilter]  = useState<Record<Severity, boolean>>({ CRITICAL: true, HIGH: true, STANDARD: true });
  const [typeFilter, setTypeFilter] = useState<Record<EventType, boolean>>(
    Object.fromEntries(ALL_TYPES.map(t => [t, true])) as Record<EventType, boolean>,
  );
  const [verOnly, setVerOnly] = useState(false);
  const [selId,   setSelId]   = useState<string | null>(() => initEvent);
  const [tab,     setTab]     = useState<'report' | 'signals'>('report');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { defaultLayout, onLayoutChanged } = usePanelLayout({ id: 'feed', panelIds: ['filters', 'log', 'detail'] });
  const { data: selectedEvent } = useEvent(undefined, selId ?? undefined);

  const filtered = useMemo(() => {
    const events = allEvents ?? [];
    return events.filter(e => {
      if (!sevFilter[e.severity]) return false;
      if (!typeFilter[e.type])    return false;
      if (verOnly && !e.verified) return false;
      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [sevFilter, typeFilter, verOnly, allEvents]);

  const selected = selectedEvent ?? allEvents?.find(e => e.id === selId) ?? null;

  if (isLoading) return <ListDetailScreenSkeleton />;

  if (isMobile) {
    return (
      <div
        className={`flex flex-col flex-1 min-h-0 min-w-0 ${usePageScroll ? 'overflow-y-auto' : 'overflow-hidden'}`}
        onScroll={usePageScroll ? onLandscapeScroll : undefined}
      >
        {selected ? (
          <>
            <div className={`panel-header ${usePageScroll ? 'h-8 min-h-8 safe-px' : ''}`}>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setSelId(null)}
                className="mono h-7 px-2 text-[9px] font-bold tracking-[0.06em]"
              >
                <ArrowLeft size={12} />
                BACK TO FEED
              </Button>
            </div>
            <EventDetail event={selected} tab={tab} onTabChange={setTab} compact={usePageScroll} pageScroll={usePageScroll} />
          </>
        ) : (
          <>
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
              <span className="mono text-[9px] text-[var(--t4)]">{filtered.length} events</span>
              <span className="mono text-[9px] text-[var(--t4)]">·</span>
              <span className="mono text-[9px] text-[var(--t3)]">{showAllDays ? 'ALL DAYS' : `DAY ${currentDay}`}</span>
            </div>

            {/* Collapsible filter rail */}
            {filtersOpen && (
              <div className={`${usePageScroll ? '' : 'max-h-[45%] overflow-y-auto'} border-b border-[var(--bd)]`}>
                <FeedFilterRail
                  sevFilter={sevFilter}
                  typeFilter={typeFilter}
                  verOnly={verOnly}
                  totalFiltered={filtered.length}
                  onSevChange={(s, v) => setSevFilter(p => ({ ...p, [s]: v }))}
                  onTypeChange={(t, v) => setTypeFilter(p => ({ ...p, [t]: v }))}
                  onVerChange={setVerOnly}
                  currentDay={currentDay}
                  onDayChange={(day) => { setDay(day); setShowAllDays(false); }}
                  showAll={showAllDays}
                  onAllClick={() => setShowAllDays(true)}
                  compact={usePageScroll}
                  pageScroll={usePageScroll}
                />
              </div>
            )}

            <div className={usePageScroll ? '' : 'flex-1 min-h-0 overflow-y-auto'}>
              <EventLog
                events={filtered}
                selectedId={selId}
                onSelect={id => { setSelId(id); if (id) setTab('report'); }}
                compact={usePageScroll}
                pageScroll={usePageScroll}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
      <ResizablePanelGroup orientation="horizontal" defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged} className="flex-1 min-h-0 min-w-0 w-full">
      <ResizablePanel id="filters" defaultSize="15%" minSize="10%" maxSize="25%" className="flex flex-col overflow-hidden min-w-[220px]">
        <FeedFilterRail
          sevFilter={sevFilter}
          typeFilter={typeFilter}
          verOnly={verOnly}
          totalFiltered={filtered.length}
          onSevChange={(s, v) => setSevFilter(p => ({ ...p, [s]: v }))}
          onTypeChange={(t, v) => setTypeFilter(p => ({ ...p, [t]: v }))}
          onVerChange={setVerOnly}
          currentDay={currentDay}
          onDayChange={(day) => { setDay(day); setShowAllDays(false); }}
          showAll={showAllDays}
          onAllClick={() => setShowAllDays(true)}
        />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel id="log" defaultSize="30%" minSize="20%" maxSize="45%" className="flex flex-col overflow-hidden min-w-[320px]">
        <EventLog
          events={filtered}
          selectedId={selId}
          onSelect={id => { setSelId(id); if (id) setTab('report'); }}
        />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel id="detail" defaultSize="55%" minSize="30%" className="flex flex-col overflow-hidden min-w-0">
        {selected
          ? <EventDetail event={selected} tab={tab} onTabChange={setTab} />
          : <EmptyState icon={FileText} message="Select an event" />
        }
      </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
