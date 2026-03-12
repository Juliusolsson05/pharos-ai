type Props = {
  escalation: number; // 0–100
};

export function EscalationBar({ escalation }: Props) {
  const clamped = Math.max(0, Math.min(100, escalation));

  const color =
    clamped < 40 ? 'var(--success)'
    : clamped < 70 ? 'var(--warning)'
    : 'var(--danger)';

  return (
    <div className="h-[3px] w-full rounded-full bg-[var(--bg-3)]">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  );
}
