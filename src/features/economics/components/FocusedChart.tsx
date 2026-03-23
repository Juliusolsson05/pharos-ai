'use client';

import { useCallback,useEffect, useRef, useState } from 'react';

import type { IChartApi } from 'lightweight-charts';

import { RANGES } from '@/features/economics/components/focused-chart-constants';
import { FocusedChartHeader } from '@/features/economics/components/FocusedChartHeader';
import { FocusedChartStats } from '@/features/economics/components/FocusedChartStats';
import { useFocusedChart } from '@/features/economics/components/use-focused-chart';

import type { EconomicIndex, MarketResult } from '@/types/domain';

type Props = {
  index: EconomicIndex;
  data: MarketResult;
  initialRangeKey?: string;
  onClose: () => void;
};

export function FocusedChart({ index, data: initialData, initialRangeKey = '5d', onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const anchorLineRef = useRef<ReturnType<ReturnType<IChartApi['addSeries']>['createPriceLine']> | null>(null);
  const anchorModeRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [anchorPrice, setAnchorPrice] = useState<number | null>(null);
  const [crosshairValue, setCrosshairValue] = useState<{ price: number; time: number } | null>(null);
  const [anchorMode, setAnchorMode] = useState(false);
  const initialIdx = RANGES.findIndex(r => r.key === initialRangeKey);
  const [rangeIdx, setRangeIdx] = useState(initialIdx >= 0 ? initialIdx : 1);
  const [data, setData] = useState<MarketResult>(initialData);
  const [fetching, setFetching] = useState(false);
  const positive = data.changePct >= 0;

  const handleClose = useCallback(() => {
    setOpen(false);
    setTimeout(onClose, 280);
  }, [onClose]);

  const prices = data.chart.map(p => p.value).filter(Boolean);
  const periodHigh = prices.length ? Math.max(...prices) : data.price;
  const periodLow  = prices.length ? Math.min(...prices) : data.price;
  const periodOpen = prices.length ? prices[0] : data.previousClose;

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

  const fetchRange = useCallback(async (idx: number) => {
    const r = RANGES[idx];
    setFetching(true);
    setAnchorPrice(null);
    setAnchorMode(false);
    try {
      const res = await fetch(
        `/api/v1/markets?tickers=${encodeURIComponent(index.ticker)}&range=${r.key}&interval=${r.interval}`,
      );
      const json = await res.json();
      const result: MarketResult = json.results?.[0];
      if (result && !result.error) setData(result);
    } catch { /* network error — user sees stale data */ }
    finally { setFetching(false); }
  }, [index.ticker]);

  useEffect(() => {
    if (rangeIdx === (RANGES.findIndex(r => r.key === initialRangeKey) >= 0 ? RANGES.findIndex(r => r.key === initialRangeKey) : 1)) return;
    fetchRange(rangeIdx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeIdx]);

  const chartRef = useFocusedChart(
    containerRef, data, positive, anchorModeRef, anchorLineRef,
    setCrosshairValue, setAnchorPrice, setAnchorMode,
  );

  // Sync anchor mode ref into the chart click handler
  useEffect(() => { anchorModeRef.current = anchorMode; }, [anchorMode]);

  const clearAnchor = useCallback(() => {
    setAnchorPrice(null);
    setAnchorMode(false);
    if (anchorLineRef.current && chartRef.current) {
      // Can't easily remove without series ref here — handled on next chart init
    }
  }, [chartRef]);

  const pctFromAnchor = anchorPrice && crosshairValue
    ? ((crosshairValue.price - anchorPrice) / anchorPrice) * 100 : null;
  const pctFromOpen = ((data.price - periodOpen) / periodOpen) * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6" style={{ perspective: '1000px' }}>
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', opacity: open ? 1 : 0 }}
        onClick={handleClose}
      />
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
        <FocusedChartHeader
          index={index} data={data} rangeIdx={rangeIdx} setRangeIdx={setRangeIdx}
          fetching={fetching} positive={positive} handleClose={handleClose}
        />
        <FocusedChartStats
          index={index} periodOpen={periodOpen} periodHigh={periodHigh} periodLow={periodLow}
          pctFromOpen={pctFromOpen} crosshairValue={crosshairValue} anchorPrice={anchorPrice}
          pctFromAnchor={pctFromAnchor} anchorMode={anchorMode} setAnchorMode={setAnchorMode}
          clearAnchor={clearAnchor}
        />
        <div
          ref={containerRef}
          className="flex-1 min-h-0 w-full"
          style={{ cursor: anchorMode ? 'crosshair' : 'default' }}
        />
        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--bd)] bg-[var(--bg-2)] shrink-0">
          <p className="text-[length:var(--text-caption)] text-[var(--t4)] leading-snug">{index.description}</p>
          <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] shrink-0 ml-4">
            {data.chart.length} data points · scroll/pinch to zoom · ESC to close
          </span>
        </div>
      </div>
    </div>
  );
}
