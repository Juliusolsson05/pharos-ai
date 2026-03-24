'use client';

import { useState, useSyncExternalStore } from 'react';

import Link from 'next/link';

import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';

import {
  BROWSE_ARTICLE_BANNER_STORAGE_KEY,
  hasPreferencesConsent,
} from '@/shared/lib/analytics/consent';

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handleChange = () => callback();
  window.addEventListener('storage', handleChange);
  window.addEventListener('pharos-cookie-consent-changed', handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener('pharos-cookie-consent-changed', handleChange);
  };
}

function getDismissedSnapshot() {
  if (!hasPreferencesConsent()) return false;
  return localStorage.getItem(BROWSE_ARTICLE_BANNER_STORAGE_KEY) === '1';
}

function getDismissedServerSnapshot() {
  return true;
}

export function BrowseArticleBanner() {
  const dismissedFromStorage = useSyncExternalStore(
    subscribe,
    getDismissedSnapshot,
    getDismissedServerSnapshot,
  );
  const [isLocallyDismissed, setIsLocallyDismissed] = useState(false);

  function handleDismiss() {
    if (!hasPreferencesConsent()) {
      setIsLocallyDismissed(true);
      return;
    }

    localStorage.setItem(BROWSE_ARTICLE_BANNER_STORAGE_KEY, '1');
    window.dispatchEvent(new CustomEvent('pharos-cookie-consent-changed'));
    setIsLocallyDismissed(true);
  }

  if (dismissedFromStorage || isLocallyDismissed) return null;

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-2 bg-black border-b border-[var(--bd)]">
      <p className="text-[length:var(--text-body-sm)] text-white/70 leading-snug">
        You are viewing public article pages.{' '}
        <Link
          href="/dashboard"
          className="no-underline text-[var(--blue-l)] hover:text-white transition-colors font-medium"
        >
          Open the dashboard
        </Link>{' '}
        for more detailed analysis.
      </p>

      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleDismiss}
        className="shrink-0 text-white/50 hover:text-white"
        aria-label="Dismiss banner"
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}
