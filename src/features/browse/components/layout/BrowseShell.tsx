'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';

import { usePathname } from 'next/navigation';

import { MenuIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';

import { BrowseArticleBanner } from '@/features/browse/components/layout/BrowseArticleBanner';
import { BrowseFooter } from '@/features/browse/components/layout/BrowseFooter';
import { BrowseNav } from '@/features/browse/components/layout/BrowseNav';
import { BrowseSidebar } from '@/features/browse/components/layout/BrowseSidebar';
import { CriticalTimeline } from '@/features/browse/components/layout/CriticalTimeline';

import { useIsMobile } from '@/shared/hooks/use-is-mobile';

type Props = {
  children: React.ReactNode;
};

export function BrowseShell({ children }: Props) {
  const isMobile = useIsMobile(768);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hasHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isLanding = pathname === '/browse';
  const isDetailPage = pathname.split('/').filter(Boolean).length >= 3;

  const handleNavigate = useCallback(() => setOpen(false), []);

  const showDesktopSidebar = hasHydrated && !isMobile && !isLanding;
  const showMobileSheet = hasHydrated && isMobile;

  const hamburgerButton = showMobileSheet ? (
    <Button
      variant="ghost"
      size="icon-xs"
      className="-ml-1 text-[var(--t1)] hover:bg-[var(--bg-3)] hover:text-[var(--t1)]"
      onClick={() => setOpen(true)}
      aria-label="Open navigation"
    >
      <MenuIcon className="size-4" />
    </Button>
  ) : null;

  return (
    <>
      <BrowseNav hamburgerSlot={hamburgerButton} />

      <div className="flex flex-1 min-h-0">
        {showDesktopSidebar && <BrowseSidebar />}

        {showMobileSheet && (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent
              side="left"
              showCloseButton={false}
              data-theme="auto"
              className="w-56 gap-0 overflow-hidden p-0 bg-[var(--bg-1)]"
            >
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <BrowseSidebar onNavigate={handleNavigate} mobileSheet />
            </SheetContent>
          </Sheet>
        )}

        <main className="flex-1 min-h-0">
          {isDetailPage && <BrowseArticleBanner />}
          {children}
          <BrowseFooter />
        </main>
        {showDesktopSidebar && <CriticalTimeline />}
      </div>
    </>
  );
}
