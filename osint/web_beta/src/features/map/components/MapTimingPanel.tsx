'use client';

import type { FetchTiming } from '@/features/map/hooks/use-osint-data';

type Props = {
  totalMs: number;
  providers: FetchTiming[];
  isLoading: boolean;
};

function bar(ms: number, maxMs: number) {
  const pct = maxMs > 0 ? Math.min(100, (ms / maxMs) * 100) : 0;
  return pct;
}

function color(ms: number) {
  if (ms >= 2000) return 'var(--danger)';
  if (ms >= 800) return 'var(--warning)';
  if (ms >= 300) return 'var(--info)';
  return 'var(--success)';
}

export function MapTimingPanel({ totalMs, providers, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="timing-panel">
        <div className="timing-header">TIMING</div>
        <div className="timing-loading">Loading...</div>
      </div>
    );
  }

  const maxMs = Math.max(...providers.map((p) => p.ms), 1);

  return (
    <div className="timing-panel">
      <div className="timing-header">
        <span>TIMING</span>
        <span className="timing-total">{totalMs.toLocaleString()}ms</span>
      </div>
      {providers.map((p) => (
        <div key={p.name} className="timing-row">
          <span className="timing-name">{p.name}</span>
          <div className="timing-bar-track">
            <div
              className="timing-bar-fill"
              style={{ width: `${bar(p.ms, maxMs)}%`, background: color(p.ms) }}
            />
          </div>
          <span className="timing-ms" style={{ color: color(p.ms) }}>{p.ms}ms</span>
          <span className="timing-count">{p.count}</span>
        </div>
      ))}
    </div>
  );
}
