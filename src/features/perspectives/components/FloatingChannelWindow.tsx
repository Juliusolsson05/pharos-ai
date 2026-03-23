'use client';

import { usePathname } from 'next/navigation';

import { ExternalLink, Minus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useFloatingChannelWindow } from '@/features/perspectives/components/FloatingChannelWindowProvider';
import { FloatingWindowResizeHandle } from '@/features/perspectives/components/FloatingWindowResizeHandle';
import { useFloatingChannelWindowLayout } from '@/features/perspectives/hooks/use-floating-channel-window-layout';

import { useIsMobile } from '@/shared/hooks/use-is-mobile';

import { getLiveUrl } from '@/data/perspective-channels';

const ALLOWED_PREFIXES = ['/dashboard', '/dashboard/brief', '/dashboard/data'];

export function FloatingChannelWindow() {
  const pathname = usePathname();
  const isMobile = useIsMobile(1024);
  const {
    activeChannel,
    closeWindow,
    isMinimized,
    minimizeWindow,
    position,
    restoreWindow,
    setPosition,
    setSize,
    size,
  } = useFloatingChannelWindow();
  const { startDrag, startResize } = useFloatingChannelWindowLayout({
    enabled: Boolean(activeChannel) && !isMobile,
    position,
    setPosition,
    setSize,
    size,
  });

  if (!activeChannel || isMobile || !ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  if (isMinimized) {
    return (
      <div
        className="fixed z-[60] flex cursor-move items-center gap-2 border border-[var(--bd)] bg-[var(--bg-1)] px-2 py-1 shadow-2xl"
        onPointerDown={startDrag}
        style={{ left: position.x, top: position.y }}
      >
        <div className="dot dot-live" />
        <span className="mono max-w-[160px] truncate text-[length:var(--text-caption)] text-[var(--t2)]">{activeChannel.name}</span>
        <Button variant="ghost" size="icon-xs" onPointerDown={(event) => event.stopPropagation()} onClick={restoreWindow} aria-label="Restore live window">
          <ExternalLink size={11} />
        </Button>
        <Button variant="ghost" size="icon-xs" onPointerDown={(event) => event.stopPropagation()} onClick={closeWindow} aria-label="Close live window">
          <X size={11} />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="fixed z-[60] flex flex-col overflow-hidden rounded border border-[var(--bd)] bg-[var(--bg-1)] shadow-2xl"
      style={{ height: size.height, left: position.x, top: position.y, width: size.width }}
    >
      <div
        className="panel-header cursor-move justify-between px-10"
        onPointerDown={startDrag}
      >
        <div className="flex min-w-0 items-center gap-2">
          <div className="dot dot-live" />
          <span className="mono truncate text-[length:var(--text-label)] tracking-wider text-[var(--t2)]">{activeChannel.name}</span>
        </div>
        <div className="flex items-center gap-1" onPointerDown={(event) => event.stopPropagation()}>
          <Button asChild variant="ghost" size="icon-xs" aria-label="Open on YouTube">
            <a href={getLiveUrl(activeChannel.handle)} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={11} />
            </a>
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={minimizeWindow} aria-label="Minimize live window">
            <Minus size={11} />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={closeWindow} aria-label="Close live window">
            <X size={11} />
          </Button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 bg-[var(--bg-app)]">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${activeChannel.videoId}?autoplay=1&mute=1`}
          title={`${activeChannel.name} floating live window`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      <FloatingWindowResizeHandle onPointerDown={startResize} />
    </div>
  );
}
