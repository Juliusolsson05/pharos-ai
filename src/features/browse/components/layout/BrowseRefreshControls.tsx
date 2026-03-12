'use client';

import { Button } from '@/components/ui/button';

import { useBrowseAutoRefresh } from '@/features/browse/hooks/use-browse-auto-refresh';

export function BrowseRefreshControls() {
  const { refreshing, refresh } = useBrowseAutoRefresh();

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={refresh}
      disabled={refreshing}
      className="text-[var(--t4)] hover:text-[var(--t2)] disabled:opacity-40"
      aria-label="Refresh data"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className={refreshing ? 'animate-spin' : ''}
      >
        <path d="M1 6a5 5 0 0 1 9-3M11 6a5 5 0 0 1-9 3" />
        <path d="M1 1v4h4M11 11v-4h-4" />
      </svg>
    </Button>
  );
}
