import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon?: LucideIcon;
  emoji?: string;
  message: string;
};

/** Centered empty state with optional icon or emoji. */
export function EmptyState({ icon: Icon, emoji, message }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2">
      {Icon && <Icon size={32} className="text-[var(--t3)]" strokeWidth={1} />}
      {emoji && <span className="text-2xl text-[var(--t3)]">{emoji}</span>}
      <span className="label text-[var(--t3)]">{message}</span>
    </div>
  );
}
