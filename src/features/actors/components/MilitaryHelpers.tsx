'use client';

import type { MilSpendPoint } from '@/features/actors/queries/world-bank';

// Pure helpers

export function latestPoint(points: MilSpendPoint[]): MilSpendPoint | null {
  return points.length > 0 ? points[points.length - 1] : null;
}

export function fmtUsd(val: number): string {
  if (val >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
  return `$${val.toLocaleString()}`;
}

export function fmtPct(val: number): string {
  return `${val.toFixed(2)}%`;
}

export function fmtPeople(val: number): string {
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(0)}K`;
  return Math.round(val).toLocaleString();
}

export function fmtIndex(val: number): string {
  return val.toFixed(1);
}

export function yoyChange(pts: MilSpendPoint[]): { delta: number; pct: number } | null {
  if (pts.length < 2) return null;
  const curr = pts[pts.length - 1].value;
  const prev = pts[pts.length - 2].value;
  if (prev === 0) return null;
  return { delta: curr - prev, pct: ((curr - prev) / prev) * 100 };
}

// Tiny components

export function Sparkline({ data, color }: { data: MilSpendPoint[]; color: string }) {
  if (data.length < 2) return null;
  const W = 280;
  const H = 48;
  const PAD = 4;

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data
    .map((d, i) => {
      const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
      const y = H - PAD - ((d.value - min) / range) * (H - PAD * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={W} height={H} className="w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function YoyBadge({ pts }: { pts: MilSpendPoint[] }) {
  const change = yoyChange(pts);
  if (!change) return null;

  const positive = change.delta >= 0;
  const color = positive ? 'var(--success)' : 'var(--danger)';
  const arrow = positive ? '\u25B2' : '\u25BC';

  return (
    <span className="mono text-[length:var(--text-label)] ml-2" style={{ color }}>
      {arrow} {Math.abs(change.pct).toFixed(1)}% YoY
    </span>
  );
}

export function MetricCard({
  label,
  value,
  sublabel,
  tone = 'var(--t1)',
}: {
  label: string;
  value: string;
  sublabel: string;
  tone?: string;
}) {
  return (
    <div className="border border-[var(--bd)] bg-[var(--bg-2)] px-3 py-3">
      <div className="label text-[length:var(--text-tiny)] text-[var(--t4)] mb-1">{label}</div>
      <div className="mono text-[18px] font-bold leading-none" style={{ color: tone }}>{value}</div>
      <div className="mono text-[length:var(--text-tiny)] text-[var(--t4)] mt-2">{sublabel}</div>
    </div>
  );
}

export function Skeleton() {
  return (
    <div className="px-[22px] py-[18px] space-y-5 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i}>
          <div className="h-2 w-32 bg-[var(--bd)] mb-3" />
          <div className="h-5 w-48 bg-[var(--bd)] mb-1" />
          <div className="h-3 w-24 bg-[var(--bd)]" />
        </div>
      ))}
    </div>
  );
}
