'use client';
import { CheckCircle } from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';

import { EventReportContent, MetaChip } from '@/features/events/components/EventReportContent';
import { EventSignalsContent } from '@/features/events/components/EventSignalsContent';
import { useXPostsByEvent } from '@/features/events/queries/x-posts';
import { IntelTabBar, TabsContent } from '@/shared/components/shared/IntelTabs';

import { SEV_C } from '@/shared/lib/severity-colors';
import { cn } from '@/shared/lib/utils';

import type { IntelEvent } from '@/types/domain';

type Props = {
  event: IntelEvent;
  tab: 'report' | 'signals';
  onTabChange: (t: 'report' | 'signals') => void;
  compact?: boolean;
  pageScroll?: boolean;
};

export function EventDetail({ event, tab, onTabChange, compact = false, pageScroll = false }: Props) {
  const sc     = SEV_C[event.severity] ?? 'var(--info)';
  const { data: xPosts = [] } = useXPostsByEvent(undefined, event.id);

  const tabs = [
    { value: 'report'  as const, label: 'INTEL REPORT' },
    { value: 'signals' as const, label: `𝕏 SIGNALS${xPosts.length > 0 ? ` (${xPosts.length})` : ''}` },
  ];

  return (
    <div className={cn(pageScroll ? 'flex flex-col' : 'flex-1 flex flex-col overflow-hidden')}>
      {/* Header */}
      <div className={cn('border-b border-[var(--bd)] bg-[var(--bg-2)] shrink-0', compact ? (pageScroll ? 'safe-px py-2' : 'px-3 py-2') : 'px-5 py-2.5')}>
        <div className="flex gap-2 mb-2 flex-wrap items-center">
          <div
            className="flex items-center gap-[5px] px-2 py-0.5"
            style={{ border: `1px solid ${sc}`, background: sc + '18' }}
          >
            <div className="w-[5px] h-[5px] rounded-full" style={{ background: sc }} />
            <span className="text-[length:var(--text-caption)] font-bold tracking-[0.08em]" style={{ color: sc }}>
              {event.severity}
            </span>
          </div>
          <span className="label text-[length:var(--text-tiny)] text-[var(--t3)]">{event.type}</span>
          {event.verified && (
            <div className="flex items-center gap-[3px]">
              <CheckCircle size={9} className="text-[var(--success)]" strokeWidth={2} />
              <span className="label text-[length:var(--text-tiny)] text-[var(--success)]">VERIFIED</span>
            </div>
          )}
        </div>
        <h1 className={cn('font-bold text-[var(--t1)] leading-[1.25] mb-2', compact ? 'text-[length:var(--text-body)]' : 'text-[length:var(--text-subhead)]')}>
          {event.title}
        </h1>
        <div className="flex gap-5">
          <MetaChip label="TIMESTAMP"
            val={new Date(event.timestamp).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'} />
          <MetaChip label="LOCATION" val={event.location} />
          <MetaChip label="SOURCES"  val={String(event.sources.length)} />
        </div>
      </div>

      {/* Tabs */}
      <IntelTabBar value={tab} onValueChange={onTabChange} tabs={tabs} compact={compact} safeEdges={pageScroll}>
        <TabsContent value="report" className={pageScroll ? '' : 'flex-1 min-h-0 overflow-hidden'}>
          {pageScroll ? (
            <EventReportContent event={event} compact={compact} pageScroll={pageScroll} />
          ) : (
            <ScrollArea className="h-full">
              <EventReportContent event={event} compact={compact} pageScroll={pageScroll} />
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="signals" className={pageScroll ? '' : 'flex-1 min-h-0 overflow-hidden'}>
          {pageScroll ? (
            <EventSignalsContent xPosts={xPosts} compact={compact} pageScroll={pageScroll} />
          ) : (
            <ScrollArea className="h-full">
              <EventSignalsContent xPosts={xPosts} compact={compact} pageScroll={pageScroll} />
            </ScrollArea>
          )}
        </TabsContent>
      </IntelTabBar>
    </div>
  );
}
