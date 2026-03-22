'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';

import { usePathname } from 'next/navigation';

import { Analytics } from '@vercel/analytics/react';

import { CookieBanner } from '@/shared/components/privacy/CookieBanner';
import { CookiePreferencesDialog } from '@/shared/components/privacy/CookiePreferencesDialog';

import { capturePageview, syncAnalyticsConsent } from '@/shared/lib/analytics/client';
import {
  clearPreferenceStorage,
  COOKIE_CONSENT_STORAGE_KEY,
  type CookieConsent,
  createConsent,
  getEffectiveConsent,
  isConsentRegion,
  parseStoredConsent,
  writeStoredConsent,
} from '@/shared/lib/analytics/consent';
import { publicAnalyticsEnabled } from '@/shared/lib/env';

import { SHOW_COOKIE_CONTROLS } from '@/shared/config/privacy';

type CookieConsentContextValue = {
  consent: CookieConsent | null;
  hasHydrated: boolean;
  openPreferences: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const pathname = usePathname();
  const consentSnapshot = useSyncExternalStore(subscribeToConsent, getConsentSnapshot, getServerConsentSnapshot);
  const hasHydrated = useSyncExternalStore(subscribeToHydration, getHydratedSnapshot, getServerHydratedSnapshot);
  const storedConsent = useMemo(() => parseStoredConsent(consentSnapshot), [consentSnapshot]);
  const consent = getEffectiveConsent(storedConsent);
  const requiresConsentBanner = SHOW_COOKIE_CONTROLS && hasHydrated && isConsentRegion() && !storedConsent;
  const analyticsEnabled = publicAnalyticsEnabled && consent?.analytics === true;
  const preferencesEnabled = consent?.preferences === true;

  useEffect(() => {
    if (!hasHydrated) return;

    syncAnalyticsConsent(analyticsEnabled);
  }, [analyticsEnabled, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated || preferencesEnabled) return;

    clearPreferenceStorage();
    void fetch('/api/v1/chat/visitor', { method: 'DELETE' }).catch(() => {});
  }, [hasHydrated, preferencesEnabled]);

  useEffect(() => {
    if (!hasHydrated || !analyticsEnabled || !pathname) return;

    capturePageview(window.location.origin + pathname);
  }, [analyticsEnabled, hasHydrated, pathname]);

  const saveConsent = useCallback((values: { analytics: boolean; preferences: boolean }) => {
    const nextConsent = createConsent(values.analytics, values.preferences);
    writeStoredConsent(nextConsent);
    setIsPreferencesOpen(false);
  }, []);

  const openPreferences = useCallback(() => setIsPreferencesOpen(true), []);

  const value = useMemo<CookieConsentContextValue>(() => ({
    consent,
    hasHydrated,
    openPreferences,
  }), [consent, hasHydrated, openPreferences]);

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {analyticsEnabled ? <Analytics /> : null}
      {requiresConsentBanner ? (
        <CookieBanner
          onAcceptAll={() => saveConsent({ analytics: true, preferences: true })}
          onManage={openPreferences}
          onRejectOptional={() => saveConsent({ analytics: false, preferences: false })}
        />
      ) : null}
      {SHOW_COOKIE_CONTROLS ? (
        <CookiePreferencesDialog
          consent={consent}
          onOpenChange={setIsPreferencesOpen}
          onSave={saveConsent}
          open={isPreferencesOpen}
        />
      ) : null}
    </CookieConsentContext.Provider>
  );
}

function subscribeToConsent(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handleChange = () => callback();
  window.addEventListener('storage', handleChange);
  window.addEventListener('pharos-cookie-consent-changed', handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener('pharos-cookie-consent-changed', handleChange);
  };
}

function subscribeToHydration() {
  return () => {};
}

function getConsentSnapshot() {
  if (typeof window === 'undefined') return null;

  return window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
}

function getServerConsentSnapshot() {
  return null;
}

function getHydratedSnapshot() {
  return true;
}

function getServerHydratedSnapshot() {
  return false;
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }

  return context;
}
