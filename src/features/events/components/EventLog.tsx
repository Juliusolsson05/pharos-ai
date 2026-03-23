'use client';
import { useMemo, useState } from 'react';

import { ArrowRight, CheckCircle, ChevronDown,ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useXPosts } from '@/features/events/queries/x-posts';

import { fmtTime } from '@/shared/lib/format';
import { SEV_C } from '@/shared/lib/severity-colors';
import { cn } from '@/shared/lib/utils';

import type { IntelEvent } from '@/types/domain';
const SEV_BG: Record<string, string> = {
  CRITICAL: 'var(--danger-dim)', HIGH: 'var(--warning-dim)', STANDARD: 'var(--info-dim)',
};

function groupByDate(events: IntelEvent[]) {
  const groups: Record<string, IntelEvent[]> = {};
  events.forEach(e => {
    const d = new Date(e.timestamp).toISOString().slice(0, 10);
    if (!groups[d]) groups[d] = [];
    groups[d].push(e);
  });
  return groups;
}

type Props = {
  events: IntelEvent[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  compact?: boolean;
  pageScroll?: boolean;
};

export function EventLog({ events, selectedId, onSelect, compact = false, pageScroll = false }: Props) {
  const { data: allPosts } = useXPosts();

  const eventPostCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of allPosts ?? []) {
      if (p.eventId) map.set(p.eventId, (map.get(p.eventId) ?? 0) + 1);
    }
    return map;
  }, [allPosts]);

  const grouped = groupByDate(events);
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const latestDate = sortedDates[0] ?? '';

  const [expandedDates, setExpandedDates] = useState<Set<string>>(() => new Set(latestDate ? [latestDate] : []));

  const toggleDate = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  return (
    <div className={cn(pageScroll ? 'flex flex-col' : 'flex-1 flex flex-col overflow-hidden')}>
      <div className={cn('panel-header justify-between', compact && (pageScroll ? 'h-8 min-h-8 safe-px' : 'h-8 min-h-8 px-3'))}>
        <span className="section-title">Operation Epic Fury</span>
        <Badge variant="outline" className="text-[length:var(--text-caption)] text-[var(--t4)] border-[var(--bd)]">{events.length}</Badge>
      </div>

      {/* Column headers */}
      <div className={cn('grid grid-cols-[40px_50px_1fr_24px] py-1 border-b border-[var(--bd)] bg-[var(--bg-2)] shrink-0', pageScroll ? 'safe-px' : 'px-3', compact && 'py-0.5')}>
        {['TIME', 'SEV', 'TITLE', ''].map(h => <span key={h} className="label text-[length:var(--text-tiny)]">{h}</span>)}
      </div>

      {pageScroll ? (
        <div>
          {events.length === 0 && (
            <div className="p-6 text-center">
              <span className="label">No results</span>
            </div>
          )}
          {sortedDates.map(date => {
            const dayEvents = grouped[date];
            const isExpanded = expandedDates.has(date);
            const critCount = dayEvents.filter(e => e.severity === 'CRITICAL').length;
            const highCount = dayEvents.filter(e => e.severity === 'HIGH').length;
            return (
            <div key={date}>
              <Button
                variant="ghost"
                onClick={() => toggleDate(date)}
                className={cn('w-full flex items-center gap-2 h-auto py-1.5 rounded-none bg-[var(--bg-2)] border-b border-[var(--bd)] hover:bg-[var(--bg-3)] transition-colors justify-start', pageScroll ? 'safe-px' : 'px-3')}
              >
                {isExpanded
                  ? <ChevronDown size={10} strokeWidth={2} className="text-[var(--t4)] shrink-0" />
                  : <ChevronRight size={10} strokeWidth={2} className="text-[var(--t4)] shrink-0" />
                }
                <span className="mono text-[length:var(--text-caption)] text-[var(--t3)]">{date}</span>
                <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)]">{dayEvents.length} events</span>
                {critCount > 0 && <span className="mono text-[length:var(--text-tiny)] text-[var(--danger)]">{critCount} CRIT</span>}
                {highCount > 0 && <span className="mono text-[length:var(--text-tiny)] text-[var(--warning)]">{highCount} HIGH</span>}
              </Button>
              {isExpanded && dayEvents.map(evt => {
                const isOn = selectedId === evt.id;
                const sc   = SEV_C[evt.severity] ?? 'var(--info)';
                const sbg  = SEV_BG[evt.severity] ?? 'var(--info-dim)';
                const xc   = eventPostCounts.get(evt.id) ?? 0;
                return (
                  <Button
                    key={evt.id}
                    variant="ghost"
                    onClick={() => onSelect(isOn ? null : evt.id)}
                    className={cn(
                      'grid grid-cols-[40px_50px_1fr_24px] gap-0 w-full h-auto rounded-none justify-start items-start border-b border-[var(--bd-s)] whitespace-normal',
                      pageScroll ? 'safe-px' : 'px-3',
                      compact ? 'py-1' : 'py-1.5',
                    )}
                    style={{
                      borderLeft: `3px solid ${isOn ? sc : 'transparent'}`,
                      background: isOn ? 'var(--bg-sel)' : 'transparent',
                    }}
                  >
                    <span className="mono text-[length:var(--text-caption)] text-[var(--t3)] self-center">
                      {fmtTime(evt.timestamp)}
                    </span>

                    <div className="self-center">
                      <Badge
                        variant="outline"
                        className="text-[length:var(--text-micro)] px-1 py-px tracking-[0.06em] rounded-sm"
                        style={{ color: sc, borderColor: sc, background: sbg }}
                      >
                        {evt.severity.slice(0, 4)}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-[length:var(--text-body-sm)] text-[var(--t1)] leading-[1.3] text-left line-clamp-2">
                        {evt.title}
                      </p>
                      <div className="flex gap-1.5 mt-0.5">
                        <span className="mono text-[length:var(--text-tiny)] text-[var(--t3)]">{evt.sources.length}src</span>
                        {xc > 0 && <span className="mono text-[length:var(--text-tiny)] text-[var(--t2)]">𝕏{xc}</span>}
                        {evt.verified && <CheckCircle size={8} className="text-[var(--success)]" strokeWidth={2} />}
                      </div>
                    </div>

                    <ArrowRight size={9} className="text-[var(--t3)] self-center" strokeWidth={1.5} />
                  </Button>
                );
              })}
            </div>
            );
          })}
        </div>
      ) : (
        <ScrollArea className="flex-1">
          {events.length === 0 && (
            <div className="p-6 text-center">
              <span className="label">No results</span>
            </div>
          )}
          {sortedDates.map(date => {
            const dayEvents = grouped[date];
            const isExpanded = expandedDates.has(date);
            const critCount = dayEvents.filter(e => e.severity === 'CRITICAL').length;
            const highCount = dayEvents.filter(e => e.severity === 'HIGH').length;
            return (
            <div key={date}>
              <Button
                variant="ghost"
                onClick={() => toggleDate(date)}
                className={cn('w-full flex items-center gap-2 h-auto py-1.5 rounded-none bg-[var(--bg-2)] border-b border-[var(--bd)] hover:bg-[var(--bg-3)] transition-colors justify-start', pageScroll ? 'safe-px' : 'px-3')}
              >
                {isExpanded
                  ? <ChevronDown size={10} strokeWidth={2} className="text-[var(--t4)] shrink-0" />
                  : <ChevronRight size={10} strokeWidth={2} className="text-[var(--t4)] shrink-0" />
                }
                <span className="mono text-[length:var(--text-caption)] text-[var(--t3)]">{date}</span>
                <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)]">{dayEvents.length} events</span>
                {critCount > 0 && <span className="mono text-[length:var(--text-tiny)] text-[var(--danger)]">{critCount} CRIT</span>}
                {highCount > 0 && <span className="mono text-[length:var(--text-tiny)] text-[var(--warning)]">{highCount} HIGH</span>}
              </Button>
              {isExpanded && dayEvents.map(evt => {
                const isOn = selectedId === evt.id;
                const sc   = SEV_C[evt.severity] ?? 'var(--info)';
                const sbg  = SEV_BG[evt.severity] ?? 'var(--info-dim)';
                const xc   = eventPostCounts.get(evt.id) ?? 0;
                return (
                  <Button
                    key={evt.id}
                    variant="ghost"
                    onClick={() => onSelect(isOn ? null : evt.id)}
                    className={cn(
                      'grid grid-cols-[40px_50px_1fr_24px] gap-0 w-full h-auto rounded-none justify-start items-start border-b border-[var(--bd-s)] whitespace-normal',
                      pageScroll ? 'safe-px' : 'px-3',
                      compact ? 'py-1' : 'py-1.5',
                    )}
                    style={{
                      borderLeft: `3px solid ${isOn ? sc : 'transparent'}`,
                      background: isOn ? 'var(--bg-sel)' : 'transparent',
                    }}
                  >
                    <span className="mono text-[length:var(--text-caption)] text-[var(--t3)] self-center">
                      {fmtTime(evt.timestamp)}
                    </span>

                    <div className="self-center">
                      <Badge
                        variant="outline"
                        className="text-[length:var(--text-micro)] px-1 py-px tracking-[0.06em] rounded-sm"
                        style={{ color: sc, borderColor: sc, background: sbg }}
                      >
                        {evt.severity.slice(0, 4)}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-[length:var(--text-body-sm)] text-[var(--t1)] leading-[1.3] text-left line-clamp-2">
                        {evt.title}
                      </p>
                      <div className="flex gap-1.5 mt-0.5">
                        <span className="mono text-[length:var(--text-tiny)] text-[var(--t3)]">{evt.sources.length}src</span>
                        {xc > 0 && <span className="mono text-[length:var(--text-tiny)] text-[var(--t2)]">𝕏{xc}</span>}
                        {evt.verified && <CheckCircle size={8} className="text-[var(--success)]" strokeWidth={2} />}
                      </div>
                    </div>

                    <ArrowRight size={9} className="text-[var(--t3)] self-center" strokeWidth={1.5} />
                  </Button>
                );
              })}
            </div>
            );
          })}
        </ScrollArea>
      )}
    </div>
  );
}
