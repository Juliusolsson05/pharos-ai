'use client';
import Link           from 'next/link';
import { usePathname } from 'next/navigation';

import { Github, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useBootstrap } from '@/features/dashboard/queries';
import { useConflict } from '@/features/dashboard/queries/conflicts';
import { useEvents } from '@/features/events/queries';

import { fmtDate }    from '@/shared/lib/format';
import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useLandscapeHeaderVisibility } from '@/shared/hooks/use-landscape-header-visibility';

const NAV = [
  { label: 'OVERVIEW',    href: '/dashboard'              },
  { label: 'EVENTS',      href: '/dashboard/feed'         },
  { label: 'ACTORS',      href: '/dashboard/actors'       },
  { label: 'SIGNALS',     href: '/dashboard/signals'      },
  { label: 'BRIEF',       href: '/dashboard/brief'        },
  { label: 'MAP',         href: '/dashboard/map'          },
  { label: 'DATA',        href: '/dashboard/data'          },
];

export function Header() {
  const path = usePathname();
  const { data: bootstrap } = useBootstrap();
  const { data: events } = useEvents();
  const { data: conflict } = useConflict();
  const isMobile = useIsMobile();
  const isLandscapePhone = useIsLandscapePhone();
  const isLandscapeNonMap = isLandscapePhone && !path.startsWith('/dashboard/map');
  const landscapeAutoHideEnabled = isLandscapeNonMap && path !== '/dashboard' && path !== '/dashboard/data';
  const showLandscapeHeader = useLandscapeHeaderVisibility(landscapeAutoHideEnabled, path);

  if (isLandscapeNonMap && !showLandscapeHeader) return null;

  // Hide header on map page in landscape phone mode — map has its own navigation
  if (isLandscapePhone && path.startsWith('/dashboard/map')) return null;

  const isActive = (href: string) =>
    href === '/dashboard' ? path === '/dashboard' : path.startsWith(href);

  const allDays = bootstrap?.days ?? [];
  const dayCount = allDays.length;
  const latestDay = allDays[allDays.length - 1] ?? '';
  const latestLabel = `DAY ${dayCount}`;

  const latestDate = events && events.length > 0
    ? [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.timestamp
    : undefined;
  const displayDate = latestDate ? fmtDate(latestDate) : (conflict ? fmtDate(conflict.startDate) : '');

  return (
    <header
      className="bg-[var(--bg-app)] border-b border-[var(--bd)] shrink-0 z-50 pl-[var(--safe-left)] pr-[var(--safe-right)]"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Mobile header */}
      {isMobile && (
        <div className="flex flex-col pt-[var(--safe-top)]">
          <div
            className={`${isLandscapeNonMap ? 'h-9 px-2.5' : 'h-11 px-2'} flex items-center justify-between gap-2 border-b border-[var(--bd)]`}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <Link href="/dashboard" className="no-underline flex items-center gap-2 min-w-0">
              <span className="mono text-xs font-bold text-[var(--t1)] tracking-[0.14em]">PHAROS</span>
              <span className="mono text-[8px] text-[var(--warning)] shrink-0">{latestLabel}</span>
            </Link>
            <span className="mono text-[8px] text-[var(--t4)] truncate">{displayDate} · UTC</span>
          </div>
          <nav
            className={`${isLandscapeNonMap ? 'h-8' : 'h-9'} flex items-stretch overflow-x-auto touch-scroll hide-scrollbar`}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {NAV.map(item => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} className="no-underline flex items-stretch shrink-0">
                  <div className={`nav-item${active ? ' active' : ''}`}>{item.label}</div>
                </Link>
              );
            })}
            <MoreDropdown />
          </nav>
        </div>
      )}

      {/* Desktop header */}
      {!isMobile && (
        <div className="h-11 flex items-stretch">
          {/* ── Traffic light spacer (macOS hiddenInset — 80px) ── */}
          <div className="w-20 shrink-0" />

          {/* ── Wordmark ── */}
          <Link
            href="/dashboard"
            className="no-underline flex items-center gap-2 pr-4 pl-1 border-r border-[var(--bd)] shrink-0"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <span className="mono text-[13px] font-bold text-[var(--t1)] tracking-[0.18em]">
              PHAROS
            </span>

            {/* Thin accent rule */}
            <div className="w-px h-4 bg-[var(--bd)]" />

            <span className="mono text-[9px] font-bold text-[var(--t4)] tracking-[0.08em]">
              EPIC FURY
            </span>

            {/* ONGOING badge */}
            <div
              className="px-[7px] py-0.5 bg-[var(--danger-dim)] border border-[var(--danger-bd)] rounded-sm"
            >
              <span className="text-[8px] font-bold text-[var(--danger)] tracking-[0.08em] uppercase">
                {bootstrap?.status ?? 'ONGOING'}
              </span>
            </div>

            {/* Day indicator */}
            <div className="w-px h-4 bg-[var(--bd)]" />
            <span className="mono text-[9px] font-bold text-[var(--warning)] tracking-[0.06em]">
              {latestLabel}
            </span>
            <span className="mono text-[8px] text-[var(--t4)] tracking-[0.04em]">
              {latestDay}
            </span>
          </Link>

          {/* ── Nav tabs ── */}
          <nav
            className="flex items-stretch h-full flex-1 overflow-x-auto touch-scroll hide-scrollbar"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {NAV.map(item => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="no-underline flex items-stretch"
                >
                  <div className={`nav-item${active ? ' active' : ''}`}>{item.label}</div>
                </Link>
              );
            })}
            <MoreDropdown />
          </nav>

          {/* ── Right side ── */}
          <div
            className="hidden lg:flex items-center gap-3.5 px-[18px] border-l border-[var(--bd)] shrink-0"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {/* LIVE indicator */}
            <div className="flex items-center gap-[5px]">
              <div className="dot dot-live" />
              <span className="mono text-[10px] font-bold text-[var(--danger)] tracking-[0.06em]">
                LIVE
              </span>
            </div>

            {/* UTC clock */}
            <span className="mono text-[10px] text-[var(--t4)] tracking-[0.02em]">
              {displayDate} · UTC
            </span>

            {/* GitHub link */}
            <a
              href="https://github.com/Juliusolsson05/pharos-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--t1)] text-[var(--bg-app)] hover:bg-[var(--t2)] transition-colors"
            >
              <Github size={13} fill="currentColor" strokeWidth={0} />
              <span className="mono text-[10px] font-bold tracking-[0.04em] text-[var(--bg-app)]">STAR</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function MoreDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="nav-item flex items-center shrink-0 px-3" aria-label="More">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        data-theme="auto"
        className="bg-[var(--bg-1)] border-[var(--bd)] text-[var(--t1)] [--accent:var(--bg-3)] [--accent-foreground:var(--t1)]"
      >
        <DropdownMenuItem asChild>
          <Link href="/browse" className="no-underline">Browse</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/browse/api/reference" className="no-underline">API</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
