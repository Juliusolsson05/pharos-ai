import posthog from 'posthog-js';

import { publicPosthogHost, publicPosthogKey } from '@/shared/lib/env';

import { hasAnalyticsConsent } from './consent';

let isInitialized = false;

function initPostHog() {
  if (isInitialized || !publicPosthogKey) return;

  posthog.init(publicPosthogKey, {
    api_host: publicPosthogHost,
    autocapture: false,
    capture_pageleave: true,
    capture_pageview: false,
    defaults: '2026-01-30',
    person_profiles: 'identified_only',
  });

  isInitialized = true;
}

function ensurePostHog() {
  if (!hasAnalyticsConsent()) return false;

  initPostHog();
  if (!posthog.__loaded) return false;

  if (typeof posthog.opt_in_capturing === 'function') {
    posthog.opt_in_capturing();
  }

  return true;
}

export function syncAnalyticsConsent(consented: boolean) {
  if (consented) {
    ensurePostHog();
    return;
  }

  if (!isInitialized) return;

  if (typeof posthog.opt_out_capturing === 'function') {
    posthog.opt_out_capturing();
  }

  if (typeof posthog.reset === 'function') {
    posthog.reset();
  }
}

export function captureAnalyticsEvent(event: string, properties?: Record<string, unknown>) {
  if (!ensurePostHog()) return;

  posthog.capture(event, properties);
}

export function capturePageview(url: string) {
  if (!ensurePostHog()) return;

  posthog.capture('$pageview', {
    $current_url: url,
    pathname: new URL(url).pathname,
  });
}
