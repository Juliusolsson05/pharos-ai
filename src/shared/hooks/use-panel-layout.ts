/**
 * Safe wrapper around react-resizable-panels' useDefaultLayout.
 * Guards localStorage access so SSR/prerender doesn't crash.
 */
'use client';

import { useDefaultLayout } from 'react-resizable-panels';

import {
  hasPreferencesConsent,
  PANEL_LAYOUT_STORAGE_PREFIX,
} from '@/shared/lib/analytics/consent';

export function usePanelLayout(opts: Parameters<typeof useDefaultLayout>[0]) {
  return useDefaultLayout({
    ...opts,
    storage: consentAwareStorage,
  });
}

const consentAwareStorage = {
  getItem(key: string) {
    if (typeof window === 'undefined') return null;
    if (!hasPreferencesConsent()) return null;
    return window.localStorage.getItem(key);
  },
  removeItem(key: string) {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
  setItem(key: string, value: string) {
    if (typeof window === 'undefined') return;
    if (!hasPreferencesConsent()) return;

    window.localStorage.setItem(key, value);
    if (key.startsWith(PANEL_LAYOUT_STORAGE_PREFIX)) {
      window.dispatchEvent(new CustomEvent('pharos-cookie-consent-changed'));
    }
  },
};
