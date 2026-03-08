'use client';

import {
  useEngineThreat,
  useEngineClusters,
  useEscalationForecast,
  useCompositeThreat,
} from '@/features/dashboard/queries/engine';

const THREAT_COLORS: Record<string, string> = {
  CRITICAL:   'var(--danger)',
  HIGH:       'var(--warning)',
  ELEVATED:   'var(--info)',
  MONITORING: 'var(--t3)',
};

const TREND_LABELS: Record<string, { label: string; color: string }> = {
  Accelerating:  { label: 'ACCELERATING',  color: 'var(--danger)' },
  Escalating:    { label: 'ESCALATING',    color: 'var(--warning)' },
  Stable:        { label: 'STABLE',        color: 'var(--t3)' },
  Cooling:       { label: 'COOLING',       color: 'var(--info)' },
  DeEscalating:  { label: 'DE-ESCALATING', color: 'var(--success)' },
};

function FactorBar({ name, score, weight }: { name: string; score: number; weight: number }) {
  const contribution = score * weight;
  const color =
    score > 0.6 ? 'var(--danger)' : score > 0.3 ? 'var(--warning)' : 'var(--info)';

  return (
    <div className="flex items-center gap-2">
      <span className="mono text-[8px] text-[var(--t3)] w-28 truncate">{name}</span>
      <div className="flex-1 h-1.5 bg-[var(--bg-2)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(score * 100).toFixed(0)}%`, backgroundColor: color }}
        />
      </div>
      <span className="mono text-[8px] text-[var(--t4)] w-8 text-right">
        {(contribution * 100).toFixed(0)}%
      </span>
    </div>
  );
}

export function ThreatWidget() {
  const { data: threat, isLoading: tLoading } = useEngineThreat();
  const { data: clusters } = useEngineClusters();
  const { data: forecast } = useEscalationForecast();
  const { data: composite } = useCompositeThreat();

  if (tLoading || !threat) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="mono text-[10px] text-[var(--t4)]">CONNECTING TO ENGINE...</span>
      </div>
    );
  }

  // Use composite scoring if available, fall back to basic threat
  const level = composite?.threatLevel ?? threat.overallLevel;
  const color = THREAT_COLORS[level] ?? 'var(--t3)';
  const trend = forecast ? TREND_LABELS[forecast.trend] : null;
  const topClusters = threat.topClusters?.slice(0, 5) ?? [];
  const bias = threat.perspectiveBias ?? {};

  return (
    <div className="h-full overflow-y-auto px-4 py-3 flex flex-col gap-3">
      {/* Header: threat level */}
      <div className="flex items-center justify-between">
        <div>
          <span className="label text-[8px] text-[var(--t4)]">PHAROS ENGINE // THREAT ASSESSMENT</span>
          <div className="flex items-center gap-2 mt-1">
            <div
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: color }}
            />
            <span
              className="mono text-[18px] font-bold tracking-[0.08em]"
              style={{ color }}
            >
              {level}
            </span>
          </div>
        </div>
        <div className="text-right">
          {composite ? (
            <>
              <div className="label text-[8px] text-[var(--t4)]">COMPOSITE SCORE</div>
              <span className="mono text-[14px] text-[var(--t1)]">
                {(composite.compositeScore * 100).toFixed(0)}%
              </span>
              <div className="mono text-[8px] text-[var(--t4)]">
                ±{((composite.confidenceHigh - composite.confidenceLow) * 50).toFixed(0)} · {(composite.confidence * 100).toFixed(0)}% conf
              </div>
            </>
          ) : (
            <>
              <div className="label text-[8px] text-[var(--t4)]">ESCALATION</div>
              <span className="mono text-[14px] text-[var(--t1)]">
                {(threat.escalationScore * 100).toFixed(0)}%
              </span>
            </>
          )}
        </div>
      </div>

      {/* Composite factor decomposition */}
      {composite && composite.factors.length > 0 && (
        <div>
          <div className="label text-[8px] text-[var(--t4)] mb-1">
            THREAT FACTORS · DRIVER: {composite.dominantFactor.toUpperCase()}
          </div>
          <div className="flex flex-col gap-0.5">
            {composite.factors
              .sort((a, b) => b.score * b.weight - a.score * a.weight)
              .map((f) => (
                <FactorBar key={f.name} name={f.name} score={f.score} weight={f.weight} />
              ))}
          </div>
        </div>
      )}

      {/* Trend + forecast */}
      {trend && forecast && (
        <div className="flex items-center gap-3 px-3 py-2 bg-[var(--bg-2)] border border-[var(--bd)]">
          <div>
            <div className="label text-[8px] text-[var(--t4)]">TREND</div>
            <span className="mono text-[11px] font-bold" style={{ color: trend.color }}>
              {trend.label}
            </span>
          </div>
          <div className="w-px h-6 bg-[var(--bd)]" />
          <div>
            <div className="label text-[8px] text-[var(--t4)]">1H FORECAST</div>
            <span className="mono text-[11px] text-[var(--t2)]">
              {forecast.forecast1h.projected.toFixed(1)} ±{forecast.forecast1h.confidenceInterval.toFixed(1)}
            </span>
          </div>
          <div className="w-px h-6 bg-[var(--bd)]" />
          <div>
            <div className="label text-[8px] text-[var(--t4)]">6H FORECAST</div>
            <span className="mono text-[11px] text-[var(--t2)]">
              {forecast.forecast6h.projected.toFixed(1)} ±{forecast.forecast6h.confidenceInterval.toFixed(1)}
            </span>
          </div>
          {forecast.activePatterns.length > 0 && (
            <>
              <div className="w-px h-6 bg-[var(--bd)]" />
              <div>
                <div className="label text-[8px] text-[var(--t4)]">PATTERNS</div>
                <span className="mono text-[11px] text-[var(--warning)]">
                  {forecast.activePatterns.length} ACTIVE
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Top clusters */}
      {topClusters.length > 0 && (
        <div>
          <div className="label text-[8px] text-[var(--t4)] mb-1.5">
            TOP EVENTS ({clusters?.count ?? 0} TOTAL)
          </div>
          <div className="flex flex-col gap-1">
            {topClusters.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--bg-2)] border border-[var(--bd)]"
              >
                <span className={`sev-${c.severity.toLowerCase()} text-[8px]`}>
                  {c.severity}
                </span>
                <span className="text-[11px] text-[var(--t1)] truncate flex-1">
                  {c.canonicalTitle}
                </span>
                <span className="mono text-[9px] text-[var(--t4)] shrink-0">
                  {c.sourceCount} src · {c.perspectives.length} persp
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Perspective bias */}
      {Object.keys(bias).length > 0 && (
        <div>
          <div className="label text-[8px] text-[var(--t4)] mb-1.5">SOURCE PERSPECTIVE BIAS</div>
          <div className="flex gap-1.5 flex-wrap">
            {Object.entries(bias)
              .sort(([, a], [, b]) => b - a)
              .map(([perspective, weight]) => (
                <div
                  key={perspective}
                  className="px-2 py-0.5 bg-[var(--bg-2)] border border-[var(--bd)]"
                >
                  <span className="mono text-[9px] text-[var(--t3)]">
                    {perspective} {(weight * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="px-3 py-2 bg-[var(--bg-2)] border border-[var(--bd)] mt-auto"
           style={{ borderLeft: `3px solid ${color}` }}>
        <div className="label text-[8px] mb-0.5 text-[var(--t4)]">RECOMMENDATION</div>
        <p className="text-[11px] text-[var(--t2)] leading-snug">
          {composite?.recommendation ?? threat.recommendation}
        </p>
      </div>
    </div>
  );
}
