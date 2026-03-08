'use client';

import {
  useTemporalProfile,
  useTemporalPatterns,
  useTemporalHourly,
} from '@/features/dashboard/queries/engine';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'var(--danger)',
  HIGH: 'var(--warning)',
  MEDIUM: 'var(--info)',
};

function HourlyChart({ hours }: { hours: { hour: number; count: number; avgSeverity: number }[] }) {
  const max = Math.max(...hours.map(h => h.count), 1);
  const barWidth = 100 / 24;

  return (
    <svg viewBox="0 0 240 50" className="w-full h-12" preserveAspectRatio="none">
      {hours.map(h => {
        const height = (h.count / max) * 44;
        const color =
          h.avgSeverity > 2 ? 'var(--danger)' : h.avgSeverity > 1.3 ? 'var(--warning)' : 'var(--info)';
        return (
          <rect
            key={h.hour}
            x={h.hour * (barWidth * 2.4)}
            y={48 - height}
            width={barWidth * 2}
            height={Math.max(height, 0.5)}
            fill={color}
            opacity={0.7}
            rx={0.5}
          />
        );
      })}
      {/* Hour labels every 6h */}
      {[0, 6, 12, 18].map(h => (
        <text key={h} x={h * (barWidth * 2.4) + 2} y={50} fontSize="4" fill="var(--t4)">
          {String(h).padStart(2, '0')}
        </text>
      ))}
    </svg>
  );
}

export function TemporalWidget() {
  const { data: profile, isLoading: pLoading } = useTemporalProfile();
  const { data: patternsData } = useTemporalPatterns();
  const { data: hourlyData } = useTemporalHourly();

  if (pLoading || !profile) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="mono text-[10px] text-[var(--t4)]">LOADING TEMPORAL DATA...</span>
      </div>
    );
  }

  const patterns = patternsData?.patterns ?? [];
  const hours = hourlyData?.hours ?? [];
  const topTypes = Object.entries(profile.typeDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="h-full overflow-y-auto px-4 py-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="label text-[8px] text-[var(--t4)]">PHAROS ENGINE // TEMPORAL ANALYSIS</span>
        <span className="mono text-[9px] text-[var(--t4)]">
          {profile.totalEvents} events · {profile.timeSpanHours.toFixed(0)}h span
        </span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'RATE', value: `${profile.eventsPerHour.toFixed(1)}/h` },
          { label: 'LAST 1H', value: String(profile.last1hCount) },
          { label: 'LAST 24H', value: String(profile.last24hCount) },
          { label: 'PEAK HOUR', value: `${String(profile.peakHourUtc).padStart(2, '0')}:00 UTC` },
        ].map(({ label, value }) => (
          <div key={label} className="px-2 py-1.5 bg-[var(--bg-2)] border border-[var(--bd)]">
            <div className="label text-[8px] text-[var(--t4)]">{label}</div>
            <span className="mono text-[13px] text-[var(--t1)] font-bold">{value}</span>
          </div>
        ))}
      </div>

      {/* Burst stats */}
      <div className="flex gap-3 items-center">
        <div>
          <span className="label text-[8px] text-[var(--t4)]">MAX BURST </span>
          <span className="mono text-[12px] text-[var(--t1)] font-bold">{profile.maxBurstSize}</span>
        </div>
        <div>
          <span className="label text-[8px] text-[var(--t4)]">AVG BURST </span>
          <span className="mono text-[12px] text-[var(--t2)]">{profile.avgBurstSize.toFixed(1)}</span>
        </div>
        <div>
          <span className="label text-[8px] text-[var(--t4)]">SEV TREND </span>
          <span
            className="mono text-[12px] font-bold"
            style={{
              color:
                profile.severityTrend > 0.3
                  ? 'var(--danger)'
                  : profile.severityTrend < -0.3
                    ? 'var(--success)'
                    : 'var(--t3)',
            }}
          >
            {profile.severityTrend > 0 ? '+' : ''}
            {profile.severityTrend.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Hourly distribution chart */}
      {hours.length > 0 && (
        <div className="bg-[var(--bg-2)] border border-[var(--bd)] px-2 py-1.5">
          <div className="label text-[8px] text-[var(--t4)] mb-1">HOURLY ACTIVITY (UTC)</div>
          <HourlyChart hours={hours} />
        </div>
      )}

      {/* Type distribution */}
      {topTypes.length > 0 && (
        <div>
          <div className="label text-[8px] text-[var(--t4)] mb-1">EVENT TYPE DISTRIBUTION</div>
          <div className="flex flex-col gap-0.5">
            {topTypes.map(([type, ratio]) => (
              <div key={type} className="flex items-center gap-2">
                <span className="mono text-[9px] text-[var(--t3)] w-24 truncate">{type}</span>
                <div className="flex-1 h-1.5 bg-[var(--bg-2)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--info)] rounded-full"
                    style={{ width: `${(ratio * 100).toFixed(0)}%` }}
                  />
                </div>
                <span className="mono text-[8px] text-[var(--t4)] w-8 text-right">
                  {(ratio * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detected temporal patterns */}
      {patterns.length > 0 && (
        <div>
          <div className="label text-[8px] text-[var(--t4)] mb-1.5">TEMPORAL PATTERNS</div>
          <div className="flex flex-col gap-1">
            {patterns.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--bg-2)] border border-[var(--bd)]"
                style={{
                  borderLeft: `3px solid ${SEVERITY_COLORS[p.severity] ?? 'var(--info)'}`,
                }}
              >
                <div className="flex-1 min-w-0">
                  <span className="mono text-[10px] font-bold text-[var(--t1)]">{p.name}</span>
                  <p className="text-[10px] text-[var(--t3)] truncate">{p.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className="mono text-[10px] font-bold"
                    style={{ color: SEVERITY_COLORS[p.severity] ?? 'var(--t2)' }}
                  >
                    {p.severity}
                  </div>
                  <div className="mono text-[8px] text-[var(--t4)]">
                    {(p.confidence * 100).toFixed(0)}% conf
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {patterns.length === 0 && profile.totalEvents >= 10 && (
        <div className="px-2.5 py-2 bg-[var(--bg-2)] border border-[var(--bd)] text-center">
          <span className="mono text-[10px] text-[var(--t4)]">NO TEMPORAL ANOMALIES DETECTED</span>
        </div>
      )}
    </div>
  );
}
