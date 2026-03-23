'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';

type Props = {
  onAcceptAll: () => void;
  onManage: () => void;
  onRejectOptional: () => void;
};

export function CookieBanner({ onAcceptAll, onManage, onRejectOptional }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] px-2 pb-2 sm:px-3 sm:pb-3">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 rounded-lg border border-[var(--bd)] bg-[color:color-mix(in_srgb,var(--bg-1)_92%,black)] px-3 py-2 shadow-2xl shadow-black/25 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[length:var(--text-body-sm)] leading-4 text-[var(--t2)] sm:text-xs">
            Necessary storage is always on. Optional preferences and analytics need consent.
            {' '}
            <Link href="/cookies" className="no-underline text-[var(--blue-l)] hover:text-[var(--t1)]">Learn more</Link>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="xs"
            className="border-[var(--bd)] bg-[var(--bg-2)] text-[length:var(--text-label)] text-[var(--t2)] hover:bg-[var(--bg-3)] hover:text-[var(--t1)]"
            onClick={onRejectOptional}
          >
            Reject optional
          </Button>
          <Button
            variant="outline"
            size="xs"
            className="border-[var(--bd)] bg-[var(--bg-2)] text-[length:var(--text-label)] text-[var(--t1)] hover:bg-[var(--bg-3)]"
            onClick={onManage}
          >
            Manage
          </Button>
          <Button
            size="xs"
            className="bg-[var(--blue)] text-[length:var(--text-label)] text-[var(--t1)] hover:bg-[var(--blue-l)]"
            onClick={onAcceptAll}
          >
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}
