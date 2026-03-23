'use client';

import { useSyncExternalStore } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  getAppearancePrefsSnapshot,
  getServerAppearancePrefsSnapshot,
  parseAppearancePrefs,
  patchAppearancePrefs,
  subscribeToAppearancePrefs,
  type UiScale,
} from '@/features/settings/lib/appearance-storage';

import { hasPreferencesConsent } from '@/shared/lib/analytics/consent';

export function AppearanceSettingsCard() {
  const prefsSnapshot = useSyncExternalStore(
    subscribeToAppearancePrefs,
    getAppearancePrefsSnapshot,
    getServerAppearancePrefsSnapshot,
  );
  const prefs = parseAppearancePrefs(prefsSnapshot);
  const canPersistPreferences = hasPreferencesConsent();

  return (
    <Card className="border-[var(--bd)] bg-[var(--bg-1)] py-0 shadow-none">
      <CardHeader className="border-b border-[var(--bd)] px-5 py-4">
        <CardTitle className="text-[var(--t1)]">Appearance</CardTitle>
        <CardDescription className="text-[var(--t3)]">
          Scale shared UI typography across the dashboard for a more compact or more readable experience. Coverage is expanding across screens.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-5 py-5">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--t4)]">UI scale</span>
          <Select
            value={prefs.uiScale}
            disabled={!canPersistPreferences}
            onValueChange={value => patchAppearancePrefs({ uiScale: value as UiScale })}
          >
            <SelectTrigger className="w-full border-[var(--bd)] bg-[var(--bg-2)] text-[var(--t1)] md:max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-[var(--bd)] bg-[var(--bg-1)] text-[var(--t1)]">
              <SelectItem className="focus:bg-[var(--bg-3)] focus:text-[var(--t1)]" value="compact">Compact</SelectItem>
              <SelectItem className="focus:bg-[var(--bg-3)] focus:text-[var(--t1)]" value="default">Default</SelectItem>
              <SelectItem className="focus:bg-[var(--bg-3)] focus:text-[var(--t1)]" value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-[var(--t4)]">
          Changes the size of labels, captions, and body text across dashboard panels.
          {!canPersistPreferences ? ' Preference storage is currently unavailable, so changes are disabled.' : ''}
        </p>
      </CardContent>
    </Card>
  );
}
