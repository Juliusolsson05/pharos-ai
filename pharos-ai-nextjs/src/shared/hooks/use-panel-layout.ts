/**
 * Safe wrapper around react-resizable-panels' useDefaultLayout.
 * Guards localStorage access so SSR/prerender doesn't crash.
 */
'use client';

import { useDefaultLayout } from 'react-resizable-panels';

export function usePanelLayout(opts: Parameters<typeof useDefaultLayout>[0]) {
  // During SSR localStorage doesn't exist — useDefaultLayout crashes.
  // The typeof check is stripped at runtime but prevents the SSR error.
  if (typeof window === 'undefined') {
    return {
      defaultLayout: undefined,
      onLayoutChanged: () => {},
    };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useDefaultLayout(opts);
}
