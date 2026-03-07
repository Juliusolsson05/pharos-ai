'use client';

import { useEffect, useState } from 'react';
import type { PredictionMarket, TimePoint, MarketGroup } from '@/types/domain';
import { getLeadProb, probColor, fmtVol, fmtMarketDate, statusLabel } from './utils';
import { ProbChart } from './ProbChart';

type MarketCardProps = {
  market: PredictionMarket;
  group: MarketGroup;
  rank: number;
  onFocus: () => void;
};

export function MarketCard({ market, group, rank, onFocus }: MarketCardProps) {
  const [history, setHistory] = useState<TimePoint[]>([]);
  const [chartLoading, setChartLoading] = useState(() => !!market.yesTokenId);
  const [nowMs] = useState(() => Date.now());

  const prob   = getLeadProb(market);
  const pColor = probColor(prob);
  const status = statusLabel(market);

  const daysLeft = market.endDate
    ? Math.max(0, Math.floor((new Date(market.endDate).getTime() - nowMs) / 86_400_000))
    : null;

  // Lazy-load 7-day history
  useEffect(() => {
    if (!market.yesTokenId) return;
    let cancelled = false;
    fetch(`/api/v1/predictions/history?tokenId=${encodeURIComponent(market.yesTokenId)}&range=7d`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setHistory(d.history ?? []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setChartLoading(false); });
    return () => { cancelled = true; };
  }, [market.yesTokenId]);

  return (
    <div
      onClick={onFocus}
      className="group flex flex-col overflow-hidden bg-[var(--bg-1)] border border-[var(--bd)] hover:border-white/20 hover:bg-[var(--bg-2)] transition-all duration-150 cursor-pointer"
    >
      {/* Group color accent */}
      <div className="h-[2px] w-full shrink-0" style={{ backgroundColor: group.color }} />

      {/* Header */}
      <div className="flex items-start gap-2 px-3 pt-2.5 pb-0">
        <span className="mono text-[9px] text-[var(--t4)] shrink-0 mt-[1px]">#{rank}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className="mono text-[7px] font-bold px-[5px] py-[1.5px] tracking-wider shrink-0"
              style={{ color: group.color, background: group.bg, border: `1px solid ${group.border}` }}
            >
              {group.label}
            </span>
            <span
              className="mono text-[7px] font-bold px-[5px] py-[1.5px] tracking-wider shrink-0"
              style={{ color: status.color, background: status.bg, border: `1px solid ${status.border}` }}
            >
              {status.label}
            </span>
            {market.competitive > 0.7 && (
              <span className="mono text-[7px] font-bold px-[5px] py-[1.5px] tracking-wider text-amber-300 bg-amber-400/10 border border-amber-400/25">
                HOT
              </span>
            )}
          </div>
          <h3 className="text-[11px] font-medium text-[var(--t1)] leading-snug line-clamp-2 group-hover:text-white transition-colors">
            {market.title}
          </h3>
        </div>
      </div>

      {/* Probability */}
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <span className="mono text-[28px] font-bold leading-none" style={{ color: pColor }}>
          {(prob * 100).toFixed(1)}%
        </span>
        <div className="text-right">
          <div className="mono text-[10px] font-bold" style={{ color: pColor }}>YES</div>
          <div className="mono text-[10px] text-[var(--t4)]">{((1 - prob) * 100).toFixed(1)}% NO</div>
        </div>
      </div>

      {/* Probability history chart */}
      <div className="w-full">
        {chartLoading ? (
          <div className="h-[70px] flex items-center justify-center">
            <div className="w-3.5 h-3.5 border-[1.5px] border-white/10 border-t-white/30 rounded-full animate-spin" />
          </div>
        ) : history.length > 2 ? (
          <ProbChart data={history} color={group.color} height={70} />
        ) : (
          <div className="h-[70px] flex items-center justify-center">
            <span className="mono text-[8px] text-[var(--t4)]">NO HISTORY</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-0 px-3 py-2 border-t border-[var(--bd)]">
        <div className="flex-1">
          <div className="mono text-[7px] text-[var(--t4)] tracking-widest">VOL</div>
          <div className="mono text-[10px] font-bold text-[var(--t2)]">{fmtVol(market.volume)}</div>
        </div>
        <div className="w-px h-5 bg-[var(--bd)] mx-2" />
        <div className="flex-1">
          <div className="mono text-[7px] text-[var(--t4)] tracking-widest">24H</div>
          <div className="mono text-[10px] font-bold" style={{ color: market.volume24hr > 0 ? 'var(--success)' : 'var(--t4)' }}>
            {fmtVol(market.volume24hr)}
          </div>
        </div>
        <div className="w-px h-5 bg-[var(--bd)] mx-2" />
        <div className="flex-1">
          <div className="mono text-[7px] text-[var(--t4)] tracking-widest">SPREAD</div>
          <div
            className="mono text-[10px] font-bold"
            style={{ color: market.spread < 0.02 ? 'var(--success)' : market.spread < 0.07 ? 'var(--warning)' : 'var(--danger)' }}
          >
            {(market.spread * 100).toFixed(1)}¢
          </div>
        </div>
        <div className="w-px h-5 bg-[var(--bd)] mx-2" />
        <div className="flex-1 text-right">
          <div className="mono text-[7px] text-[var(--t4)] tracking-widest">ENDS</div>
          <div className="mono text-[10px] font-bold text-[var(--t2)]">
            {daysLeft !== null ? (daysLeft === 0 ? 'TODAY' : `${daysLeft}d`) : fmtMarketDate(market.endDate)}
          </div>
        </div>
      </div>

      {/* Expand hint */}
      <div className="h-[18px] flex items-center justify-center border-t border-[var(--bd)] opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="mono text-[7px] text-[var(--t4)] tracking-widest">⊞ EXPAND</span>
      </div>
    </div>
  );
}
