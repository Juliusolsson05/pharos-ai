/**
 * Force luma.gl to use WebGL2 and handle Turbopack HMR re-init.
 *
 * Turbopack can re-evaluate @luma.gl/core during HMR, creating a second Luma
 * singleton with no registered adapters. We register the adapter on every
 * HMR cycle and suppress the "already initialized" console error.
 */

if (typeof window !== 'undefined') {
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('already been initialized')) return;
    origError.apply(console, args);
  };

  try {
    Object.defineProperty(navigator, 'gpu', { value: undefined, configurable: true, writable: true });
  } catch { /* non-configurable */ }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { luma } = require('@luma.gl/core');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { webgl2Adapter } = require('@luma.gl/webgl');

    try { luma.registerAdapters([webgl2Adapter]); } catch { /* already registered */ }
    try { luma.enforceWebGL2(); } catch { /* already enforced */ }
  } catch {
    // luma.gl not available — will crash in DeckGL render, caught by ErrorBoundary
  }
}

export {};
