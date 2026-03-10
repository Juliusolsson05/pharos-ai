import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function FooterCta() {
  return (
    <section className="px-5 py-16 max-w-3xl mx-auto text-center">
      <div className="border-t border-[var(--bd-s)] pt-12">
        <p className="text-sm text-[var(--t2)] mb-4">
          No login required. No paywall.
        </p>
        <Button variant="default" size="sm" asChild>
          <Link href="/dashboard">Open the dashboard &rarr;</Link>
        </Button>
      </div>
    </section>
  );
}
