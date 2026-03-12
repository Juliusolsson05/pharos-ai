const TIER_STYLE: Record<number, string> = {
  1: 'text-[var(--success)] border-[var(--success-bd)] bg-[var(--success-dim)]',
  2: 'text-[var(--info)] border-[var(--info-bd)] bg-[var(--info-dim)]',
  3: 'text-[var(--t3)] border-[var(--bd)] bg-[var(--bg-2)]',
};

type Props = {
  tier: number;
};

export function SourceBadge({ tier }: Props) {
  return (
    <span className={`mono text-[9px] font-bold px-1.5 py-0.5 border ${TIER_STYLE[tier] ?? TIER_STYLE[3]}`}>
      T{tier}
    </span>
  );
}
