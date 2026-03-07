import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type Props = { label: string; count: number; color: string };

/** Coloured section divider used in the signals feed (BREAKING / HIGH / STANDARD). */
export function SectionHeader({ label, count, color }: Props) {
  return (
    <div className="flex items-center gap-2.5 mb-2.5 py-1">
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: color }}
      />
      <span
        className="text-[10px] font-bold uppercase tracking-[0.08em] shrink-0"
        style={{ color }}
      >
        {label}
      </span>
      <Badge
        variant="outline"
        className="text-[8px] px-[5px] py-px rounded-sm shrink-0"
        style={{
          color,
          borderColor: `${color}60`,
          background: `${color}20`,
        }}
      >
        {count}
      </Badge>
      <Separator className="flex-1" style={{ background: `${color}30` }} />
    </div>
  );
}
