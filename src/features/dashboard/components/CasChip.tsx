type Props = {
  label: string;
  val: string;
  color: string;
};

export function CasChip({ label, val, color }: Props) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="mono text-base font-bold leading-none" style={{ color }}>{val}</span>
      <span className="label text-[length:var(--text-tiny)] text-[var(--t4)]">{label}</span>
    </div>
  );
}
