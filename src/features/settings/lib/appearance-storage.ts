'use client';

import { hasPreferencesConsent } from '@/shared/lib/analytics/consent';

export const APPEARANCE_PREFS_STORAGE_KEY = 'pharos:appearance:v1';

export type UiScale = 'compact' | 'default' | 'large';

export type AppearancePrefs = {
  version: 1;
  uiScale: UiScale;
};

export const DEFAULT_APPEARANCE_PREFS: AppearancePrefs = {
  version: 1,
  uiScale: 'default',
};

export function readAppearancePrefs(): AppearancePrefs {
  if (typeof window === 'undefined' || !hasPreferencesConsent()) {
    return DEFAULT_APPEARANCE_PREFS;
  }

  try {
    return parseAppearancePrefs(window.localStorage.getItem(APPEARANCE_PREFS_STORAGE_KEY));
  } catch {
    return DEFAULT_APPEARANCE_PREFS;
  }
}

export function parseAppearancePrefs(raw: string | null): AppearancePrefs {
  if (!raw) return DEFAULT_APPEARANCE_PREFS;

  try {
    const parsed = JSON.parse(raw) as Partial<AppearancePrefs>;
    return {
      version: 1,
      uiScale: isUiScale(parsed.uiScale) ? parsed.uiScale : 'default',
    };
  } catch {
    return DEFAULT_APPEARANCE_PREFS;
  }
}

export function writeAppearancePrefs(next: AppearancePrefs) {
  if (typeof window === 'undefined' || !hasPreferencesConsent()) return;

  window.localStorage.setItem(APPEARANCE_PREFS_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('pharos-appearance-prefs-changed'));
}

export function patchAppearancePrefs(patch: Partial<AppearancePrefs>) {
  writeAppearancePrefs({
    ...readAppearancePrefs(),
    ...patch,
    version: 1,
  });
}

export function subscribeToAppearancePrefs(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handleChange = () => callback();
  window.addEventListener('storage', handleChange);
  window.addEventListener('pharos-appearance-prefs-changed', handleChange);
  window.addEventListener('pharos-cookie-consent-changed', handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener('pharos-appearance-prefs-changed', handleChange);
    window.removeEventListener('pharos-cookie-consent-changed', handleChange);
  };
}

export function getAppearancePrefsSnapshot() {
  if (typeof window === 'undefined' || !hasPreferencesConsent()) return null;
  return window.localStorage.getItem(APPEARANCE_PREFS_STORAGE_KEY);
}

export function getServerAppearancePrefsSnapshot() {
  return null;
}

export function applyUiScale(uiScale: UiScale) {
  if (typeof document === 'undefined') return;

  document.documentElement.dataset.uiScale = uiScale;
}

function isUiScale(value: unknown): value is UiScale {
  return value === 'compact' || value === 'default' || value === 'large';
}
