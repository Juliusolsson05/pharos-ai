'use client';

import { Radio, Slash, TvMinimalPlay } from 'lucide-react';

import { Button } from '@/components/ui/button';

type Props = {
  canEmbedLive: boolean;
  embedSrc: string;
  isFocused: boolean;
  isLive: boolean;
  name: string;
  onFocus: () => void;
  renderEmbed: boolean;
  status: 'loading' | 'live' | 'offline';
};

export function ChannelTileMedia({
  canEmbedLive,
  embedSrc,
  isFocused,
  isLive,
  name,
  onFocus,
  renderEmbed,
  status,
}: Props) {
  const showEmbed = renderEmbed && canEmbedLive;

  return (
    <div className="relative aspect-video bg-[var(--bg-app)]">
      {showEmbed && (
        <iframe
          className={`absolute inset-0 h-full w-full ${isFocused ? 'pointer-events-auto' : 'pointer-events-none'}`}
          src={embedSrc}
          title={`${name} live`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      )}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--bg-app)] text-center">
          <Radio size={18} className="animate-pulse text-[var(--t4)]" strokeWidth={1.5} />
          <span className="mono text-[length:var(--text-caption)] tracking-wider text-[var(--t4)]">CHECKING LIVE STATUS</span>
        </div>
      )}
      {status === 'offline' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--bg-app)] text-center">
          <Slash size={18} className="text-[var(--t4)]" strokeWidth={1.5} />
          <span className="mono text-[length:var(--text-caption)] tracking-wider text-[var(--t3)]">CHANNEL OFFLINE</span>
          <span className="px-2 text-[length:var(--text-caption)] text-[var(--t4)]">No active live stream detected right now.</span>
        </div>
      )}
      {isLive && !canEmbedLive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--bg-app)] text-center">
          <TvMinimalPlay size={18} className="text-[var(--blue-l)]" strokeWidth={1.5} />
          <span className="mono text-[length:var(--text-caption)] tracking-wider text-[var(--t2)]">LIVE ON YOUTUBE</span>
          <span className="px-2 text-[length:var(--text-caption)] text-[var(--t4)]">This channel is live, but YouTube does not allow embedding it here.</span>
        </div>
      )}
      {isLive && canEmbedLive && !renderEmbed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--bg-app)] text-center">
          <TvMinimalPlay size={18} className="text-[var(--blue-l)]" strokeWidth={1.5} />
          <span className="mono text-[length:var(--text-caption)] tracking-wider text-[var(--t2)]">LIVE PREVIEW AVAILABLE</span>
          <span className="px-2 text-[length:var(--text-caption)] text-[var(--t4)]">Tap play to open the live embed here.</span>
        </div>
      )}
      {isLive && canEmbedLive && !renderEmbed && (
        <Button
          variant="ghost"
          onClick={onFocus}
          className="absolute inset-0 h-full w-full rounded-none border-0 bg-transparent text-transparent hover:bg-transparent"
          aria-label={`Open ${name} live embed`}
        >
          Open live embed
        </Button>
      )}
      {showEmbed && !isFocused && (
        <Button
          variant="ghost"
          onClick={onFocus}
          className="absolute inset-0 h-full w-full rounded-none border-0 bg-black/10 text-[var(--t2)] hover:bg-black/20 hover:text-[var(--t1)]"
        >
          <span className="mono text-[length:var(--text-label)] tracking-wider">CLICK TO FOCUS</span>
        </Button>
      )}
      {showEmbed && isFocused && (
        <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-2 border border-[var(--blue-l)] bg-[var(--bg-app)]/90 px-2 py-1">
          <div className="dot" style={{ backgroundColor: 'var(--blue-l)' }} />
          <span className="mono text-[length:var(--text-tiny)] text-[var(--blue-l)]">FOCUSED - SOUND ON</span>
        </div>
      )}
      {status !== 'loading' && !isFocused && (
        <div className="pointer-events-none absolute right-2 top-2">
          <span className={`border px-1.5 py-0.5 text-[length:var(--text-micro)] mono font-bold ${
            isLive
              ? 'border-[var(--danger-bd)] bg-[var(--danger-dim)] text-[var(--danger)]'
              : 'border-white/10 bg-black/60 text-[var(--t4)]'
          }`}>
            {isLive ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      )}
    </div>
  );
}
