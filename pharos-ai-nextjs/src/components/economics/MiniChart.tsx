'use client';

import { useEffect, useRef } from 'react';
import { createChart, type IChartApi, type UTCTimestamp, ColorType, LineStyle, AreaSeries } from 'lightweight-charts';

type MiniChartProps = {
  data: { time: number; value: number }[];
  color: string;
  positive: boolean;
  height?: number;
};

export function MiniChart({ data, color, positive, height = 80 }: MiniChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255,255,255,0.3)',
        fontSize: 9,
        fontFamily: 'monospace',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: 'rgba(255,255,255,0.04)', style: LineStyle.Dotted },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.05 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: number) => {
          const d = new Date(time * 1000);
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        },
      },
      crosshair: {
        vertLine: { color: 'rgba(255,255,255,0.1)', width: 1, style: LineStyle.Dashed, labelVisible: false },
        horzLine: { color: 'rgba(255,255,255,0.1)', width: 1, style: LineStyle.Dashed, labelVisible: true },
      },
      handleScroll: false,
      handleScale: false,

    });

    const lineColor = positive ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)';
    const topColor = positive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
    const bottomColor = 'rgba(0,0,0,0)';

    const series = chart.addSeries(AreaSeries, {
      lineColor,
      topColor,
      bottomColor,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 3,
    });

    const formatted = data.map(d => ({ time: d.time as UTCTimestamp, value: d.value }));
    series.setData(formatted);
    chart.timeScale().fitContent();

    chartRef.current = chart;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
    };
  }, [data, color, positive, height]);

  return <div ref={containerRef} className="w-full" style={{ height }} />;
}
