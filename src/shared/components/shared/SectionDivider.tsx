import { Separator } from '@/components/ui/separator';

/** Labelled horizontal rule used throughout the dashboard (section headers). */
export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-2">
      <span className="label text-[length:var(--text-tiny)] shrink-0">{label}</span>
      <Separator className="flex-1 bg-[var(--bd-s)]" />
    </div>
  );
}
