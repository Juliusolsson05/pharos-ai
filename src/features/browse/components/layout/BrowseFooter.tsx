import Link from 'next/link';

import { GITHUB_URL } from '@/features/browse/constants';

export function BrowseFooter() {
  return (
    <footer className="border-t border-[var(--bd)] bg-[var(--bg-app)] px-5 py-10">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="mono text-xs font-bold text-[var(--t1)] tracking-[0.14em]">
              PHAROS
            </span>
            <span className="text-xs text-[var(--t4)]">
              Open-source geopolitical intelligence
            </span>
          </div>

          <nav className="flex items-center gap-5">
            <Link
              href="/browse"
              className="no-underline text-xs text-[var(--t3)] hover:text-[var(--t1)] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className="no-underline text-xs text-[var(--t3)] hover:text-[var(--t1)] transition-colors"
            >
              Dashboard
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline text-xs text-[var(--t3)] hover:text-[var(--t1)] transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>

        <div className="border-t border-[var(--bd-s)] pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-[11px] text-[var(--t4)]">
            AGPL-3.0 License
          </span>
          <span className="text-[11px] text-[var(--t4)]">
            conflicts.app
          </span>
        </div>
      </div>
    </footer>
  );
}
