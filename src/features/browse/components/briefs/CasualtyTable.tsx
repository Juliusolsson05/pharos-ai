import type { BrowseCasualty } from '@/types/domain';

type Props = {
  casualties: BrowseCasualty[];
};

export function CasualtyTable({ casualties }: Props) {
  if (casualties.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--bd)]">
            <th className="text-left py-2 pr-4 text-[var(--t4)] font-normal uppercase tracking-wider text-[10px]">Faction</th>
            <th className="text-right py-2 px-3 text-[var(--t4)] font-normal uppercase tracking-wider text-[10px]">Killed</th>
            <th className="text-right py-2 px-3 text-[var(--t4)] font-normal uppercase tracking-wider text-[10px]">Wounded</th>
            <th className="text-right py-2 px-3 text-[var(--t4)] font-normal uppercase tracking-wider text-[10px]">Civilians</th>
            <th className="text-right py-2 pl-3 text-[var(--t4)] font-normal uppercase tracking-wider text-[10px]">Injured</th>
          </tr>
        </thead>
        <tbody>
          {casualties.map((c) => (
            <tr key={c.faction} className="border-b border-[var(--bd-s)]">
              <td className="py-2 pr-4 text-[var(--t1)] font-medium capitalize">{c.faction}</td>
              <td className="text-right py-2 px-3 mono text-[var(--danger)]">{c.killed || '—'}</td>
              <td className="text-right py-2 px-3 mono text-[var(--warning)]">{c.wounded || '—'}</td>
              <td className="text-right py-2 px-3 mono text-[var(--t2)]">{c.civilians || '—'}</td>
              <td className="text-right py-2 pl-3 mono text-[var(--t2)]">{c.injured || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
