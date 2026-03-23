'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

import type { CookieConsent } from '@/shared/lib/analytics/consent';

type Props = {
  consent: CookieConsent | null;
  onOpenChange: (open: boolean) => void;
  onSave: (values: { analytics: boolean; preferences: boolean }) => void;
  open: boolean;
};

export function CookiePreferencesDialog({ consent, onOpenChange, onSave, open }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-theme="auto"
        className="border-[var(--bd)] bg-[var(--bg-1)] p-0 text-[var(--t1)] sm:max-w-xl"
      >
        <DialogHeader className="border-b border-[var(--bd)] px-6 py-5 text-left">
          <DialogTitle className="text-[var(--t1)]">Cookie Settings</DialogTitle>
          <DialogDescription className="text-[var(--t3)]">
            Necessary storage keeps core product behavior working. Analytics helps us understand usage and improve the app.
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <CookiePreferencesForm
            consent={consent}
            onOpenChange={onOpenChange}
            onSave={onSave}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CookiePreferencesForm({
  consent,
  onOpenChange,
  onSave,
}: Omit<Props, 'open'>) {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(consent?.analytics ?? true);
  const [preferencesEnabled, setPreferencesEnabled] = useState(consent?.preferences ?? true);

  return (
    <>
      <div className="flex flex-col gap-4 px-6 py-5">
        <div className="rounded-lg border border-[var(--bd)] bg-[var(--bg-2)] p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-[var(--t1)]">Necessary</span>
              <p className="text-sm text-[var(--t3)]">
                Required for core page rendering and request handling. This does not turn on persistent analytics or remembered preferences.
              </p>
            </div>
            <span className="mono rounded border border-[var(--success)] bg-[var(--success-dim)] px-2 py-1 text-[length:var(--text-label)] text-[var(--success)]">
              ALWAYS ON
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--bd)] bg-[var(--bg-2)] p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-[var(--t1)]">Preferences</span>
              <p className="text-sm text-[var(--t3)]">
                Allows remembered chat continuity, dashboard layout persistence, map UI preferences, and small convenience dismissals.
              </p>
            </div>
            <Switch
              checked={preferencesEnabled}
              onCheckedChange={setPreferencesEnabled}
              aria-label="Toggle preference storage"
              className="data-[state=checked]:bg-[var(--blue)] data-[state=unchecked]:bg-[var(--bg-3)]"
            />
          </div>
        </div>

        <div className="rounded-lg border border-[var(--bd)] bg-[var(--bg-2)] p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-[var(--t1)]">Analytics</span>
              <p className="text-sm text-[var(--t3)]">
                Allows PostHog and Vercel Analytics to measure page views and product usage so we can improve navigation, features, and performance.
              </p>
            </div>
            <Switch
              checked={analyticsEnabled}
              onCheckedChange={setAnalyticsEnabled}
              aria-label="Toggle analytics cookies"
              className="data-[state=checked]:bg-[var(--blue)] data-[state=unchecked]:bg-[var(--bg-3)]"
            />
          </div>
        </div>
      </div>

      <DialogFooter className="border-t border-[var(--bd)] px-6 py-4 sm:justify-between">
        <Button
          variant="outline"
          className="border-[var(--bd)] bg-[var(--bg-2)] text-[var(--t2)] hover:bg-[var(--bg-3)] hover:text-[var(--t1)]"
          onClick={() => onSave({ analytics: false, preferences: false })}
        >
          Reject optional storage
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="border-[var(--bd)] bg-[var(--bg-2)] text-[var(--t1)] hover:bg-[var(--bg-3)]"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-[var(--blue)] text-[var(--t1)] hover:bg-[var(--blue-l)]"
            onClick={() => onSave({ analytics: analyticsEnabled, preferences: preferencesEnabled })}
          >
            Save preferences
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
