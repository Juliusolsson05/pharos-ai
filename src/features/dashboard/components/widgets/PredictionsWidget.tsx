'use client';

import { useMemo } from 'react';

import { fmtVol, getLeadProb, probColor, spreadColor, statusLabel } from '@/features/predictions/components/utils';
import { usePredictionMarkets } from '@/features/predictions/queries';

import { assignGroup } from '@/data/prediction-groups';

export function PredictionsWidget() {
  const { data, isLoading, error } = usePredictionMarkets();

  const markets = useMemo(
    () =>
      (data?.markets ?? [])
        .filter(m => m.active && !m.closed)
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 20),
    [data?.markets],
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="mono text-[length:var(--text-label)] text-[var(--t4)] animate-pulse">LOADING MARKETS...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="mono text-[length:var(--text-label)] text-[var(--danger)]">{error.message}</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* column headers */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--bd)] bg-[var(--bg-2)] sticky top-0 z-10">
        <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] w-[52px]">PROB</span>
        <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] flex-1">MARKET</span>
        <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] w-[60px] text-right">VOLUME</span>
        <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] w-11 text-right">24H</span>
        <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] w-10 text-right">SPRD</span>
      </div>

      {markets.map((m, i) => {
        const prob = getLeadProb(m);
        const pct = Math.round(prob * 100);
        const pc = probColor(prob);
        const sc = spreadColor(m.spread);
        const grp = assignGroup(m.title);
        const status = statusLabel(m);
        return (
          <a key={m.id || i} href={m.polyUrl} target="_blank" rel="noopener noreferrer" className="no-underline">
            <div
              className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-3)] transition-colors cursor-pointer"
              style={{ borderBottom: '1px solid var(--bd-s)', borderLeft: `3px solid ${grp.color}` }}
            >
              <div className="shrink-0 w-[52px] flex items-center gap-1">
                <div className="w-[22px] h-1 bg-[var(--bg-3)] overflow-hidden rounded-sm">
                  <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: pc }} />
                </div>
                <span className="mono text-[length:var(--text-body-sm)] font-bold leading-none" style={{ color: pc }}>{pct}%</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[length:var(--text-body-sm)] text-[var(--t1)] leading-snug truncate">{m.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="mono text-[length:var(--text-micro)] font-bold tracking-[0.05em] px-1 py-px"
                    style={{ color: grp.color, background: grp.bg, border: `1px solid ${grp.border}` }}
                  >
                    {grp.label}
                  </span>
                  <span
                    className="mono text-[length:var(--text-micro)] px-1 py-px"
                    style={{ color: status.color, background: status.bg }}
                  >
                    {status.label}
                  </span>
                  {m.subMarkets.length > 1 && (
                    <span className="mono text-[length:var(--text-micro)] text-[var(--t4)]">{m.subMarkets.length} sub</span>
                  )}
                </div>
              </div>
              <div className="shrink-0 w-[60px] text-right">
                <span className="mono text-[length:var(--text-label)] text-[var(--t2)] font-bold">{fmtVol(m.volume)}</span>
              </div>
              <div className="shrink-0 w-11 text-right">
                <span className="mono text-[length:var(--text-caption)] text-[var(--t4)]">{fmtVol(m.volume24hr)}</span>
              </div>
              <div className="shrink-0 w-10 text-right">
                <span className="mono text-[length:var(--text-caption)]" style={{ color: sc }}>{(m.spread * 100).toFixed(1)}¢</span>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
