type Props = {
  label: string;
  subtitle: string;
  color: string;
  prob: string;
  body: string;
};

export function ScenarioCard({ label, subtitle, color, prob, body }: Props) {
  return (
    <div
      className="rounded-md border border-[var(--bd-s)] pl-3 pr-4 py-3"
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-xs font-bold text-[var(--t1)]">{label}</h4>
        <span
          className="mono text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ color, background: `${color}15` }}
        >
          {prob}
        </span>
      </div>
      <p className="text-[10px] text-[var(--t4)] mb-2">{subtitle}</p>
      <p className="text-xs text-[var(--t2)] leading-relaxed">{body}</p>
    </div>
  );
}
