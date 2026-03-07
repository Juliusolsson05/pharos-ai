'use client';

import { useEffect, useRef } from 'react';
import { createChart, type IChartApi, type UTCTimestamp, ColorType, LineStyle, AreaSeries } from 'lightweight-charts';
import type { TimePoint } from '@/types/domain';

type ProbChartProps = {
  data: TimePoint[];
  color: string;
  height?: number;
  interactive?: boolean;
  onCrosshair?: (p: number | null) => void;
};

function getSeriesValue(input: unknown): number | null {
  if (!input || typeof input !== 'object' || !('value' in input)) return null;
  const value = (input as { value?: unknown }).value;
  return typeof value === 'number' ? value : null;
}

export function ProbChart({ data, color, height = 80, interactive = false, onCrosshair }: ProbChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    // Determine if overall trend is up
    const first = data[0]?.p ?? 0;
    const last  = data[data.length - 1]?.p ?? 0;
    const up    = last >= first;
    const lineColor = up ? 'rgba(34,197,94,0.9)'  : 'rgba(239,68,68,0.9)';
    const topColor  = up ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)';

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor:  'rgba(255,255,255,0.4)',
        fontSize:   9,
        fontFamily: 'monospace',
      },
      grid: {
        vertLines: { visible: interactive },
        horzLines: { color: 'rgba(255,255,255,0.04)', style: LineStyle.Dotted },
      },
      rightPriceScale: {
        borderColor:   interactive ? 'rgba(255,255,255,0.08)' : 'transparent',
        borderVisible: interactive,
        scaleMargins:  { top: 0.05, bottom: 0.05 },
        // Format as percentage
      },
      timeScale: {
        borderColor:      interactive ? 'rgba(255,255,255,0.08)' : 'transparent',
        borderVisible:    interactive,
        timeVisible:      true,
        secondsVisible:   false,
      },
      crosshair: {
        mode: interactive ? 1 : 0,
        vertLine: { color: 'rgba(255,255,255,0.2)', width: 1, style: LineStyle.Dashed, labelVisible: interactive },
        horzLine: { color: 'rgba(255,255,255,0.2)', width: 1, style: LineStyle.Dashed, labelVisible: interactive },
      },
      handleScroll: interactive,
      handleScale:  interactive,

    });

    const series = chart.addSeries(AreaSeries, {
      lineColor,
      topColor,
      bottomColor:          'rgba(0,0,0,0)',
      lineWidth:            interactive ? 2 : 1,
      priceLineVisible:     false,
      lastValueVisible:     interactive,
      crosshairMarkerVisible: interactive,
      crosshairMarkerRadius: 4,
      // Price formatter — show as percentage
      priceFormat: {
        type: 'custom',
        formatter: (p: number) => `${(p * 100).toFixed(1)}%`,
        minMove: 0.001,
      },
    });

    // Convert p (0-1) → keep as is, formatter handles display
    const formatted = data.map(d => ({ time: d.t as UTCTimestamp, value: d.p }));
    series.setData(formatted);
    chart.timeScale().fitContent();

    if (onCrosshair) {
      chart.subscribeCrosshairMove(param => {
        if (!param.point || !param.time) { onCrosshair(null); return; }
        const val = param.seriesData.get(series);
        const value = getSeriesValue(val);
        if (value !== null) onCrosshair(value);
        else onCrosshair(null);
      });
    }

    chartRef.current = chart;

    const obs = new ResizeObserver(entries => {
      for (const e of entries) {
        chart.applyOptions({ width: e.contentRect.width, height: e.contentRect.height });
      }
    });
    obs.observe(containerRef.current);

    return () => { obs.disconnect(); chart.remove(); };
  }, [data, color, height, interactive, onCrosshair]);

  return <div ref={containerRef} className="w-full" style={{ height }} />;
}
