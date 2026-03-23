import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function BriefSection({ number, title, children }: {
  number: string; title: string; children: React.ReactNode;
}) {
  return (
    <div className="mb-9">
      <div className="flex items-center gap-3 mb-4">
        <span className="mono text-[length:var(--text-label)] font-bold text-[var(--blue)]">
          {number}.
        </span>
        <h2 className="text-xs font-bold text-[var(--t1)] tracking-[0.10em] uppercase">
          {title}
        </h2>
        <Separator className="flex-1 bg-[var(--bd)]" />
      </div>
      {children}
    </div>
  );
}

export function EconChip({ label, val, sub, color }: {
  label: string; val: string; sub: string; color: string;
}) {
  return (
    <div
      className="px-3.5 py-2.5 min-w-[110px]"
      style={{ background: color + '12', border: `1px solid ${color}40` }}
    >
      <div className="label mb-1 text-[length:var(--text-tiny)] text-[var(--t4)]">{label}</div>
      <div className="mono text-[18px] font-bold leading-none" style={{ color }}>{val}</div>
      <div className="mono text-[length:var(--text-caption)] mt-[3px]" style={{ color }}>{sub}</div>
    </div>
  );
}

export function ScenarioCard({ label, subtitle, color, prob, body }: {
  label: string; subtitle: string; color: string; prob: string; body: string;
}) {
  return (
    <div
      className="px-4 py-3.5"
      style={{ background: color + '08', border: `1px solid ${color}35`, borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <span
          className="text-[length:var(--text-label)] font-bold tracking-[0.06em]"
          style={{ color }}
        >
          {label}
        </span>
        <span className="text-[length:var(--text-body-sm)] text-[var(--t2)] italic">{subtitle}</span>
        <Badge
          variant="outline"
          className="mono ml-auto text-[length:var(--text-caption)] font-bold rounded-sm"
          style={{ color, background: color + '20', borderColor: color + '50' }}
        >
          P={prob}
        </Badge>
      </div>
      <p className="text-[length:var(--text-body)] text-[var(--t2)] leading-relaxed">{body}</p>
    </div>
  );
}
