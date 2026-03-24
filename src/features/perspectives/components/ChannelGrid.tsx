'use client';

import { useState } from 'react';

import Image from 'next/image';

import { ChannelTileActions } from '@/features/perspectives/components/ChannelTileActions';
import { ChannelTileMedia } from '@/features/perspectives/components/ChannelTileMedia';
import { useFloatingChannelWindow } from '@/features/perspectives/components/FloatingChannelWindowProvider';
import { usePerspectiveLiveStatus } from '@/features/perspectives/queries';

import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

import { PERSPECTIVE_META } from '@/data/perspective-channels';
import type { PerspectiveChannel } from '@/types/domain';

type Props = {
  channels: PerspectiveChannel[];
};

function getVideoEmbedUrl(videoId: string, isMuted: boolean) {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? '1' : '0'}`;
}

export function ChannelGrid({ channels }: Props) {
  const isLandscapePhone = useIsLandscapePhone();
  const isMobile = useIsMobile(1024);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  return (
    <div className={isLandscapePhone ? 'p-2 safe-px' : 'flex-1 overflow-y-auto p-3'}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {channels.map((ch) => (
          <ChannelTile
            key={ch.id}
            channel={ch}
            isDesktop={!isMobile}
            isFocused={focusedId === ch.id}
            onFocus={() => setFocusedId(focusedId === ch.id ? null : ch.id)}
          />
        ))}
      </div>
    </div>
  );
}

type TileProps = {
  channel: PerspectiveChannel;
  isDesktop: boolean;
  isFocused: boolean;
  onFocus: () => void;
};

function ChannelTile({ channel, isDesktop, isFocused, onFocus }: TileProps) {
  const meta = PERSPECTIVE_META[channel.perspective];
  const { openWindow } = useFloatingChannelWindow();
  const { data } = usePerspectiveLiveStatus(channel.handle);
  const [logoErr, setLogoErr] = useState(false);

  const status = data ? (data.isLive ? 'live' : 'offline') : 'loading';
  const playableInEmbed = data?.playableInEmbed ?? false;
  const videoId = data?.videoId ?? null;
  const isLive = status === 'live';
  const canEmbedLive = isLive && playableInEmbed && Boolean(videoId);
  const renderInlineEmbed = true;
  const embedSrc = videoId ? getVideoEmbedUrl(videoId, !isFocused) : '';

  function handlePopOut() {
    if (!videoId) return;
    openWindow({ handle: channel.handle, name: channel.name, videoId });
  }

  return (
    <div
      className={`flex flex-col overflow-hidden border transition-colors ${
        isFocused
          ? 'bg-[var(--bg-2)] border-[var(--blue-l)] shadow-[0_0_0_1px_var(--blue-l)]'
          : 'bg-[var(--bg-1)] border-[var(--bd)]'
      }`}
    >
      <ChannelTileMedia
        canEmbedLive={canEmbedLive}
        embedSrc={embedSrc}
        isFocused={isFocused}
        isLive={isLive}
        name={channel.name}
        onFocus={onFocus}
        renderEmbed={renderInlineEmbed}
        status={status}
      />

      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded bg-[var(--bg-3)]">
          {channel.logo && !logoErr ? (
            <Image
              src={channel.logo}
              alt={channel.name}
              width={20}
              height={20}
              className="h-full w-full object-contain"
              onError={() => setLogoErr(true)}
              unoptimized
            />
          ) : (
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="mono truncate text-[length:var(--text-label)] font-bold text-[var(--t1)]">{channel.name}</span>
          <span className="mono shrink-0 text-[length:var(--text-tiny)] text-[var(--t4)]">{channel.country}</span>
        </div>

        <ChannelTileActions
          canEmbedLive={canEmbedLive}
          handle={channel.handle}
          isDesktop={isDesktop}
          isFocused={isFocused}
          isLive={isLive}
          onFocus={onFocus}
          onPopOut={handlePopOut}
        />
      </div>
    </div>
  );
}
