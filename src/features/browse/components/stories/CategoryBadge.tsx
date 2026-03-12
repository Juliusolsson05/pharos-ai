const CATEGORY_STYLE: Record<string, { color: string; bg: string }> = {
  STRIKE:      { color: 'var(--danger)',  bg: 'var(--danger-dim)' },
  RETALIATION: { color: 'var(--warning)', bg: 'var(--warning-dim)' },
  NAVAL:       { color: 'var(--info)',    bg: 'var(--info-dim)' },
  INTEL:       { color: 'var(--cyber)',   bg: 'var(--cyber-dim)' },
  DIPLOMATIC:  { color: 'var(--success)', bg: 'var(--success-dim)' },
};

type Props = {
  category: string;
};

export function CategoryBadge({ category }: Props) {
  const style = CATEGORY_STYLE[category] ?? { color: 'var(--t3)', bg: 'var(--bg-3)' };

  return (
    <span
      className="mono text-[9px] font-bold px-2 py-0.5 rounded-sm tracking-wider"
      style={{ color: style.color, background: style.bg }}
    >
      {category}
    </span>
  );
}
