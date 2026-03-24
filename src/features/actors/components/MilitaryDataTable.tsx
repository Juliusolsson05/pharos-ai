'use client';

import { fmtPct, fmtPeople,fmtUsd } from '@/features/actors/components/MilitaryHelpers';

type Props = {
  allYears: number[];
  spendMap: Record<number, number>;
  gdpMap: Record<number, number>;
  forcesMap: Record<number, number>;
  inflationMap: Record<number, number>;
  growthMap: Record<number, number>;
};

export function MilitaryDataTable({
  allYears,
  spendMap,
  gdpMap,
  forcesMap,
  inflationMap,
  growthMap,
}: Props) {
  return (
    <div className="overflow-x-auto border border-[var(--bd)]">
      <table className="w-full text-[length:var(--text-body-sm)] min-w-[720px]">
        <thead>
          <tr className="border-b border-[var(--bd)] bg-[var(--bg-2)]">
            <th className="label text-[length:var(--text-tiny)] text-left py-1.5 px-3">YEAR</th>
            <th className="label text-[length:var(--text-tiny)] text-right py-1.5 px-3">SPENDING</th>
            <th className="label text-[length:var(--text-tiny)] text-right py-1.5 px-3">% GDP</th>
            <th className="label text-[length:var(--text-tiny)] text-right py-1.5 px-3">PERSONNEL</th>
            <th className="label text-[length:var(--text-tiny)] text-right py-1.5 px-3">INFLATION</th>
            <th className="label text-[length:var(--text-tiny)] text-right py-1.5 px-3">GDP GROWTH</th>
          </tr>
        </thead>
        <tbody>
          {allYears.map(year => (
            <tr key={year} className="border-b border-[var(--bd-s)] last:border-b-0">
              <td className="mono text-[var(--t2)] py-1.5 px-3">{year}</td>
              <td className="mono text-[var(--t1)] text-right py-1.5 px-3">
                {spendMap[year] != null ? fmtUsd(spendMap[year]) : '\u2014'}
              </td>
              <td className="mono text-[var(--t1)] text-right py-1.5 px-3">
                {gdpMap[year] != null ? fmtPct(gdpMap[year]) : '\u2014'}
              </td>
              <td className="mono text-[var(--t1)] text-right py-1.5 px-3">
                {forcesMap[year] != null ? fmtPeople(forcesMap[year]) : '\u2014'}
              </td>
              <td className="mono text-[var(--t1)] text-right py-1.5 px-3">
                {inflationMap[year] != null ? fmtPct(inflationMap[year]) : '\u2014'}
              </td>
              <td className="mono text-[var(--t1)] text-right py-1.5 px-3">
                {growthMap[year] != null ? fmtPct(growthMap[year]) : '\u2014'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
