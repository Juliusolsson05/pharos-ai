'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, LineStyle, AreaSeries, type IChartApi, type UTCTimestamp } from 'lightweight-charts';
import type { EconomicIndex } from '@/types/domain';
import type { MarketResult } from '@/types/domain';
import { ECON_CATEGORY_MAP } from '@/data/economic-indexes';

const RANGES = [
  { key: '1d',  label: '1D',  interval: '5m'  },
  { key: '5d',  label: '5D',  interval: '15m' },
  { key: '1mo', label: '1M',  interval: '1h'  },
  { key: '3mo', label: '3M',  interval: '1d'  },
  { key: '6mo', label: '6M',  interval: '1d'  },
  { key: '1y',  label: '1Y',  interval: '1wk' },
  { key: '5y',  label: '5Y',  interval: '1mo' },
] as const;

type FocusedChartProps = {
  index: EconomicIndex;
  data: MarketResult;        // initial data (from page's current range)
  initialRangeKey?: string;  // which range the page is currently on
  onClose: () => void;
};

function fmtPrice(v: number, unit: string): string {
  const formatted = v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return unit === '$' ? `$${formatted}` : unit === '%' ? `${formatted}%` : formatted;
}

function fmtPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(3)}%`;
}

export function FocusedChart({ index, data: initialData, initialRangeKey = '5d', onClose }: FocusedChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const anchorLineRef = useRef<ReturnType<ReturnType<IChartApi['addSeries']>['createPriceLine']> | null>(null);
  const anchorModeRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [anchorPrice, setAnchorPrice] = useState<number | null>(null);
  const [crosshairValue, setCrosshairValue] = useState<{ price: number; time: number } | null>(null);
  const [anchorMode, setAnchorMode] = useState(false);

  // Own range state — starts on whatever the page is showing
  const initialIdx = RANGES.findIndex(r => r.key === initialRangeKey);
  const [rangeIdx, setRangeIdx] = useState(initialIdx >= 0 ? initialIdx : 1);
  const [data, setData] = useState<MarketResult>(initialData);
  const [fetching, setFetching] = useState(false);

  const cat = ECON_CATEGORY_MAP[index.category];
  const positive = data.changePct >= 0;

  const handleClose = useCallback(() => {
    setOpen(false);
    setTimeout(onClose, 280);
  }, [onClose]);

  // Compute stats from current chart data
  const prices = data.chart.map(p => p.value).filter(Boolean);
  const periodHigh = prices.length ? Math.max(...prices) : data.price;
  const periodLow  = prices.length ? Math.min(...prices) : data.price;
  const periodOpen = prices.length ? prices[0] : data.previousClose;

  // Animate in on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  // Fetch data for the selected range
  const fetchRange = useCallback(async (idx: number) => {
    const r = RANGES[idx];
    setFetching(true);
    // Clear anchor when range changes
    setAnchorPrice(null);
    setAnchorMode(false);
    try {
      const res = await fetch(
        `/api/v1/markets?tickers=${encodeURIComponent(index.ticker)}&range=${r.key}&interval=${r.interval}`,
      );
      const json = await res.json();
      const result: MarketResult = json.results?.[0];
      if (result && !result.error) setData(result);
    } catch {}
    finally { setFetching(false); }
  }, [index.ticker]);

  // When range tab changes, fetch fresh data
  useEffect(() => {
    // Skip initial mount — we already have initialData
    if (rangeIdx === (RANGES.findIndex(r => r.key === initialRangeKey) >= 0 ? RANGES.findIndex(r => r.key === initialRangeKey) : 1)) return;
    fetchRange(rangeIdx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeIdx]);

  // Build the chart
  useEffect(() => {
    if (!containerRef.current) return;

    const lineColor = positive ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)';
    const topColor  = positive ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)';

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255,255,255,0.45)',
        fontSize: 10,
        fontFamily: 'monospace',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(255,255,255,0.04)', style: LineStyle.Dotted },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.08)',
        scaleMargins: { top: 0.1, bottom: 0.06 },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.08)',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1, // normal crosshair
        vertLine: { color: 'rgba(255,255,255,0.25)', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#1a1a2e' },
        horzLine: { color: 'rgba(255,255,255,0.25)', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#1a1a2e' },
      },
      handleScroll: true,
      handleScale: true,

    });

    const series = chart.addSeries(AreaSeries, {
      lineColor,
      topColor,
      bottomColor: 'rgba(0,0,0,0)',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 5,
    });

    series.setData(data.chart.map(p => ({ time: p.time as UTCTimestamp, value: p.value })));
    chart.timeScale().fitContent();

    // Track crosshair
    chart.subscribeCrosshairMove(param => {
      if (!param.point || !param.time) {
        setCrosshairValue(null);
        return;
      }
      const price = param.seriesData.get(series);
      if (price && 'value' in price) {
        setCrosshairValue({ price: price.value, time: Number(param.time) });
      }
    });

    // Click to set anchor (when anchor mode is active)
    chart.subscribeClick(param => {
      if (!anchorModeRef.current) return;
      const price = param.seriesData.get(series);
      if (price && 'value' in price) {
        const p = price.value;
        setAnchorPrice(p);
        setAnchorMode(false);
        anchorModeRef.current = false;

        // Remove old price line
        if (anchorLineRef.current) {
          try { series.removePriceLine(anchorLineRef.current); } catch {}
        }
        // Add horizontal reference line at anchor
        anchorLineRef.current = series.createPriceLine({
          price: p,
          color: 'rgba(251,191,36,0.7)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'ANCHOR',
        });
      }
    });

    chartRef.current = chart;

    const obs = new ResizeObserver(entries => {
      for (const e of entries) {
        chart.applyOptions({ width: e.contentRect.width, height: e.contentRect.height });
      }
    });
    obs.observe(containerRef.current);

    return () => {
      obs.disconnect();
      chart.remove();
    };
  }, [data, positive]);

  // Sync anchor mode ref into the chart click handler
  useEffect(() => {
    anchorModeRef.current = anchorMode;
  }, [anchorMode]);

  const clearAnchor = useCallback(() => {
    setAnchorPrice(null);
    setAnchorMode(false);
    if (anchorLineRef.current && chartRef.current) {
      // Can't easily remove without series ref here — handled on next chart init
    }
  }, []);

  const pctFromAnchor = anchorPrice && crosshairValue
    ? ((crosshairValue.price - anchorPrice) / anchorPrice) * 100
    : null;

  const pctFromOpen = ((data.price - periodOpen) / periodOpen) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
      style={{ perspective: '1000px' }}
    >
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
        ref={overlayRef}
        className="relative w-full max-w-[1200px] flex flex-col bg-[var(--bg-1)] border border-[var(--bd)] overflow-hidden"
        style={{
          borderRadius: '2px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
          height: 'min(640px, calc(100vh - 80px))',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
          transition: 'opacity 280ms cubic-bezier(0.22,1,0.36,1), transform 280ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--bd)] shrink-0">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: index.color }} />
          <div>
            <span className="mono text-[13px] font-bold text-[var(--t1)] tracking-wide">{index.shortName}</span>
            <span className="mono text-[10px] text-[var(--t4)] ml-3">{index.name}</span>
          </div>

          {/* Badges */}
          <span
            className="mono text-[7px] font-bold px-[5px] py-[2px] tracking-wider"
            style={{
              color: index.tier === 1 ? 'var(--danger)' : index.tier === 2 ? 'var(--warning)' : 'var(--t4)',
              background: index.tier === 1 ? 'var(--danger-dim)' : index.tier === 2 ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${index.tier === 1 ? 'var(--danger-bd)' : index.tier === 2 ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            T{index.tier}
          </span>
          <span
            className="mono text-[7px] font-bold px-[5px] py-[2px] tracking-wider"
            style={{ color: cat.color, background: `${cat.color}18`, border: `1px solid ${cat.color}30` }}
          >
            {cat.label}
          </span>

          {/* Range selector */}
          <div className="ml-auto flex items-center gap-1 mr-4">
            {RANGES.map((r, i) => (
              <button
                key={r.key}
                onClick={() => setRangeIdx(i)}
                disabled={fetching}
                className={`px-2 py-1 rounded text-[9px] mono font-bold tracking-wider transition-all disabled:opacity-40 ${
                  i === rangeIdx
                    ? 'bg-white/12 text-white border border-white/25'
                    : 'text-[var(--t4)] hover:text-[var(--t2)] border border-transparent hover:bg-white/5'
                }`}
              >
                {r.label}
              </button>
            ))}
            {fetching && (
              <div className="w-3.5 h-3.5 border-[1.5px] border-white/10 border-t-white/50 rounded-full animate-spin ml-1" />
            )}
          </div>

          {/* Price */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="mono text-[20px] font-bold text-[var(--t1)] leading-none">
                {fmtPrice(data.price, index.unit)}
              </div>
              <div
                className="mono text-[11px] font-bold mt-0.5"
                style={{ color: positive ? 'var(--success)' : 'var(--danger)' }}
              >
                {positive ? '▲' : '▼'} {fmtPrice(Math.abs(data.change), index.unit)} ({Math.abs(data.changePct).toFixed(2)}%)
              </div>
            </div>

            {/* Close */}
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded text-[var(--t4)] hover:text-[var(--t1)] hover:bg-white/10 transition-colors mono text-[14px]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="flex items-center gap-0 px-4 py-2 border-b border-[var(--bd)] bg-[var(--bg-2)] shrink-0 overflow-x-auto">
          {[
            { label: 'OPEN',   value: fmtPrice(periodOpen, index.unit) },
            { label: 'HIGH',   value: fmtPrice(periodHigh, index.unit), color: 'var(--success)' },
            { label: 'LOW',    value: fmtPrice(periodLow,  index.unit), color: 'var(--danger)'  },
            { label: 'CHANGE', value: fmtPct(pctFromOpen), color: pctFromOpen >= 0 ? 'var(--success)' : 'var(--danger)' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 pr-4 mr-4 border-r border-[var(--bd)] last:border-r-0">
              <span className="mono text-[8px] text-[var(--t4)] tracking-widest shrink-0">{s.label}</span>
              <span className="mono text-[11px] font-bold" style={{ color: s.color ?? 'var(--t1)' }}>{s.value}</span>
            </div>
          ))}

          {/* Crosshair live value */}
          {crosshairValue && (
            <>
              <div className="w-px h-4 bg-[var(--bd)] mx-3" />
              <span className="mono text-[8px] text-[var(--t4)] tracking-widest shrink-0">CURSOR</span>
              <span className="mono text-[11px] font-bold text-[var(--t1)] ml-2 shrink-0">
                {fmtPrice(crosshairValue.price, index.unit)}
              </span>
              {anchorPrice && (
                <span
                  className="mono text-[11px] font-bold ml-3 shrink-0 px-2 py-0.5 rounded"
                  style={{
                    color: (pctFromAnchor ?? 0) >= 0 ? 'var(--success)' : 'var(--danger)',
                    background: (pctFromAnchor ?? 0) >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                  }}
                >
                  {fmtPct(pctFromAnchor ?? 0)} from anchor
                </span>
              )}
            </>
          )}

          {/* Anchor controls */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {anchorPrice && (
              <div className="flex items-center gap-2">
                <span className="mono text-[8px] text-amber-400/80 tracking-wider">
                  ANCHOR: {fmtPrice(anchorPrice, index.unit)}
                </span>
                <button
                  onClick={clearAnchor}
                  className="mono text-[8px] text-[var(--t4)] hover:text-[var(--danger)] transition-colors px-1"
                >
                  ✕ CLEAR
                </button>
              </div>
            )}
            <button
              onClick={() => setAnchorMode(v => !v)}
              className={`mono text-[8px] font-bold px-2 py-1 tracking-wider transition-colors ${
                anchorMode
                  ? 'text-amber-300 bg-amber-400/15 border border-amber-400/40'
                  : 'text-[var(--t4)] border border-[var(--bd)] hover:text-[var(--t2)] hover:border-white/20'
              }`}
            >
              {anchorMode ? '⊕ CLICK CHART TO ANCHOR' : '⊕ SET ANCHOR'}
            </button>
          </div>
        </div>

        {/* ── Chart ── */}
        <div
          ref={containerRef}
          className="flex-1 min-h-0 w-full"
          style={{ cursor: anchorMode ? 'crosshair' : 'default' }}
        />

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--bd)] bg-[var(--bg-2)] shrink-0">
          <p className="text-[9px] text-[var(--t4)] leading-snug">{index.description}</p>
          <span className="mono text-[8px] text-[var(--t4)] shrink-0 ml-4">
            {data.chart.length} data points · scroll/pinch to zoom · ESC to close
          </span>
        </div>
      </div>
    </div>
  );
}
