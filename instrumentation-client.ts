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
    loaded: client => {
      if (SHOW_COOKIE_CONTROLS) {
        client.opt_out_capturing();
      }
    },
    person_profiles: 'identified_only',
  });
}
