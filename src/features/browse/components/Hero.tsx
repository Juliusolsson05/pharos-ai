import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { GITHUB_URL } from '@/features/browse/constants';

export function Hero() {
  return (
    <section className="px-5 pt-16 pb-12 max-w-3xl mx-auto">
      <p className="label mb-4">Open-source intelligence</p>

      <h1 className="text-2xl sm:text-[32px] font-bold text-[var(--t1)] leading-tight tracking-tight mb-4">
        PHAROS
      </h1>

      <p className="text-sm sm:text-base text-[var(--t2)] leading-relaxed max-w-xl mb-8">
        Open-source intelligence dashboard tracking the Iran conflict in real
        time. 30 feeds spanning Western, Iranian, Israeli, Arab, Russian, and
        Chinese outlets so you see the full picture, not one side of it.
      </p>

      <div className="flex items-center gap-3">
        <Button variant="default" size="sm" asChild>
          <Link href="/dashboard">Open dashboard &rarr;</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </Button>
      </div>
    </section>
  );
}
