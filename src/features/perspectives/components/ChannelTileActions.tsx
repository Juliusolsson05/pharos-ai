'use client';

import { ExternalLink, PanelsTopLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { getLiveUrl } from '@/data/perspective-channels';

type Props = {
  canEmbedLive: boolean;
  handle: string;
  isDesktop: boolean;
  isFocused: boolean;
  isLive: boolean;
  onFocus: () => void;
  onPopOut: () => void;
};

export function ChannelTileActions({
  canEmbedLive,
  handle,
  isDesktop,
  isFocused,
  isLive,
  onFocus,
  onPopOut,
}: Props) {
  const focusLabel = !isLive ? 'OFFLINE' : !canEmbedLive ? 'YOUTUBE' : isFocused ? 'ACTIVE' : 'FOCUS';

  return (
    <div className="flex shrink-0 items-center gap-1">
      {isDesktop && canEmbedLive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onPopOut}
          className="h-auto px-1.5 py-0.5 text-[length:var(--text-tiny)] mono tracking-wider text-[var(--t4)] hover:text-[var(--t2)]"
        >
          <PanelsTopLeft className="size-3" />
          POP
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onFocus}
        disabled={!canEmbedLive}
        className={`h-auto px-1.5 py-0.5 text-[length:var(--text-tiny)] mono tracking-wider ${
          isFocused
            ? 'text-[var(--blue-l)]'
            : 'text-[var(--t4)] hover:text-[var(--t2)]'
        }`}
      >
        {focusLabel}
      </Button>

      {!isDesktop && (
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-auto px-1 py-0.5 text-[var(--t4)] hover:text-[var(--t2)]"
        >
          <a href={getLiveUrl(handle)} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3" />
            <span className="mono text-[length:var(--text-tiny)] tracking-wider">WATCH</span>
          </a>
        </Button>
      )}

      {isDesktop && (
        <Button asChild variant="ghost" size="sm" className="h-auto px-1 py-0.5 text-[var(--t4)] hover:text-[var(--t2)]">
        <a href={getLiveUrl(handle)} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="size-3" />
        </a>
        </Button>
      )}
    </div>
  );
}
