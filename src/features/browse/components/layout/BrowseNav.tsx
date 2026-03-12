'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Github } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { BROWSE_SECTIONS, GITHUB_URL } from '@/features/browse/constants';

type Props = {
  hamburgerSlot?: React.ReactNode;
};

export function BrowseNav({ hamburgerSlot }: Props) {
  const pathname = usePathname();

  return (
    <header className="shrink-0 border-b border-[var(--bd)]">
      <div className="h-[3px] bg-[var(--danger)]" />
      <div className="h-11 flex items-center justify-between bg-[var(--bg-app)] px-5">
        <div className="flex items-center gap-5">
          {hamburgerSlot}
          <Link href="/browse" className="no-underline">
            <span className="text-[15px] font-bold text-[var(--t1)] tracking-[0.12em]">
              PHAROS
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {BROWSE_SECTIONS.map((s) => {
              const isActive = pathname.startsWith(s.href);
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className={`no-underline text-[11px] font-medium px-2.5 py-1 border-b-2 transition-colors ${
                    isActive
                      ? 'text-[var(--t1)] border-[var(--blue)]'
                      : 'text-[var(--t3)] border-transparent hover:text-[var(--t1)]'
                  }`}
                >
                  {s.label}
                </Link>
              );
            })}
            <Link
              href="/browse/api/reference"
              className={`no-underline text-[11px] font-medium px-2.5 py-1 border-b-2 transition-colors ${
                pathname.startsWith('/browse/api/reference')
                  ? 'text-[var(--t1)] border-[var(--blue)]'
                  : 'text-[var(--t3)] border-transparent hover:text-[var(--t1)]'
              }`}
            >
              API
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="xs"
            asChild
            className="hidden md:inline-flex bg-[var(--blue)] text-[var(--bg-app)] font-bold hover:bg-[var(--blue-l)]"
          >
            <Link href="/dashboard">Dashboard &rarr;</Link>
          </Button>

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--t1)] text-[var(--bg-app)] hover:bg-[var(--t2)] transition-colors"
          >
            <Github size={13} fill="currentColor" strokeWidth={0} />
            <span className="mono text-[10px] font-bold tracking-[0.04em] text-[var(--bg-app)]">STAR</span>
          </a>
        </div>
      </div>
    </header>
  );
}
