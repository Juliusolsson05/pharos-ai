'use client';

import { useEffect, useState } from 'react';

type InstabilityPulseProps = { conflictId: string };

type PulseData = {
  score: number;
  sparkline: number[];
  trend: 'rising' | 'falling' | 'stable';
} | null;

const TREND_ARROW: Record<string, string> = { rising: '↑', falling: '↓', stable: '→' };
const TREND_COLOR: Record<string, string> = {
  rising: 'var(--danger)', falling: 'var(--info)', stable: 'var(--t4)',
};

function scoreColor(score: number): string {
  if (score >= 75) return 'var(--danger)';
  if (score >= 40) return 'var(--warning)';
  return 'var(--info)';
}

export function InstabilityPulse({ conflictId }: InstabilityPulseProps) {
  const [data, setData] = useState<PulseData>(null);

  useEffect(() => {
    setData(null);
    fetch(`/api/v1/conflicts/${conflictId}/instability`)
      .then(r => r.json())
      .then((json: { ok: boolean; data: PulseData }) => { if (json.ok) setData(json.data); })
      .catch(() => {});
  }, [conflictId]);

  if (!data) {
    return (
      <div className="w-full h-7 bg-[var(--bg-3)] rounded-sm animate-pulse" />
    );
  }

  const { score, sparkline, trend } = data;
  const maxVal = Math.max(...sparkline, 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="label text-[8px] text-[var(--t4)] tracking-[0.10em]">INSTABILITY PULSE</span>
        <div className="flex items-center gap-1.5">
          <span
            className="mono text-[9px] font-bold"
            style={{ color: TREND_COLOR[trend] }}
          >
            {TREND_ARROW[trend]}
          </span>
          <span className="mono text-lg font-bold leading-none" style={{ color: scoreColor(score) }}>
            {score}
          </span>
        </div>
      </div>
      <div className="w-full h-[3px] bg-[var(--bg-3)] rounded-sm overflow-hidden mb-2">
        <div
          className="h-full rounded-sm transition-all"
          style={{ width: `${score}%`, background: scoreColor(score) }}
        />
      </div>
      <div className="flex items-end gap-px h-6">
        {sparkline.map((v, i) => (
          <div
            key={i}
            style={{
              flex: '1',
              height: `${Math.max(1, Math.round((v / maxVal) * 24))}px`,
              background: 'var(--warning)',
              opacity: v === 0 ? 0.15 : 0.65,
            }}
          />
        ))}
      </div>
    </div>
  );
}
