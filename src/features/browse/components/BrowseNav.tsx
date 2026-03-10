import Link from 'next/link';

import { GITHUB_URL } from '@/features/browse/constants';

export function BrowseNav() {
  return (
    <header className="h-11 flex items-center justify-between border-b border-[var(--bd)] bg-[var(--bg-app)] px-5 shrink-0">
      <Link href="/browse" className="no-underline">
        <span className="mono text-[13px] font-bold text-[var(--t1)] tracking-[0.18em]">
          PHAROS
        </span>
      </Link>

      <nav className="flex items-center gap-5">
        <Link
          href="/dashboard"
          className="no-underline mono text-xs text-[var(--t3)] hover:text-[var(--t1)] transition-colors"
        >
          Dashboard &rarr;
        </Link>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="no-underline mono text-xs text-[var(--t3)] hover:text-[var(--t1)] transition-colors"
        >
          GitHub
        </a>
      </nav>
    </header>
  );
}
