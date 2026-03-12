'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

const REFRESH_INTERVAL = 4 * 60_000; // 4 minutes

type UseBrowseAutoRefreshReturn = {
  refreshing: boolean;
  refresh: () => void;
};

/**
 * Periodically calls `router.refresh()` to re-fetch server component data.
 * Pauses when the tab is hidden and prevents overlapping refreshes.
 */
export function useBrowseAutoRefresh(): UseBrowseAutoRefreshReturn {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    router.refresh();

    // router.refresh() is fire-and-forget; simulate completion after a
    // short delay that covers typical server component re-render time.
    setTimeout(() => {
      setRefreshing(false);
    }, 1_500);
  }, [router]);

  useEffect(() => {
    function start() {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(doRefresh, REFRESH_INTERVAL);
    }

    function stop() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'visible') {
        start();
      } else {
        stop();
      }
    }

    start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [doRefresh]);

  return { refreshing, refresh: doRefresh };
}
