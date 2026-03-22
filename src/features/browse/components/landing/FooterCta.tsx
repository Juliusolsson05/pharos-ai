'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { trackNavigationClicked } from '@/shared/lib/analytics';
import { useAnalyticsLayoutMode } from '@/shared/hooks/use-analytics-layout-mode';

export function FooterCta() {
  const layoutMode = useAnalyticsLayoutMode();

  return (
    <section className="px-5 py-16 max-w-3xl mx-auto text-center">
      <div className="border-t border-[var(--bd-s)] pt-12">
        <p className="text-sm text-[var(--t2)] mb-4">
          No login required. No paywall.
        </p>
        <Button
          size="sm"
          asChild
          className="bg-[var(--blue)] text-[var(--bg-app)] font-bold hover:bg-[var(--blue-l)]"
        >
          <Link
            href="/dashboard"
            onClick={() => trackNavigationClicked({
              component: 'footer_cta',
              cta_variant: 'primary',
              destination_path: '/dashboard',
              layout_mode: layoutMode,
              pathname: '/browse',
              surface: 'browse_landing',
            })}
          >
            Open the dashboard &rarr;
          </Link>
        </Button>
      </div>
    </section>
  );
}
