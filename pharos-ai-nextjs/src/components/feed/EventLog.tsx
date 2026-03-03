'use client';
import { fmtTime } from '@/lib/format';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { IntelEvent } from '@/data/iranEvents';
import { getPostsForEvent } from '@/data/iranXPosts';

const SEV_C: Record<string, string> = {
  CRITICAL: 'var(--danger)', HIGH: 'var(--warning)', STANDARD: 'var(--info)',
};
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

interface Props {
  events: IntelEvent[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function EventLog({ events, selectedId, onSelect }: Props) {
  const grouped = groupByDate(events);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="panel-header justify-between">
        <span className="section-title">Operation Epic Fury</span>
        <Badge variant="outline" className="text-[9px] text-[var(--t4)] border-[var(--bd)]">{events.length}</Badge>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[40px_50px_1fr_24px] px-3 py-1 border-b border-[var(--bd)] bg-[var(--bg-2)] shrink-0">
        {['TIME', 'SEV', 'TITLE', ''].map(h => <span key={h} className="label text-[8px]">{h}</span>)}
      </div>

      <ScrollArea className="flex-1">
        {events.length === 0 && (
          <div className="p-6 text-center">
            <span className="label">No results</span>
          </div>
        )}
        {Object.entries(grouped).map(([date, dayEvents]) => (
          <div key={date}>
            <div className="px-3 py-1 bg-[var(--bg-2)] border-b border-[var(--bd)]">
              <span className="mono text-[9px] text-[var(--t3)]">{date}</span>
            </div>
            {dayEvents.map(evt => {
              const isOn = selectedId === evt.id;
              const sc   = SEV_C[evt.severity] ?? 'var(--info)';
              const sbg  = SEV_BG[evt.severity] ?? 'var(--info-dim)';
              const xc   = getPostsForEvent(evt.id).length;
              return (
                <Button
                  key={evt.id}
                  variant="ghost"
                  onClick={() => onSelect(isOn ? null : evt.id)}
                  className="grid grid-cols-[40px_50px_1fr_24px] gap-0 w-full h-auto px-3 py-1.5 rounded-none justify-start items-start border-b border-[var(--bd-s)]"
                  style={{
                    borderLeft: `3px solid ${isOn ? sc : 'transparent'}`,
                    background: isOn ? 'var(--bg-sel)' : 'transparent',
                  }}
                >
                  <span className="mono text-[9px] text-[var(--t3)] self-center">
                    {fmtTime(evt.timestamp)}
                  </span>

                  <div className="self-center">
                    <Badge
                      variant="outline"
                      className="text-[7px] px-1 py-px tracking-[0.06em] rounded-sm"
                      style={{ color: sc, borderColor: sc, background: sbg }}
                    >
                      {evt.severity.slice(0, 4)}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-[11px] text-[var(--t1)] leading-[1.3] text-left line-clamp-2">
                      {evt.title}
                    </p>
                    <div className="flex gap-1.5 mt-0.5">
                      <span className="mono text-[8px] text-[var(--t3)]">{evt.sources.length}src</span>
                      {xc > 0 && <span className="mono text-[8px] text-[var(--t2)]">𝕏{xc}</span>}
                      {evt.verified && <CheckCircle size={8} className="text-[var(--success)]" strokeWidth={2} />}
                    </div>
                  </div>

                  <ArrowRight size={9} className="text-[var(--t3)] self-center" strokeWidth={1.5} />
                </Button>
              );
            })}
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
