'use client';

import { Button } from '@/components/ui/button';

import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';

import type { ConflictCollection } from '@/types/domain';

type ConflictBannerProps = {
  collection: ConflictCollection;
  activeChannel: number;
  onChannelChange: (idx: number) => void;
};

export function ConflictBanner({ collection, activeChannel, onChannelChange }: ConflictBannerProps) {
  const isLandscapePhone = useIsLandscapePhone();

  return (
    <div className="border-b border-[var(--bd)] bg-[var(--bg-1)]">
      {/* Collection header */}
      <div className={`${isLandscapePhone ? 'safe-px' : 'px-5'} pt-4 pb-2 flex items-baseline gap-3`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--danger)] animate-pulse" />
          <h2 className="mono text-[length:var(--text-body)] font-bold text-[var(--t1)] tracking-[0.12em]">
            {collection.name}
          </h2>
        </div>
        <span className="text-[length:var(--text-label)] text-[var(--t4)]">{collection.description}</span>
      </div>

      {/* Channel tabs */}
      <div className={`${isLandscapePhone ? 'safe-px' : 'px-5'} flex gap-1 overflow-x-auto touch-scroll hide-scrollbar`}>
        {collection.channels.map((ch, idx) => {
          const active = idx === activeChannel;
          return (
            <Button
              key={ch.label}
              variant="ghost"
              onClick={() => onChannelChange(idx)}
              className={`
                px-4 py-2 h-auto rounded-t rounded-b-none text-[length:var(--text-label)] mono font-bold tracking-wider transition-colors border border-b-0
                ${active
                  ? 'bg-[var(--bg-app)] text-white border-[var(--bd)]'
                  : 'bg-transparent text-[var(--t4)] border-transparent hover:text-[var(--t2)] hover:bg-[var(--bg-2)]'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: ch.color }}
                />
                {ch.label}
              </div>
              {active && (
                <div className="text-[length:var(--text-tiny)] font-normal text-[var(--t4)] mt-0.5 text-left">
                  {ch.perspective}
                </div>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
