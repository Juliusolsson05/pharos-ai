import posthog from 'posthog-js';

import { SHOW_COOKIE_CONTROLS } from './src/shared/config/privacy';

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_TOKEN;

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    autocapture: false,
    capture_pageleave: true,
    capture_pageview: false,
    defaults: '2026-01-30',
    opt_out_capturing_by_default: SHOW_COOKIE_CONTROLS,
    opt_out_persistence_by_default: SHOW_COOKIE_CONTROLS,
    person_profiles: 'identified_only',
  } as Parameters<typeof posthog.init>[1]);
}
