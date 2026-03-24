'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

import { usePredictionHistory } from '@/features/predictions/queries';

import type { MarketGroup,PredictionMarket } from '@/types/domain';

import { ProbChart } from './ProbChart';
import { fmtMarketDate, fmtVol, getLeadProb, probColor, spreadColor,statusLabel } from './utils';

const RANGES = [
  { key: '1d',  label: '1D'  },
  { key: '7d',  label: '7D'  },
  { key: '1mo', label: '1M'  },
  { key: '3mo', label: '3M'  },
  { key: 'max', label: 'ALL' },
] as const;

type Props = {
  market: PredictionMarket;
  group: MarketGroup;
  onClose: () => void;
};

export function FocusedMarket({ market, group, onClose }: Props) {
  const [open,         setOpen]         = useState(false);
  const [rangeIdx,     setRangeIdx]     = useState(1); // default 7D
  const [crosshairPct, setCrosshairPct] = useState<number | null>(null);
  const [nowMs]                         = useState(() => Date.now());

  const range = RANGES[rangeIdx].key;
  const { data: historyData, isLoading: chartLoading } = usePredictionHistory(market.yesTokenId ?? '', range);
  const history = historyData?.history ?? [];

  const prob   = getLeadProb(market);
  const pColor = probColor(prob);
  const status = statusLabel(market);

  const daysLeft = market.endDate
    ? Math.max(0, Math.floor((new Date(market.endDate).getTime() - nowMs) / 86_400_000))
    : null;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setTimeout(onClose, 280);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  // Sort sub-markets by volume desc
  const subs = [...market.subMarkets].sort((a, b) => b.volume - a.volume);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          opacity: open ? 1 : 0,
        }}
        onClick={handleClose}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-[900px] flex flex-col bg-[var(--bg-1)] border border-[var(--bd)] overflow-hidden"
        style={{
          borderRadius: '2px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
          maxHeight: 'calc(100vh - 80px)',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
          transition: 'opacity 280ms cubic-bezier(0.22,1,0.36,1), transform 280ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* Group accent bar */}
        <div className="h-[3px] w-full shrink-0" style={{ backgroundColor: group.color }} />

        {/* Header */}
        <div className="flex items-start gap-4 px-5 py-4 border-b border-[var(--bd)] shrink-0">
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="mono text-[length:var(--text-micro)] font-bold px-[5px] py-[2px] tracking-wider"
                style={{ color: group.color, background: group.bg, border: `1px solid ${group.border}` }}
              >
                {group.label}
              </span>
              <span
                className="mono text-[length:var(--text-micro)] font-bold px-[5px] py-[2px] tracking-wider"
                style={{ color: status.color, background: status.bg, border: `1px solid ${status.border}` }}
              >
                {status.label}
              </span>
            </div>
            <h2 className="text-[length:var(--text-subhead)] font-bold text-[var(--t1)] leading-snug">{market.title}</h2>
            {market.description && (
              <p className="text-[length:var(--text-label)] text-[var(--t3)] leading-relaxed mt-2 max-h-[72px] overflow-y-auto pr-2">
                {market.description}
              </p>
            )}
          </div>

          {/* Probability + close */}
          <div className="flex items-start gap-4 shrink-0">
            <div className="text-right">
              <div
                className="mono text-[36px] font-bold leading-none"
                style={{ color: pColor }}
              >
                {(prob * 100).toFixed(1)}%
              </div>
              <div className="flex items-center justify-end gap-2 mt-1">
                <span className="mono text-[length:var(--text-label)] font-bold" style={{ color: pColor }}>YES</span>
                <span className="mono text-[length:var(--text-label)] text-[var(--t4)]">/ {((1 - prob) * 100).toFixed(1)}% NO</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="w-8 h-8 text-[var(--t4)] hover:text-[var(--t1)] hover:bg-white/10 mono text-sm mt-1"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-0 px-5 py-2.5 border-b border-[var(--bd)] bg-[var(--bg-2)] shrink-0 overflow-x-auto">
          {[
            { label: 'TOTAL VOL',   value: fmtVol(market.volume)     },
            { label: '24H VOL',     value: fmtVol(market.volume24hr), color: market.volume24hr > 0 ? 'var(--success)' : undefined },
            { label: '1WK VOL',     value: fmtVol(market.volume1wk)  },
            { label: 'LIQUIDITY',   value: fmtVol(market.liquidity)  },
            { label: 'OPEN INT',    value: fmtVol(market.openInterest) },
            { label: 'SPREAD',      value: `${(market.spread * 100).toFixed(1)}¢`, color: spreadColor(market.spread) },
            { label: 'ENDS',        value: daysLeft !== null ? (daysLeft === 0 ? 'TODAY' : `${daysLeft}d`) : fmtMarketDate(market.endDate) },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 pr-4 mr-4 border-r border-[var(--bd)] last:border-r-0">
              <span className="mono text-[length:var(--text-micro)] text-[var(--t4)] tracking-widest shrink-0">{s.label}</span>
              <span className="mono text-[length:var(--text-body-sm)] font-bold shrink-0" style={{ color: s.color ?? 'var(--t1)' }}>{s.value}</span>
            </div>
          ))}
          <a
            href={market.polyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto mono text-[length:var(--text-tiny)] font-bold px-2 py-1 border border-[var(--bd)] text-[var(--t4)] hover:text-[var(--t1)] hover:border-white/20 transition-colors shrink-0 no-underline"
          >
            ↗ POLYMARKET
          </a>
        </div>

        {/* ── Probability chart ── */}
        <div className="shrink-0 border-b border-[var(--bd)]">
          {/* Chart header: range selector + live crosshair value */}
          <div className="flex items-center gap-2 px-5 py-2 bg-[var(--bg-2)] border-b border-[var(--bd)]">
            <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] tracking-widest">PROBABILITY HISTORY</span>
            <div className="flex gap-1 ml-3">
              {RANGES.map((r, i) => (
                <Button
                  key={r.key}
                  variant="ghost"
                  size="sm"
                  onClick={() => { setRangeIdx(i); setCrosshairPct(null); }}
                  disabled={chartLoading}
                  className={`px-2 py-1 h-auto rounded text-[length:var(--text-tiny)] mono font-bold tracking-wider disabled:opacity-40 ${
                    i === rangeIdx
                      ? 'bg-white/12 text-white border border-white/25'
                      : 'text-[var(--t4)] hover:text-[var(--t2)] border border-transparent hover:bg-white/5'
                  }`}
                >
                  {r.label}
                </Button>
              ))}
              {chartLoading && (
                <div className="w-3.5 h-3.5 border-[1.5px] border-white/10 border-t-white/50 rounded-full animate-spin ml-1 self-center" />
              )}
            </div>
            {crosshairPct !== null && (
              <span
                className="ml-auto mono text-[length:var(--text-body-sm)] font-bold px-2 py-0.5 rounded"
                style={{ color: probColor(crosshairPct), background: `${probColor(crosshairPct)}18` }}
              >
                {(crosshairPct * 100).toFixed(2)}%
              </span>
            )}
          </div>

          {/* Chart body */}
          <div style={{ height: '200px' }}>
            {chartLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/10 border-t-white/30 rounded-full animate-spin" />
              </div>
            ) : history.length > 2 ? (
              <ProbChart
                data={history}
                color={group.color}
                height={200}
                interactive
                onCrosshair={setCrosshairPct}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <span className="mono text-[length:var(--text-label)] text-[var(--t4)]">NO HISTORY AVAILABLE</span>
              </div>
            )}
          </div>
        </div>

        {/* Sub-markets table */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {subs.length > 1 ? (
            <>
              <div className="flex items-center px-5 py-2 bg-[var(--bg-2)] border-b border-[var(--bd)] shrink-0">
                <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] tracking-widest">
                  SUB-MARKETS ({subs.length})
                </span>
              </div>
              <div>
                {subs.map((sub, i) => {
                  const subProb  = sub.lastTradePrice > 0 ? sub.lastTradePrice : (sub.prices[0] ?? 0);
                  const subColor = probColor(subProb);
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center gap-4 px-5 py-3 border-b border-[var(--bd)] hover:bg-[var(--bg-2)] transition-colors"
                    >
                      <span className="mono text-[length:var(--text-caption)] text-[var(--t4)] w-5 shrink-0">{i + 1}</span>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[length:var(--text-body-sm)] text-[var(--t1)] leading-snug line-clamp-1">
                          {sub.groupItemTitle || sub.question}
                        </p>
                        <p className="text-[length:var(--text-caption)] text-[var(--t4)] mt-0.5 line-clamp-1">{sub.question}</p>
                      </div>

                      {/* Probability */}
                      <span className="mono text-[length:var(--text-body)] font-bold w-[52px] text-right shrink-0" style={{ color: subColor }}>
                        {(subProb * 100).toFixed(1)}%
                      </span>

                      {/* Vol */}
                      <span className="mono text-[length:var(--text-label)] text-[var(--t3)] w-[60px] text-right shrink-0">
                        {fmtVol(sub.volume)}
                      </span>

                      {/* Spread */}
                      <span
                        className="mono text-[length:var(--text-label)] font-bold w-[36px] text-right shrink-0"
                        style={{ color: spreadColor(sub.spread) }}
                      >
                        {(sub.spread * 100).toFixed(0)}¢
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-8">
              <span className="mono text-[length:var(--text-label)] text-[var(--t4)]">SINGLE MARKET — NO SUB-MARKETS</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-2 border-t border-[var(--bd)] bg-[var(--bg-2)] shrink-0">
          <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)]">
            {subs.length} sub-market{subs.length !== 1 ? 's' : ''} · via Polymarket · ESC to close
          </span>
          <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)]">
            Started {fmtMarketDate(market.startDate)}
          </span>
        </div>
      </div>
    </div>
  );
}
