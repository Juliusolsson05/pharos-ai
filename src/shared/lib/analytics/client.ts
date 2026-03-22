import posthog from 'posthog-js';

import { hasAnalyticsConsent } from './consent';

function ensurePostHog() {
  if (!hasAnalyticsConsent()) return false;
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

  if (!posthog.__loaded) return;

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
