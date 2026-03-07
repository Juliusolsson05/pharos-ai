'use client';

import { useCallback, useEffect } from 'react';
import type { UIEvent } from 'react';

const EVT = 'pharos:landscape-scroll';

function emit(scrollTop: number) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVT, { detail: { scrollTop } }));
}

export function useLandscapeScrollEmitter(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    emit(0);
  }, [enabled]);

  return useCallback((e: UIEvent<HTMLElement>) => {
    if (!enabled) return;
    emit(e.currentTarget.scrollTop);
  }, [enabled]);
}

export const LANDSCAPE_SCROLL_EVENT = EVT;
