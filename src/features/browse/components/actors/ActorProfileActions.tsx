type Action = {
  id: string;
  date: string;
  type: string;
  description: string;
  verified: boolean;
  significance: string;
};

type Props = {
  actions: Action[];
};

const SIG_STYLE: Record<string, string> = {
  HIGH:   'var(--danger)',
  MEDIUM: 'var(--warning)',
  LOW:    'var(--t3)',
};

export function ActorProfileActions({ actions }: Props) {
  if (actions.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="label mb-3">Recent actions</h2>
      <div className="flex flex-col">
        {actions.map((action) => {
          const sigC = SIG_STYLE[action.significance] ?? 'var(--t3)';
          return (
            <div
              key={action.id}
              className="py-3 border-b border-[var(--bd-s)]"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="mono text-[10px] text-[var(--t4)]">{action.date}</span>
                <span className="mono text-[9px] font-bold px-1.5 py-0.5 rounded-sm" style={{ color: sigC, border: `1px solid ${sigC}` }}>
                  {action.significance}
                </span>
                <span className="mono text-[9px] text-[var(--t4)]">{action.type}</span>
                {action.verified && (
                  <span className="mono text-[8px] font-bold text-[var(--success)]">VERIFIED</span>
                )}
              </div>
              <p className="text-xs text-[var(--t2)] leading-relaxed">{action.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
