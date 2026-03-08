'use client';

import {
  useNetworkCoverage,
  useEchoChambers,
  useCoReportingPairs,
} from '@/features/dashboard/queries/engine';

const RISK_COLORS: Record<string, string> = {
  HIGH: 'var(--danger)',
  MEDIUM: 'var(--warning)',
  LOW: 'var(--info)',
};

const RELATIONSHIP_COLORS: Record<string, string> = {
  ECHO: 'var(--danger)',
  CORRELATED: 'var(--warning)',
  RELATED: 'var(--info)',
  INDEPENDENT: 'var(--success)',
};

export function SourceNetworkWidget() {
  const { data: coverage, isLoading: cLoading } = useNetworkCoverage();
  const { data: chambersData } = useEchoChambers();
  const { data: pairsData } = useCoReportingPairs();

  if (cLoading || !coverage) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="mono text-[10px] text-[var(--t4)]">LOADING SOURCE NETWORK...</span>
      </div>
    );
  }

  const chambers = chambersData?.echoChambers ?? [];
  const pairs = pairsData?.pairs?.slice(0, 10) ?? [];
  const perspEntries = Object.entries(coverage.perspectiveCoverage)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="h-full overflow-y-auto px-4 py-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="label text-[8px] text-[var(--t4)]">PHAROS ENGINE // SOURCE NETWORK ANALYSIS</span>
        <span className="mono text-[9px] text-[var(--t4)]">
          {coverage.totalClusters} clusters analyzed
        </span>
      </div>

      {/* Independence score — the key metric */}
      <div className="flex items-center gap-4">
        <div>
          <div className="label text-[8px] text-[var(--t4)]">INDEPENDENCE SCORE</div>
          <span
            className="mono text-[22px] font-bold"
            style={{
              color:
                coverage.independenceScore > 0.6
                  ? 'var(--success)'
                  : coverage.independenceScore > 0.3
                    ? 'var(--warning)'
                    : 'var(--danger)',
            }}
          >
            {(coverage.independenceScore * 100).toFixed(0)}%
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 flex-1">
          {[
            { label: 'SINGLE SRC', value: coverage.singleSourceClusters, bad: true },
            { label: 'SINGLE PERSP', value: coverage.singlePerspectiveClusters, bad: true },
            { label: 'MULTI PERSP', value: coverage.multiPerspectiveClusters, bad: false },
          ].map(({ label, value, bad }) => (
            <div key={label} className="px-2 py-1.5 bg-[var(--bg-2)] border border-[var(--bd)]">
              <div className="label text-[8px] text-[var(--t4)]">{label}</div>
              <span
                className="mono text-[13px] font-bold"
                style={{
                  color: bad && value > coverage.totalClusters * 0.5
                    ? 'var(--danger)'
                    : 'var(--t1)',
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Perspective coverage bars */}
      {perspEntries.length > 0 && (
        <div>
          <div className="label text-[8px] text-[var(--t4)] mb-1">PERSPECTIVE COVERAGE</div>
          <div className="flex flex-col gap-0.5">
            {perspEntries.map(([persp, ratio]) => (
              <div key={persp} className="flex items-center gap-2">
                <span className="mono text-[9px] text-[var(--t3)] w-20 truncate">{persp}</span>
                <div className="flex-1 h-1.5 bg-[var(--bg-2)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(ratio * 100, 1).toFixed(0)}%`,
                      backgroundColor:
                        ratio < 0.1
                          ? 'var(--danger)'
                          : ratio < 0.3
                            ? 'var(--warning)'
                            : 'var(--info)',
                    }}
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

      {/* Coverage gaps */}
      {coverage.coverageGaps.length > 0 && (
        <div>
          <div className="label text-[8px] text-[var(--t4)] mb-1">COVERAGE BLIND SPOTS</div>
          {coverage.coverageGaps.map((gap, i) => (
            <div
              key={i}
              className="px-2.5 py-1.5 mb-1 bg-[var(--bg-2)] border border-[var(--bd)]"
              style={{ borderLeft: '3px solid var(--danger)' }}
            >
              <span className="mono text-[10px] font-bold text-[var(--danger)]">{gap.perspective}</span>
              <p className="text-[10px] text-[var(--t3)]">{gap.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Echo chambers */}
      {chambers.length > 0 && (
        <div>
          <div className="label text-[8px] text-[var(--t4)] mb-1.5">ECHO CHAMBERS</div>
          {chambers.map((ch, i) => (
            <div
              key={i}
              className="px-2.5 py-1.5 mb-1 bg-[var(--bg-2)] border border-[var(--bd)]"
              style={{
                borderLeft: `3px solid ${RISK_COLORS[ch.riskLevel] ?? 'var(--info)'}`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="mono text-[10px] font-bold text-[var(--t1)]">{ch.perspective}</span>
                <span
                  className="mono text-[9px] font-bold"
                  style={{ color: RISK_COLORS[ch.riskLevel] ?? 'var(--t2)' }}
                >
                  {ch.riskLevel}
                </span>
              </div>
              <p className="text-[10px] text-[var(--t3)] mt-0.5">{ch.description}</p>
              <div className="mono text-[8px] text-[var(--t4)] mt-0.5">
                {ch.feedIds.length} sources · {(ch.avgSimilarity * 100).toFixed(0)}% overlap · {ch.sharedClusters}/{ch.totalClusters} shared
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top co-reporting pairs */}
      {pairs.length > 0 && (
        <div>
          <div className="label text-[8px] text-[var(--t4)] mb-1">TOP CO-REPORTING PAIRS</div>
          <div className="flex flex-col gap-0.5">
            {pairs.map((p, i) => {
              const rel =
                p.jaccardSimilarity > 0.7
                  ? 'ECHO'
                  : p.jaccardSimilarity > 0.4
                    ? 'CORRELATED'
                    : p.jaccardSimilarity > 0.1
                      ? 'RELATED'
                      : 'INDEPENDENT';
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-2)] border border-[var(--bd)]"
                >
                  <span className="mono text-[9px] text-[var(--t2)] flex-1 truncate">
                    {p.feedIdA} ↔ {p.feedIdB}
                  </span>
                  <span className="mono text-[8px] text-[var(--t4)]">
                    {p.coReportCount} shared
                  </span>
                  <span
                    className="mono text-[8px] font-bold"
                    style={{ color: RELATIONSHIP_COLORS[rel] ?? 'var(--t3)' }}
                  >
                    {rel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {coverage.totalClusters === 0 && (
        <div className="px-2.5 py-2 bg-[var(--bg-2)] border border-[var(--bd)] text-center">
          <span className="mono text-[10px] text-[var(--t4)]">NO SOURCE DATA YET — AWAITING FEED INGESTION</span>
        </div>
      )}
    </div>
  );
}
