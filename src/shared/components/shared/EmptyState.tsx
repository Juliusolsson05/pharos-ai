import { AlertTriangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

type EmptyStateProps = {
  icon?: LucideIcon;
  emoji?: string;
  message: string;
  variant?: 'empty' | 'error';
  onRetry?: () => void;
};

/** Centered empty state with optional icon or emoji. */
export function EmptyState({ icon: Icon, emoji, message, variant = 'empty', onRetry }: EmptyStateProps) {
  if (variant === 'error') {
    const ErrorIcon = Icon ?? AlertTriangle;

    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4 text-center">
        <ErrorIcon size={32} className="text-[var(--danger)]" strokeWidth={1.25} />
        <span className="label text-[var(--danger)]">Something went wrong</span>
        <span className="mono text-[length:var(--text-label)] text-[var(--t3)]">{message}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 h-8 px-3 text-[length:var(--text-label)] mono tracking-[0.06em]">
            TRY AGAIN
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2">
      {Icon && <Icon size={32} className="text-[var(--t3)]" strokeWidth={1} />}
      {emoji && <span className="text-2xl text-[var(--t3)]">{emoji}</span>}
      <span className="label text-[var(--t3)]">{message}</span>
    </div>
  );
}
