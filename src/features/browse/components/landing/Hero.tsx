import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { GITHUB_URL } from '@/features/browse/constants';

export function Hero() {
  return (
    <section className="px-5 pt-16 pb-12 max-w-3xl mx-auto">
      <p className="label mb-4">Open-source intelligence</p>

      <h1 className="text-[32px] sm:text-[42px] font-bold text-[var(--t1)] leading-[1.1] tracking-tight mb-4">
        Real-Time Iran Conflict Intelligence Dashboard
      </h1>

      <p className="text-[15px] sm:text-base text-[var(--t2)] leading-[1.7] max-w-xl mb-8">
        Conflicts.app is an open-source intelligence dashboard built to track
        the Iran conflict in real time. 30+ sources spanning Western, Iranian,
        Israeli, Arab, Russian, and Chinese outlets processed through an AI
        pipeline into interactive maps, daily briefs, and escalation scoring.
      </p>

      <div className="flex items-center gap-3">
        <Button
          size="sm"
          asChild
          className="bg-[var(--blue)] text-[var(--bg-app)] font-bold hover:bg-[var(--blue-l)]"
        >
          <Link href="/dashboard">Open dashboard &rarr;</Link>
        </Button>
        <Button
          size="sm"
          asChild
          className="bg-[var(--t1)] text-[var(--bg-app)] font-bold hover:bg-[var(--t2)]"
        >
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </Button>
      </div>
    </section>
  );
}
