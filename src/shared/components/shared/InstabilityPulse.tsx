'use client';

import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';

import { api } from '@/shared/lib/query/client';
import { queryKeys, REFETCH, STALE } from '@/shared/lib/query/keys';

type InstabilityPulseProps = { conflictId: string };

type PulseData = {
  score: number;
  sparkline: number[];
  trend: 'rising' | 'falling' | 'stable';
};

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
  const { data, isError, isPending, refetch } = useQuery({
    queryKey: queryKeys.conflicts.instability(conflictId),
    queryFn: () => api.get<PulseData>(`/conflicts/${conflictId}/instability`),
    staleTime: STALE.MEDIUM,
    refetchInterval: REFETCH.NORMAL,
  });

  if (isError) {
    return (
      <div className="flex h-7 items-center justify-between gap-3">
        <span className="mono text-[length:var(--text-caption)] text-[var(--t4)]">INSTABILITY PULSE - UNAVAILABLE</span>
        <Button className="h-6 px-2" size="sm" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (isPending || !data) {
    return <div className="w-full h-7 bg-[var(--bg-3)] rounded-sm animate-pulse" />;
  }

  const { score, sparkline, trend } = data;
  const maxVal = Math.max(...sparkline, 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="label text-[length:var(--text-tiny)] text-[var(--t4)] tracking-[0.10em]">INSTABILITY PULSE</span>
          <span className="mono text-[length:var(--text-caption)] text-[var(--t4)]">7D</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="mono text-[length:var(--text-caption)] font-bold"
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
