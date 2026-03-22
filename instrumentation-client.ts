import posthog from 'posthog-js';

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_TOKEN;
const analyticsEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';
const showCookieControls = process.env.NEXT_PUBLIC_SHOW_COOKIE_CONTROLS === 'true';

if (posthogKey && analyticsEnabled) {
  posthog.init(posthogKey, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    autocapture: false,
    capture_pageleave: true,
    capture_pageview: false,
    defaults: '2026-01-30',
    opt_out_capturing_by_default: showCookieControls,
    opt_out_persistence_by_default: showCookieControls,
    person_profiles: 'identified_only',
  } as Parameters<typeof posthog.init>[1]);
}
