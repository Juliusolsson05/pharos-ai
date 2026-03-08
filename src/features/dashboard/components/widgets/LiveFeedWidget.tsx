'use client';

import { useEngineStream, useStreamRecent, type StreamEvent } from '@/features/dashboard/queries/engine';

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  NewCluster:    { label: 'NEW CLUSTER',  color: 'var(--blue)',    icon: '◆' },
  ClusterUpdate: { label: 'UPDATE',       color: 'var(--teal)',    icon: '●' },
  Anomaly:       { label: 'ANOMALY',      color: 'var(--warning)', icon: '▲' },
  ThreatChange:  { label: 'THREAT',       color: 'var(--danger)',  icon: '◈' },
  Escalation:    { label: 'ESCALATION',   color: 'var(--danger)',  icon: '↑' },
  Flash:         { label: 'FLASH',        color: 'var(--danger)',  icon: '⚡' },
  Contradiction: { label: 'CONFLICT',     color: 'var(--warning)', icon: '⊘' },
  ChainLink:     { label: 'CHAIN',        color: 'var(--info)',    icon: '→' },
};

const SEV_COLORS: Record<string, string> = {
  CRITICAL: 'var(--danger)',
  HIGH:     'var(--warning)',
  STANDARD: 'var(--t3)',
};

function timeStr(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '--:--:--';
  }
}

function EventRow({ event }: { event: StreamEvent }) {
  const config = TYPE_CONFIG[event.type] ?? { label: event.type, color: 'var(--t3)', icon: '·' };
  const sevColor = SEV_COLORS[event.severity] ?? 'var(--t3)';

  return (
    <div className="flex items-start gap-2 px-2.5 py-1.5 border-b border-[var(--bd)] hover:bg-[var(--bg-2)] transition-colors">
      {/* Type icon */}
      <span
        className="mono text-[11px] mt-px shrink-0"
        style={{ color: config.color }}
        title={config.label}
      >
        {config.icon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="mono text-[7px] font-bold tracking-[0.08em] px-1 py-px shrink-0"
            style={{ color: config.color, backgroundColor: `color-mix(in srgb, ${config.color} 12%, transparent)` }}
          >
            {config.label}
          </span>
          <span
            className="mono text-[7px] font-bold px-1 py-px shrink-0"
            style={{ color: sevColor, backgroundColor: `color-mix(in srgb, ${sevColor} 12%, transparent)` }}
          >
            {event.severity}
          </span>
          <span className="mono text-[8px] text-[var(--t4)] ml-auto shrink-0">
            {timeStr(event.timestamp)}
          </span>
        </div>
        <p className="text-[11px] text-[var(--t1)] leading-snug mt-0.5 truncate">
          {event.title}
        </p>
      </div>
    </div>
  );
}

export function LiveFeedWidget() {
  const { connected, events: liveEvents } = useEngineStream();
  const { data: recentData } = useStreamRecent();

  // Merge live SSE events with recent history, dedup by ID
  const recent = recentData?.events ?? [];
  const seen = new Set<string>();
  const allEvents: StreamEvent[] = [];
  for (const e of [...liveEvents, ...recent]) {
    if (!seen.has(e.id)) {
      seen.add(e.id);
      allEvents.push(e);
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--bd)] shrink-0">
        <span className="label text-[8px] text-[var(--t4)]">PHAROS ENGINE // LIVE FEED</span>
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: connected ? 'var(--success)' : 'var(--danger)',
              animation: connected ? 'pulse 2s infinite' : undefined,
            }}
          />
          <span className="mono text-[8px]" style={{ color: connected ? 'var(--success)' : 'var(--danger)' }}>
            {connected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
          <span className="mono text-[8px] text-[var(--t4)]">
            · {allEvents.length} events
          </span>
        </div>
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {allEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="mono text-[10px] text-[var(--t4)]">
              {connected ? 'AWAITING EVENTS...' : 'CONNECTING TO ENGINE...'}
            </span>
          </div>
        ) : (
          allEvents.map((event) => (
            <EventRow key={event.id} event={event} />
          ))
        )}
      </div>
    </div>
  );
}
