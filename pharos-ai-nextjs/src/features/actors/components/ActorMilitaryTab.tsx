'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { SectionDivider } from '@/shared/components/shared/SectionDivider';
import { useMilitarySpending, type MilSpendPoint } from '@/features/actors/queries/world-bank';
import type { Actor } from '@/types/domain';

type Props = {
  actor: Actor;
  iso3: string;
  pageScroll?: boolean;
};

function latestPoint(points: MilSpendPoint[]): MilSpendPoint | null {
  return points.length > 0 ? points[points.length - 1] : null;
}

function fmtUsd(val: number): string {
  if (val >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
  return `$${val.toLocaleString()}`;
}

function fmtPct(val: number): string {
  return `${val.toFixed(2)}%`;
}

function fmtPeople(val: number): string {
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(0)}K`;
  return Math.round(val).toLocaleString();
}

function fmtIndex(val: number): string {
  return val.toFixed(1);
}

function yoyChange(pts: MilSpendPoint[]): { delta: number; pct: number } | null {
  if (pts.length < 2) return null;
  const curr = pts[pts.length - 1].value;
  const prev = pts[pts.length - 2].value;
  if (prev === 0) return null;
  return { delta: curr - prev, pct: ((curr - prev) / prev) * 100 };
}

function Sparkline({ data, color }: { data: MilSpendPoint[]; color: string }) {
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

function YoyBadge({ pts }: { pts: MilSpendPoint[] }) {
  const change = yoyChange(pts);
  if (!change) return null;

  const positive = change.delta >= 0;
  const color = positive ? 'var(--success)' : 'var(--danger)';
  const arrow = positive ? '▲' : '▼';

  return (
    <span className="mono text-[10px] ml-2" style={{ color }}>
      {arrow} {Math.abs(change.pct).toFixed(1)}% YoY
    </span>
  );
}

function MetricCard({
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
      <div className="label text-[8px] text-[var(--t4)] mb-1">{label}</div>
      <div className="mono text-[18px] font-bold leading-none" style={{ color: tone }}>{value}</div>
      <div className="mono text-[8px] text-[var(--t4)] mt-2">{sublabel}</div>
    </div>
  );
}

function Skeleton() {
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

export function ActorMilitaryTab({ actor, iso3, pageScroll = false }: Props) {
  const { data, isLoading, isError } = useMilitarySpending([iso3]);

  if (isLoading) {
    return (
      <ScrollArea className="h-full">
        <div className={pageScroll ? 'safe-px' : ''}><Skeleton /></div>
      </ScrollArea>
    );
  }

  const profile = data?.[iso3];

  if (!profile || isError) {
    return (
      <ScrollArea className="h-full">
        <div className={pageScroll ? 'safe-px p-12 text-center' : 'p-12 text-center'}>
          <p className="label text-[var(--t3)]">No World Bank profile available for this actor</p>
        </div>
      </ScrollArea>
    );
  }

  const latestSpending = latestPoint(profile.spending);
  const latestGdp = latestPoint(profile.gdpPct);
  const latestForces = latestPoint(profile.armedForces);
  const latestInflation = latestPoint(profile.inflation);
  const latestGrowth = latestPoint(profile.gdpGrowth);
  const latestRefugees = latestPoint(profile.refugeePopulation);
  const latestGini = latestPoint(profile.gini);

  const hasAnyData = [
    latestSpending,
    latestGdp,
    latestForces,
    latestInflation,
    latestGrowth,
    latestRefugees,
    latestGini,
  ].some(Boolean);

  if (!hasAnyData) {
    return (
      <ScrollArea className="h-full">
        <div className={pageScroll ? 'safe-px p-12 text-center' : 'p-12 text-center'}>
          <p className="label text-[var(--t3)]">No World Bank profile available for this actor</p>
        </div>
      </ScrollArea>
    );
  }

  const spendChange = yoyChange(profile.spending);
  const trendPositive = spendChange ? spendChange.delta >= 0 : true;
  const trendColor = trendPositive ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)';

  const allYears = [...new Set([
    ...profile.spending.map(d => d.year),
    ...profile.gdpPct.map(d => d.year),
    ...profile.armedForces.map(d => d.year),
    ...profile.inflation.map(d => d.year),
    ...profile.gdpGrowth.map(d => d.year),
  ])].sort((a, b) => b - a);

  const spendMap = Object.fromEntries(profile.spending.map(d => [d.year, d.value]));
  const gdpMap = Object.fromEntries(profile.gdpPct.map(d => [d.year, d.value]));
  const forcesMap = Object.fromEntries(profile.armedForces.map(d => [d.year, d.value]));
  const inflationMap = Object.fromEntries(profile.inflation.map(d => [d.year, d.value]));
  const growthMap = Object.fromEntries(profile.gdpGrowth.map(d => [d.year, d.value]));

  return (
    <ScrollArea className="h-full">
      <div className={pageScroll ? 'safe-px py-[18px]' : 'px-[22px] py-[18px]'}>
        <div className="mb-5 border border-[var(--bd)] bg-[var(--bg-2)] px-3 py-3">
          <div className="label text-[8px] text-[var(--t4)] mb-1">WORLD BANK COUNTRY PROFILE</div>
          <div className="text-[13px] font-bold text-[var(--t1)]">{actor.fullName}</div>
          <div className="mono text-[9px] text-[var(--t4)] mt-1">
            Long-range state capacity and macro-stability indicators for actor-linked country data.
          </div>
        </div>

        <div className="grid grid-cols-1 min-[540px]:grid-cols-2 gap-3 mb-5">
          {latestSpending && (
            <MetricCard
              label="MILITARY EXPENDITURE"
              value={fmtUsd(latestSpending.value)}
              sublabel={`${latestSpending.year} · CURRENT USD`}
              tone="var(--t1)"
            />
          )}
          {latestGdp && (
            <MetricCard
              label="DEFENSE SHARE OF GDP"
              value={fmtPct(latestGdp.value)}
              sublabel={`${latestGdp.year} · PERCENT OF GDP`}
              tone="var(--warning)"
            />
          )}
          {latestForces && (
            <MetricCard
              label="ARMED FORCES PERSONNEL"
              value={fmtPeople(latestForces.value)}
              sublabel={`${latestForces.year} · TOTAL PERSONNEL`}
              tone="var(--blue)"
            />
          )}
          {latestGrowth && (
            <MetricCard
              label="GDP GROWTH"
              value={fmtPct(latestGrowth.value)}
              sublabel={`${latestGrowth.year} · ANNUAL GROWTH`}
              tone={latestGrowth.value >= 0 ? 'var(--success)' : 'var(--danger)'}
            />
          )}
          {latestInflation && (
            <MetricCard
              label="INFLATION"
              value={fmtPct(latestInflation.value)}
              sublabel={`${latestInflation.year} · CPI`}
              tone={latestInflation.value >= 10 ? 'var(--danger)' : 'var(--warning)'}
            />
          )}
          {latestGini && (
            <MetricCard
              label="GINI COEFFICIENT"
              value={fmtIndex(latestGini.value)}
              sublabel={`${latestGini.year} · INEQUALITY INDEX`}
              tone="var(--t2)"
            />
          )}
        </div>

        {(latestRefugees || latestInflation || latestGrowth || latestGini) && (
          <div className="mb-5">
            <SectionDivider label="STABILITY SIGNALS" />
            <div className="grid grid-cols-1 min-[540px]:grid-cols-2 gap-3">
              {latestRefugees && (
                <MetricCard
                  label="REFUGEE POPULATION HOSTED"
                  value={fmtPeople(latestRefugees.value)}
                  sublabel={`${latestRefugees.year} · COUNTRY OF ASYLUM`}
                  tone="var(--info)"
                />
              )}
              {latestInflation && (
                <MetricCard
                  label="PRICE PRESSURE"
                  value={fmtPct(latestInflation.value)}
                  sublabel={`${latestInflation.year} · HIGHER CAN SIGNAL INSTABILITY`}
                  tone={latestInflation.value >= 10 ? 'var(--danger)' : 'var(--warning)'}
                />
              )}
              {latestGrowth && (
                <MetricCard
                  label="ECONOMIC MOMENTUM"
                  value={fmtPct(latestGrowth.value)}
                  sublabel={`${latestGrowth.year} · REAL GDP GROWTH`}
                  tone={latestGrowth.value >= 0 ? 'var(--success)' : 'var(--danger)'}
                />
              )}
              {latestGini && (
                <MetricCard
                  label="SOCIAL STRAIN"
                  value={fmtIndex(latestGini.value)}
                  sublabel={`${latestGini.year} · GINI / INEQUALITY`}
                  tone="var(--t2)"
                />
              )}
            </div>
          </div>
        )}

        {profile.spending.length >= 2 && (
          <div className="mb-5">
            <SectionDivider label="SPENDING TREND" />
            <div className="border border-[var(--bd)] p-2">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-[11px] font-semibold text-[var(--t2)]">Military expenditure</span>
                <YoyBadge pts={profile.spending} />
              </div>
              <Sparkline data={profile.spending} color={trendColor} />
              <div className="flex justify-between mt-1">
                <span className="mono text-[8px] text-[var(--t4)]">{profile.spending[0].year}</span>
                <span className="mono text-[8px] text-[var(--t4)]">{profile.spending[profile.spending.length - 1].year}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mb-5">
          <SectionDivider label="YEARLY BREAKDOWN" />
          <div className="overflow-x-auto border border-[var(--bd)]">
            <table className="w-full text-[11px] min-w-[720px]">
              <thead>
                <tr className="border-b border-[var(--bd)] bg-[var(--bg-2)]">
                  <th className="label text-[8px] text-left py-1.5 px-3">YEAR</th>
                  <th className="label text-[8px] text-right py-1.5 px-3">SPENDING</th>
                  <th className="label text-[8px] text-right py-1.5 px-3">% GDP</th>
                  <th className="label text-[8px] text-right py-1.5 px-3">PERSONNEL</th>
                  <th className="label text-[8px] text-right py-1.5 px-3">INFLATION</th>
                  <th className="label text-[8px] text-right py-1.5 px-3">GDP GROWTH</th>
                </tr>
              </thead>
              <tbody>
                {allYears.map(year => (
                  <tr key={year} className="border-b border-[var(--bd-s)] last:border-b-0">
                    <td className="mono text-[var(--t2)] py-1.5 px-3">{year}</td>
                    <td className="mono text-[var(--t1)] text-right py-1.5 px-3">
                      {spendMap[year] != null ? fmtUsd(spendMap[year]) : '—'}
                    </td>
                    <td className="mono text-[var(--t1)] text-right py-1.5 px-3">
                      {gdpMap[year] != null ? fmtPct(gdpMap[year]) : '—'}
                    </td>
                    <td className="mono text-[var(--t1)] text-right py-1.5 px-3">
                      {forcesMap[year] != null ? fmtPeople(forcesMap[year]) : '—'}
                    </td>
                    <td className="mono text-[var(--t1)] text-right py-1.5 px-3">
                      {inflationMap[year] != null ? fmtPct(inflationMap[year]) : '—'}
                    </td>
                    <td className="mono text-[var(--t1)] text-right py-1.5 px-3">
                      {growthMap[year] != null ? fmtPct(growthMap[year]) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
