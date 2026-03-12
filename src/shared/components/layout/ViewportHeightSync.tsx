'use client';

import { useEffect } from 'react';

function updateAppHeightVar() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const vv = window.visualViewport;
  // When pinch-zoomed (scale > 1), visualViewport.height shrinks — use innerHeight instead
  const vh = vv && vv.scale <= 1 ? vv.height : window.innerHeight;
  const mobileVh = vv?.height ?? window.innerHeight;
  document.documentElement.style.setProperty('--app-height', `${Math.round(vh)}px`);
  document.documentElement.style.setProperty('--app-height-mobile', `${Math.round(mobileVh)}px`);
}

export function ViewportHeightSync() {
  useEffect(() => {
    updateAppHeightVar();

    const onResize = () => updateAppHeightVar();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('scroll', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('scroll', onResize);
    };
  }, []);

  return null;
}
