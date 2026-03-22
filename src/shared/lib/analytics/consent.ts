import { SHOW_COOKIE_CONTROLS } from '@/shared/config/privacy';

export const COOKIE_CONSENT_VERSION = '2026-03-22';
export const COOKIE_CONSENT_STORAGE_KEY = 'pharos:cookie-consent:v1';
export const BROWSE_ARTICLE_BANNER_STORAGE_KEY = 'pharos:browse-article-banner-dismissed';
export const CHAT_VISITOR_COOKIE_NAME = 'pharos_vid';
export const MAP_STORAGE_KEY = 'pharos:map:v1';
export const PANEL_LAYOUT_STORAGE_PREFIX = 'react-resizable-panels:';
export const WORKSPACE_STORAGE_KEY_V3 = 'pharos:workspace:v3';
export const WORKSPACE_STORAGE_KEY_V4 = 'pharos:workspace:v4';

export type CookieConsent = {
  analytics: boolean;
  preferences: boolean;
  updatedAt: string;
  version: string;
};

export function createConsent(analytics: boolean, preferences: boolean): CookieConsent {
  return {
    analytics,
    preferences,
    updatedAt: new Date().toISOString(),
    version: COOKIE_CONSENT_VERSION,
  };
}

export function isConsentRegion() {
  if (!SHOW_COOKIE_CONTROLS) return false;
  if (typeof window === 'undefined') return false;

  if (window.localStorage.getItem('pharos:force-consent-region') === '1') {
    return true;
  }

  const language = navigator.language.toLowerCase();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return language.includes('-gb')
    || language.includes('-ie')
    || language.includes('-de')
    || language.includes('-fr')
    || language.includes('-es')
    || language.includes('-it')
    || language.includes('-nl')
    || language.includes('-be')
    || language.includes('-pt')
    || language.includes('-se')
    || language.includes('-dk')
    || language.includes('-fi')
    || language.includes('-no')
    || language.includes('-pl')
    || language.includes('-at')
    || language.includes('-ch')
    || timeZone.startsWith('Europe/');
}

export function getDefaultConsent() {
  return createConsent(true, true);
}

export function getEffectiveConsent(storedConsent: CookieConsent | null) {
  if (!SHOW_COOKIE_CONTROLS) return getDefaultConsent();
  if (storedConsent) return storedConsent;
  if (typeof window === 'undefined') return null;
  if (!isConsentRegion()) return getDefaultConsent();

  return null;
}

export function readStoredConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;

  try {
    return parseStoredConsent(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function parseStoredConsent(raw: string | null): CookieConsent | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    if (typeof parsed.analytics !== 'boolean') return null;
    if (typeof parsed.preferences !== 'boolean') return null;
    if (typeof parsed.updatedAt !== 'string') return null;
    if (typeof parsed.version !== 'string') return null;
    if (parsed.version !== COOKIE_CONSENT_VERSION) return null;

    return {
      analytics: parsed.analytics,
      preferences: parsed.preferences,
      updatedAt: parsed.updatedAt,
      version: parsed.version,
    };
  } catch {
    return null;
  }
}

export function writeStoredConsent(consent: CookieConsent) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent('pharos-cookie-consent-changed'));
}

export function clearStoredConsent() {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('pharos-cookie-consent-changed'));
}

export function hasAnalyticsConsent() {
  return getEffectiveConsent(readStoredConsent())?.analytics === true;
}

export function hasPreferencesConsent() {
  return getEffectiveConsent(readStoredConsent())?.preferences === true;
}

export function clearPreferenceStorage() {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(BROWSE_ARTICLE_BANNER_STORAGE_KEY);
  window.localStorage.removeItem(MAP_STORAGE_KEY);
  window.localStorage.removeItem(WORKSPACE_STORAGE_KEY_V3);
  window.localStorage.removeItem(WORKSPACE_STORAGE_KEY_V4);

  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(PANEL_LAYOUT_STORAGE_PREFIX)) {
      window.localStorage.removeItem(key);
    }
  }

  window.dispatchEvent(new CustomEvent('pharos-cookie-consent-changed'));
}
