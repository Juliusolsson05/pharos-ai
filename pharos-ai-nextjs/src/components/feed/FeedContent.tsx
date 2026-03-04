'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileText, ArrowLeft } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { usePanelLayout } from '@/hooks/use-panel-layout';
import { useConflictDay } from '@/hooks/use-conflict-day';
import { useIsMobile } from '@/hooks/use-is-mobile';
import type { Severity, EventType } from '@/types/domain';
import { useEvents } from '@/api/events';
import { FeedFilterRail, ALL_TYPES } from '@/components/feed/FeedFilterRail';
import { EventLog } from '@/components/feed/EventLog';
import { EventDetail } from '@/components/feed/EventDetail';
import { EmptyState } from '@/components/shared/EmptyState';
import { getEventsForDay } from '@/lib/day-filter';

export function FeedContent() {
  const searchParams = useSearchParams();
  const initEvent    = searchParams.get('event');
  const isMobile = useIsMobile(1024);
  const { currentDay, setDay, allDays } = useConflictDay();
  const { data: allEvents } = useEvents();
  const [showAllDays, setShowAllDays] = useState(true);

  const [sevFilter,  setSevFilter]  = useState<Record<Severity, boolean>>({ CRITICAL: true, HIGH: true, STANDARD: true });
  const [typeFilter, setTypeFilter] = useState<Record<EventType, boolean>>(
    Object.fromEntries(ALL_TYPES.map(t => [t, true])) as Record<EventType, boolean>,
  );
  const [verOnly, setVerOnly] = useState(false);
  const [selId,   setSelId]   = useState<string | null>(() => initEvent);
  const [tab,     setTab]     = useState<'report' | 'signals'>('report');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { defaultLayout, onLayoutChanged } = usePanelLayout({ id: 'feed', panelIds: ['filters', 'log', 'detail'] });

  const filtered = useMemo(() => {
    const events = allEvents ?? [];
    const base = showAllDays ? events : getEventsForDay(events, allDays, currentDay);
    return base.filter(e => {
      if (!sevFilter[e.severity]) return false;
      if (!typeFilter[e.type])    return false;
      if (verOnly && !e.verified) return false;
      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [sevFilter, typeFilter, verOnly, currentDay, showAllDays, allEvents, allDays]);

  const selected = allEvents?.find(e => e.id === selId) ?? null;

  if (isMobile) {
    return (
      <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
        {selected ? (
          <>
            <div className="panel-header">
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
            <EventDetail event={selected} tab={tab} onTabChange={setTab} />
          </>
        ) : (
          <>
            {/* Compact filter bar */}
            <div className="shrink-0 flex items-center gap-2 px-3 py-[6px] border-b border-[var(--bd)] bg-[var(--bg-2)]">
              <button
                onClick={() => setFiltersOpen(p => !p)}
                className={`text-[10px] px-[10px] py-[4px] border font-semibold tracking-wide transition-colors mono ${
                  filtersOpen
                    ? 'border-[var(--blue)] bg-[var(--blue-dim)] text-[var(--blue-l)]'
                    : 'border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t3)]'
                }`}
              >
                FILTERS
              </button>
              <span className="mono text-[9px] text-[var(--t4)]">{filtered.length} events</span>
              <span className="mono text-[9px] text-[var(--t4)]">·</span>
              <span className="mono text-[9px] text-[var(--t3)]">{showAllDays ? 'ALL DAYS' : `DAY ${currentDay}`}</span>
            </div>

            {/* Collapsible filter rail */}
            {filtersOpen && (
              <div className="max-h-[45%] overflow-y-auto border-b border-[var(--bd)]">
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
              </div>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto">
              <EventLog
                events={filtered}
                selectedId={selId}
                onSelect={id => { setSelId(id); if (id) setTab('report'); }}
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
