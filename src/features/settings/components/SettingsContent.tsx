'use client';

import Link from 'next/link';

import { AppearanceSettingsCard } from '@/features/settings/components/AppearanceSettingsCard';
import { NotificationSettingsCard } from '@/features/settings/components/NotificationSettingsCard';

export function SettingsContent() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto bg-[var(--bg-app)] px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-col gap-2 border-b border-[var(--bd)] pb-4">
          <Link href="/dashboard" className="mono text-[length:var(--text-label)] text-[var(--t4)] no-underline hover:text-[var(--t2)]">
            ← DASHBOARD
          </Link>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--t1)]">Settings</h1>
          <p className="max-w-2xl text-sm text-[var(--t3)]">
            Manage browser-level preferences, interface scaling, and notification behavior.
          </p>
        </div>

        <AppearanceSettingsCard />
        <NotificationSettingsCard />
      </div>
    </div>
  );
}
