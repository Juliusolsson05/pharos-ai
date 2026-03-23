
'use client';
import { useSyncExternalStore } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Github, Heart, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useBootstrap } from '@/features/dashboard/queries';
import { useConflict } from '@/features/dashboard/queries/conflicts';
import { useEvents } from '@/features/events/queries';
import { useCookieConsent } from '@/shared/components/privacy/CookieConsentProvider';

import { getAnalyticsLayoutMode, trackNavigationClicked } from '@/shared/lib/analytics';
import { fmtDate } from '@/shared/lib/format';
import { useHorizontalWheelScroll } from '@/shared/hooks/use-horizontal-wheel-scroll';
import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useLandscapeHeaderVisibility } from '@/shared/hooks/use-landscape-header-visibility';

import { GITHUB_URL, KOFI_URL } from '@/data/external-links';

import { SHOW_COOKIE_CONTROLS } from '@/shared/config/privacy';

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
  const hasHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isLandscapeNonMap = isLandscapePhone && !path.startsWith('/dashboard/map');
  const landscapeAutoHideEnabled = isLandscapeNonMap && path !== '/dashboard' && path !== '/dashboard/data';
  const showLandscapeHeader = useLandscapeHeaderVisibility(landscapeAutoHideEnabled, path);
  const desktopNavRef = useHorizontalWheelScroll<HTMLElement>();

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
  const layoutMode = getAnalyticsLayoutMode({ isLandscapePhone, isMobile });

  const renderMobile = hasHydrated && isMobile;

  const trackHeaderNavigation = (destinationPath: string, component: string) => {
    if (destinationPath === path) return;

    trackNavigationClicked({
      component,
      destination_path: destinationPath,
      layout_mode: layoutMode,
      pathname: path,
      surface: 'dashboard_header',
    });
  };

  return (
    <header
      className="bg-[var(--bg-app)] border-b border-[var(--bd)] shrink-0 z-50 pl-[var(--safe-left)] pr-[var(--safe-right)]"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Mobile header */}
      {renderMobile && (
        <div className="flex flex-col pt-[var(--safe-top)]">
          <div
            className={`${isLandscapeNonMap ? 'h-9 px-2.5' : 'h-11 px-2'} flex items-center justify-between gap-2 border-b border-[var(--bd)]`}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <Link href="/dashboard" className="no-underline flex items-center gap-2 min-w-0">
              <span className="mono text-xs font-bold text-[var(--t1)] tracking-[0.14em]">PHAROS</span>
              <span className="mono text-[length:var(--text-tiny)] text-[var(--warning)] shrink-0">{latestLabel}</span>
            </Link>
            <div className="flex items-center gap-2 min-w-0 shrink-0">
              <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] truncate">{displayDate} · UTC</span>
              <Button
                variant="ghost"
                asChild
                className="h-6 shrink-0 rounded border border-[var(--blue)] bg-[var(--blue-dim)] px-1.5 text-[var(--blue-l)] hover:bg-[var(--blue)] hover:text-[var(--t1)]"
              >
                <a href={KOFI_URL} target="_blank" rel="noopener noreferrer" aria-label="Support Pharos server costs on Ko-fi">
                  <Heart size={11} fill="currentColor" strokeWidth={0} />
                </a>
              </Button>
              <Button
                variant="ghost"
                asChild
                className="h-6 shrink-0 gap-1 rounded bg-[var(--t1)] pl-2 pr-1.5 text-[var(--bg-app)] hover:bg-[var(--t2)] hover:text-[var(--bg-app)]"
              >
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" aria-label="View Pharos on GitHub">
                  <Github size={12} fill="currentColor" strokeWidth={0} />
                  <span className="mono text-[length:var(--text-caption)] font-bold tracking-[0.04em] text-[var(--bg-app)]">STAR</span>
                </a>
              </Button>
            </div>
          </div>
          <nav
            className={`${isLandscapeNonMap ? 'h-8' : 'h-9'} flex items-stretch overflow-x-auto touch-scroll hide-scrollbar`}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {NAV.map(item => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="no-underline flex items-stretch shrink-0"
                  onClick={() => trackHeaderNavigation(item.href, 'top_nav')}
                >
                  <div className={`nav-item${active ? ' active' : ''}`}>{item.label}</div>
                </Link>
              );
            })}
            <MoreDropdown layoutMode={layoutMode} pathname={path} />
          </nav>
        </div>
      )}

      {/* Desktop header */}
      {!renderMobile && (
        <div className="h-11 flex items-stretch">
          {/* ── Traffic light spacer (macOS hiddenInset — 80px) ── */}
          <div className="w-20 shrink-0" />

          {/* ── Wordmark ── */}
          <Link
            href="/dashboard"
            className="no-underline flex items-center gap-2 pr-4 pl-1 border-r border-[var(--bd)] shrink-0"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <span className="mono text-[length:var(--text-body)] font-bold text-[var(--t1)] tracking-[0.18em]">
              PHAROS
            </span>

            {/* Thin accent rule */}
            <div className="w-px h-4 bg-[var(--bd)]" />

            <span className="mono text-[length:var(--text-caption)] font-bold text-[var(--t4)] tracking-[0.08em]">
              EPIC FURY
            </span>

            {/* ONGOING badge */}
            <div
              className="px-[7px] py-0.5 bg-[var(--danger-dim)] border border-[var(--danger-bd)] rounded-sm"
            >
              <span className="text-[length:var(--text-tiny)] font-bold text-[var(--danger)] tracking-[0.08em] uppercase">
                {bootstrap?.status ?? 'ONGOING'}
              </span>
            </div>

            {/* Day indicator */}
            <div className="w-px h-4 bg-[var(--bd)]" />
            <span className="mono text-[length:var(--text-caption)] font-bold text-[var(--warning)] tracking-[0.06em]">
              {latestLabel}
            </span>
            <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] tracking-[0.04em]">
              {latestDay}
            </span>
          </Link>

          {/* ── Nav tabs ── */}
          <nav
            ref={desktopNavRef}
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
                  onClick={() => trackHeaderNavigation(item.href, 'top_nav')}
                >
                  <div className={`nav-item${active ? ' active' : ''}`}>{item.label}</div>
                </Link>
              );
            })}
            <MoreDropdown layoutMode={layoutMode} pathname={path} />
          </nav>

          {/* ── Right side ── */}
          <div
            className="hidden lg:flex items-center gap-3.5 px-[18px] border-l border-[var(--bd)] shrink-0"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {/* LIVE indicator */}
            <div className="flex items-center gap-[5px]">
              <div className="dot dot-live" />
              <span className="mono text-[length:var(--text-label)] font-bold text-[var(--danger)] tracking-[0.06em]">
                LIVE
              </span>
            </div>

            {/* UTC clock */}
            <span className="mono text-[length:var(--text-label)] text-[var(--t4)] tracking-[0.02em]">
              {displayDate} · UTC
            </span>

            <Button
              variant="ghost"
              asChild
              className="h-auto rounded border border-[var(--blue)] bg-[var(--blue-dim)] px-2 py-1 text-[var(--blue-l)] hover:bg-[var(--blue)] hover:text-[var(--t1)]"
            >
              <a
                href={KOFI_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="Help cover hosting and data infrastructure"
              >
                <Heart size={12} fill="currentColor" strokeWidth={0} />
                <span className="mono text-[length:var(--text-label)] font-bold tracking-[0.04em]">SUPPORT SERVER COSTS</span>
              </a>
            </Button>

            <Button
              variant="ghost"
              asChild
              className="h-auto rounded bg-[var(--t1)] px-2 py-1 text-[var(--bg-app)] hover:bg-[var(--t2)] hover:text-[var(--bg-app)]"
            >
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                <Github size={13} fill="currentColor" strokeWidth={0} />
                <span className="mono text-[length:var(--text-label)] font-bold tracking-[0.04em] text-[var(--bg-app)]">STAR</span>
              </a>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

function MoreDropdown({
  layoutMode,
  pathname,
}: {
  layoutMode: ReturnType<typeof getAnalyticsLayoutMode>;
  pathname: string;
}) {
  const { openPreferences } = useCookieConsent();

  const trackMoreNavigation = (destinationPath: string) => {
    trackNavigationClicked({
      component: 'more_menu',
      destination_path: destinationPath,
      layout_mode: layoutMode,
      pathname,
      surface: 'dashboard_header',
    });
  };

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
          <Link href="/browse" className="no-underline" onClick={() => trackMoreNavigation('/browse')}>Browse</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/browse/api/reference" className="no-underline" onClick={() => trackMoreNavigation('/browse/api/reference')}>API</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings" className="no-underline" onClick={() => trackMoreNavigation('/dashboard/settings')}>Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[var(--bd)]" />
        <DropdownMenuItem asChild>
          <Link href="/privacy" className="no-underline">Privacy</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/cookies" className="no-underline">Cookies</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/terms" className="no-underline">Terms</Link>
        </DropdownMenuItem>
        {SHOW_COOKIE_CONTROLS ? (
          <DropdownMenuItem onClick={openPreferences}>
            Cookie settings
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
