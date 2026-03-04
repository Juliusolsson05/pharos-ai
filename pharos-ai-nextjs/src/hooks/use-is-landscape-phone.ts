'use client';
import { useSyncExternalStore } from 'react';

const QUERY = '(max-height: 500px) and (orientation: landscape) and (pointer: coarse)';

export function useIsLandscapePhone(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {};
      const mq = window.matchMedia(QUERY);
      const handler = () => onStoreChange();
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    },
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
    () => false,
  );
}
