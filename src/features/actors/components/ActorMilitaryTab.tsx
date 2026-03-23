'use client';

import { ScrollArea } from '@/components/ui/scroll-area';

import { MilitaryDataTable } from '@/features/actors/components/MilitaryDataTable';
import {
fmtIndex,
fmtPct, fmtPeople, fmtUsd,   latestPoint, MetricCard, Skeleton,
Sparkline, YoyBadge,   yoyChange, } from '@/features/actors/components/MilitaryHelpers';
import { useMilitarySpending } from '@/features/actors/queries/world-bank';
import { SectionDivider } from '@/shared/components/shared/SectionDivider';

import type { Actor } from '@/types/domain';

type Props = { actor: Actor; iso3: string; pageScroll?: boolean };

function EmptyState({ pageScroll }: { pageScroll: boolean }) {
  return (
    <ScrollArea className="h-full">
      <div className={pageScroll ? 'safe-px p-12 text-center' : 'p-12 text-center'}>
        <p className="label text-[var(--t3)]">No World Bank profile available for this actor</p>
      </div>
    </ScrollArea>
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
  if (!profile || isError) return <EmptyState pageScroll={pageScroll} />;

  const latestSpending = latestPoint(profile.spending);
  const latestGdp = latestPoint(profile.gdpPct);
  const latestForces = latestPoint(profile.armedForces);
  const latestInflation = latestPoint(profile.inflation);
  const latestGrowth = latestPoint(profile.gdpGrowth);
  const latestRefugees = latestPoint(profile.refugeePopulation);
  const latestGini = latestPoint(profile.gini);

  const hasAnyData = [
    latestSpending, latestGdp, latestForces, latestInflation,
    latestGrowth, latestRefugees, latestGini,
  ].some(Boolean);

  if (!hasAnyData) return <EmptyState pageScroll={pageScroll} />;

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
          <div className="label text-[length:var(--text-tiny)] text-[var(--t4)] mb-1">WORLD BANK COUNTRY PROFILE</div>
          <div className="text-[length:var(--text-body)] font-bold text-[var(--t1)]">{actor.fullName}</div>
          <div className="mono text-[length:var(--text-caption)] text-[var(--t4)] mt-1">
            Long-range state capacity and macro-stability indicators for actor-linked country data.
          </div>
        </div>

        <div className="grid grid-cols-1 min-[540px]:grid-cols-2 gap-3 mb-5">
          {latestSpending && <MetricCard label="MILITARY EXPENDITURE" value={fmtUsd(latestSpending.value)} sublabel={`${latestSpending.year} \u00B7 CURRENT USD`} tone="var(--t1)" />}
          {latestGdp && <MetricCard label="DEFENSE SHARE OF GDP" value={fmtPct(latestGdp.value)} sublabel={`${latestGdp.year} \u00B7 PERCENT OF GDP`} tone="var(--warning)" />}
          {latestForces && <MetricCard label="ARMED FORCES PERSONNEL" value={fmtPeople(latestForces.value)} sublabel={`${latestForces.year} \u00B7 TOTAL PERSONNEL`} tone="var(--blue)" />}
          {latestGrowth && <MetricCard label="GDP GROWTH" value={fmtPct(latestGrowth.value)} sublabel={`${latestGrowth.year} \u00B7 ANNUAL GROWTH`} tone={latestGrowth.value >= 0 ? 'var(--success)' : 'var(--danger)'} />}
          {latestInflation && <MetricCard label="INFLATION" value={fmtPct(latestInflation.value)} sublabel={`${latestInflation.year} \u00B7 CPI`} tone={latestInflation.value >= 10 ? 'var(--danger)' : 'var(--warning)'} />}
          {latestGini && <MetricCard label="GINI COEFFICIENT" value={fmtIndex(latestGini.value)} sublabel={`${latestGini.year} \u00B7 INEQUALITY INDEX`} tone="var(--t2)" />}
        </div>

        {(latestRefugees || latestInflation || latestGrowth || latestGini) && (
          <div className="mb-5">
            <SectionDivider label="STABILITY SIGNALS" />
            <div className="grid grid-cols-1 min-[540px]:grid-cols-2 gap-3">
              {latestRefugees && <MetricCard label="REFUGEE POPULATION HOSTED" value={fmtPeople(latestRefugees.value)} sublabel={`${latestRefugees.year} \u00B7 COUNTRY OF ASYLUM`} tone="var(--info)" />}
              {latestInflation && <MetricCard label="PRICE PRESSURE" value={fmtPct(latestInflation.value)} sublabel={`${latestInflation.year} \u00B7 HIGHER CAN SIGNAL INSTABILITY`} tone={latestInflation.value >= 10 ? 'var(--danger)' : 'var(--warning)'} />}
              {latestGrowth && <MetricCard label="ECONOMIC MOMENTUM" value={fmtPct(latestGrowth.value)} sublabel={`${latestGrowth.year} \u00B7 REAL GDP GROWTH`} tone={latestGrowth.value >= 0 ? 'var(--success)' : 'var(--danger)'} />}
              {latestGini && <MetricCard label="SOCIAL STRAIN" value={fmtIndex(latestGini.value)} sublabel={`${latestGini.year} \u00B7 GINI / INEQUALITY`} tone="var(--t2)" />}
            </div>
          </div>
        )}

        {profile.spending.length >= 2 && (
          <div className="mb-5">
            <SectionDivider label="SPENDING TREND" />
            <div className="border border-[var(--bd)] p-2">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-[length:var(--text-body-sm)] font-semibold text-[var(--t2)]">Military expenditure</span>
                <YoyBadge pts={profile.spending} />
              </div>
              <Sparkline data={profile.spending} color={trendColor} />
              <div className="flex justify-between mt-1">
                <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)]">{profile.spending[0].year}</span>
                <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)]">{profile.spending[profile.spending.length - 1].year}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mb-5">
          <SectionDivider label="YEARLY BREAKDOWN" />
          <MilitaryDataTable allYears={allYears} spendMap={spendMap} gdpMap={gdpMap} forcesMap={forcesMap} inflationMap={inflationMap} growthMap={growthMap} />
        </div>
      </div>
    </ScrollArea>
  );
}
