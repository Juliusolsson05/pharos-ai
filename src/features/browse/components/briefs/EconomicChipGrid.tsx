import type { BrowseEconChip } from '@/types/domain';

type Props = {
  chips: BrowseEconChip[];
};

export function EconomicChipGrid({ chips }: Props) {
  if (chips.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {chips.map((chip) => (
        <div
          key={chip.label}
          className="rounded-md border px-3 py-2"
          style={{ borderColor: chip.color }}
        >
          <p className="text-[10px] text-[var(--t4)] uppercase tracking-wider mb-1">{chip.label}</p>
          <p className="text-sm font-bold text-[var(--t1)]">{chip.val}</p>
          <p className="text-[10px] text-[var(--t3)]">{chip.sub}</p>
        </div>
      ))}
    </div>
  );
}
