'use client';

import { useEscalationForecast, useEscalationSeries } from '@/features/dashboard/queries/engine';

const PATTERN_COLORS: Record<string, string> = {
  'Military Tempo Surge':   'var(--danger)',
  'Diplomatic Breakdown':   'var(--warning)',
  'Multi-Front Activation': 'var(--danger)',
  'Severity Cascade':       'var(--warning)',
  'Source Convergence':     'var(--info)',
};

function MiniSparkline({ points }: { points: { intensity: number }[] }) {
  if (points.length < 2) return null;
  const max = Math.max(...points.map(p => p.intensity), 1);
  const min = Math.min(...points.map(p => p.intensity), 0);
  const range = max - min || 1;
  const width = 200;
  const height = 40;

  const pathData = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p.intensity - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Last point color
  const last = points[points.length - 1]?.intensity ?? 0;
  const color = last > 60 ? 'var(--danger)' : last > 30 ? 'var(--warning)' : 'var(--info)';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10" preserveAspectRatio="none">
      <path d={pathData} fill="none" stroke={color} strokeWidth="1.5" opacity="0.8" />
      {/* Gradient fill */}
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${pathData} L${width},${height} L0,${height} Z`}
        fill="url(#spark-grad)"
      />
    </svg>
  );
}

export function EscalationWidget() {
  const { data: forecast, isLoading: fLoading } = useEscalationForecast();
  const { data: series } = useEscalationSeries();

  if (fLoading || !forecast) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="mono text-[10px] text-[var(--t4)]">LOADING ESCALATION DATA...</span>
      </div>
    );
  }

  const points = series?.points ?? [];
  const volatilityPct = (forecast.volatility * 100).toFixed(0);
  const confidencePct = (forecast.confidence * 100).toFixed(0);

  return (
    <div className="h-full overflow-y-auto px-4 py-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="label text-[8px] text-[var(--t4)]">PHAROS ENGINE // ESCALATION ANALYSIS</span>
        <span className="mono text-[9px] text-[var(--t4)]">
          {forecast.dataPoints} data points · {confidencePct}% confidence
        </span>
      </div>

      {/* Current level + rate */}
      <div className="flex items-center gap-4">
        <div>
          <div className="label text-[8px] text-[var(--t4)]">CURRENT LEVEL</div>
          <span className="mono text-[22px] font-bold text-[var(--t1)]">
            {forecast.currentLevel.toFixed(1)}
          </span>
        </div>
        <div>
          <div className="label text-[8px] text-[var(--t4)]">RATE</div>
          <span
            className="mono text-[14px] font-bold"
            style={{
              color: forecast.rateOfChange > 0 ? 'var(--danger)' : forecast.rateOfChange < 0 ? 'var(--success)' : 'var(--t3)',
            }}
          >
            {forecast.rateOfChange > 0 ? '+' : ''}{forecast.rateOfChange.toFixed(2)}/h
          </span>
        </div>
        <div>
          <div className="label text-[8px] text-[var(--t4)]">ACCELERATION</div>
          <span className="mono text-[14px] text-[var(--t2)]">
            {forecast.acceleration > 0 ? '+' : ''}{forecast.acceleration.toFixed(3)}
          </span>
        </div>
        <div>
          <div className="label text-[8px] text-[var(--t4)]">VOLATILITY</div>
          <span className="mono text-[14px] text-[var(--t2)]">{volatilityPct}%</span>
        </div>
      </div>

      {/* Sparkline */}
      {points.length > 1 && (
        <div className="bg-[var(--bg-2)] border border-[var(--bd)] px-2 py-1.5">
          <MiniSparkline points={points} />
          <div className="flex justify-between mt-0.5">
            <span className="mono text-[8px] text-[var(--t4)]">
              {points.length > 0 ? new Date(points[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
            <span className="mono text-[8px] text-[var(--t4)]">
              {points.length > 0 ? new Date(points[points.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
        </div>
      )}

      {/* Forecasts */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '1H FORECAST', data: forecast.forecast1h },
          { label: '6H FORECAST', data: forecast.forecast6h },
          { label: '24H FORECAST', data: forecast.forecast24h },
        ].map(({ label, data }) => (
          <div key={label} className="px-2.5 py-2 bg-[var(--bg-2)] border border-[var(--bd)]">
            <div className="label text-[8px] text-[var(--t4)] mb-0.5">{label}</div>
            <span className="mono text-[13px] text-[var(--t1)] font-bold">
              {data.projected.toFixed(1)}
            </span>
            <span className="mono text-[9px] text-[var(--t4)] ml-1">
              ±{data.confidenceInterval.toFixed(1)}
            </span>
          </div>
        ))}
      </div>

      {/* Active patterns */}
      {forecast.activePatterns.length > 0 && (
        <div>
          <div className="label text-[8px] text-[var(--t4)] mb-1.5">DETECTED PATTERNS</div>
          <div className="flex flex-col gap-1">
            {forecast.activePatterns.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--bg-2)] border border-[var(--bd)]"
                style={{ borderLeft: `3px solid ${PATTERN_COLORS[p.name] ?? 'var(--info)'}` }}
              >
                <div className="flex-1 min-w-0">
                  <span className="mono text-[10px] font-bold text-[var(--t1)]">{p.name}</span>
                  <p className="text-[10px] text-[var(--t3)] truncate">{p.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="mono text-[10px] text-[var(--t2)]">
                    bias: {p.escalationBias > 0 ? '+' : ''}{p.escalationBias.toFixed(1)}
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
    </div>
  );
}
