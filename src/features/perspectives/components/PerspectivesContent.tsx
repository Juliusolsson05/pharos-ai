'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { ChannelGrid } from '@/features/perspectives/components/ChannelGrid';

import { track } from '@/shared/lib/analytics';
import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';
import { useLandscapeScrollEmitter } from '@/shared/hooks/use-landscape-scroll-emitter';

import { PERSPECTIVE_CHANNELS, PRESETS } from '@/data/perspective-channels';
import type { PerspectiveChannel } from '@/types/domain';

export function PerspectivesContent() {
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const isLandscapePhone = useIsLandscapePhone();
  const onLandscapeScroll = useLandscapeScrollEmitter(isLandscapePhone);

  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];

  const activeChannels = useMemo(
    () => preset.channelIds
      .map((id) => PERSPECTIVE_CHANNELS.find((ch) => ch.id === id))
      .filter((ch): ch is PerspectiveChannel => !!ch),
    [preset.channelIds],
  );

  const handlePreset = (id: string) => {
    setPresetId(id);
    track('perspectives_preset_changed', { preset: id });
  };

  return (
    <div
      className={`flex flex-col w-full h-full min-h-0 ${isLandscapePhone ? 'overflow-y-auto' : 'overflow-hidden'}`}
      onScroll={isLandscapePhone ? onLandscapeScroll : undefined}
    >
      <div className={`py-2 border-b border-[var(--bd)] bg-[var(--bg-app)] shrink-0 overflow-x-auto ${isLandscapePhone ? 'safe-px' : 'px-5'}`}>
        <div className="flex items-center justify-between gap-6 min-w-max">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard/data"
              className="mono text-[length:var(--text-label)] text-[var(--t4)] hover:text-[var(--t2)] no-underline transition-colors"
            >
              {'<-'} DATA
            </Link>
            <div className="w-px h-4 bg-[var(--bd)] shrink-0" />
            <span className="mono text-[length:var(--text-label)] font-bold text-[var(--t3)] tracking-wider">PERSPECTIVES</span>
            <span className="mono text-[length:var(--text-caption)] text-[var(--t4)]">{activeChannels.length} live desks</span>
          </div>
        </div>
      </div>

      <div className="border-b border-[var(--bd)] bg-[var(--bg-1)] shrink-0">
        <div className={`${isLandscapePhone ? 'safe-px' : 'px-5'} flex items-baseline gap-3 pt-4 pb-2`}>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[var(--teal)] animate-pulse" />
            <h2 className="mono text-[length:var(--text-body)] font-bold text-[var(--t1)] tracking-[0.12em]">
              PERSPECTIVES
            </h2>
          </div>
        </div>

        <div className={`${isLandscapePhone ? 'safe-px' : 'px-5'} flex gap-1 overflow-x-auto touch-scroll hide-scrollbar`}>
          {PRESETS.map((p) => {
            const isActive = presetId === p.id;

            return (
              <Button
                key={p.id}
                variant="ghost"
                onClick={() => handlePreset(p.id)}
                className={`rounded-b-none rounded-t px-4 py-2 h-auto border border-b-0 text-[length:var(--text-label)] mono font-bold tracking-wider transition-colors ${
                  isActive
                    ? 'bg-[var(--bg-app)] text-white border-[var(--bd)]'
                    : 'bg-transparent text-[var(--t4)] border-transparent hover:text-[var(--t2)] hover:bg-[var(--bg-2)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  {p.label}
                </div>
                {isActive && (
                  <div className="mt-0.5 hidden text-left text-[length:var(--text-tiny)] font-normal text-[var(--t4)] md:block">
                    {p.description}
                  </div>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      <div className={`flex items-center justify-between border-b border-[var(--bd)] bg-[var(--bg-2)] py-2 shrink-0 ${isLandscapePhone ? 'safe-px' : 'px-5'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="mono text-[length:var(--text-caption)] text-[var(--t4)]">ACTIVE PERSPECTIVE</span>
          <span className="mono text-[length:var(--text-label)] font-bold text-[var(--t1)] tracking-wider">{preset.label}</span>
          <div className="w-px h-4 bg-[var(--bd)] shrink-0" />
          <span className="mono text-[length:var(--text-caption)] text-[var(--t4)]">{activeChannels.length} channels</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="dot dot-live" />
          <span className="mono text-[length:var(--text-caption)] text-[var(--t4)]">autoplay · focus to interact</span>
        </div>
      </div>

      <ChannelGrid channels={activeChannels} />
    </div>
  );
}
