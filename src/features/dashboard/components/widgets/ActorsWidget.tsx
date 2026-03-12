'use client';

import { useContext } from 'react';

import Link from 'next/link';

import { Flag } from '@/shared/components/shared/Flag';

import { getActorForDay } from '@/shared/lib/day-filter';

import { ACT_C, STA_C } from '@/data/iran-actors';

import { DashCtx } from '../DashCtx';

export function ActorsWidget() {
  const { day, actors, allDays } = useContext(DashCtx);
  return (
    <div className="h-full overflow-y-auto">
      {actors.map((actor, i) => {
        const snap = getActorForDay(actor, day, allDays);
        if (!snap) return null;
        const actC = ACT_C[snap.activityLevel] ?? 'var(--t2)';
        const staC = STA_C[snap.stance] ?? 'var(--t2)';
        return (
          <Link key={actor.id} href={`/dashboard/actors?day=${day}&actor=${actor.id}`} className="no-underline">
            <div
              className="flex items-start gap-2.5 px-3 py-2 cursor-pointer hover:bg-[var(--bg-3)] transition-colors"
              style={{
                borderBottom: i < actors.length - 1 ? '1px solid var(--bd-s)' : 'none',
                borderLeft: `3px solid ${actC}`,
              }}
            >
              <div className="shrink-0 w-28">
                <div className="flex items-center gap-1 mb-0.5">
                  {actor.countryCode && <Flag code={actor.countryCode} size={18} />}
                  <span className="text-[11px] font-bold text-[var(--t1)]">{actor.name}</span>
                </div>
                <span
                  className="text-[7px] font-bold px-1 py-px tracking-[0.05em]"
                  style={{ background: staC + '18', color: staC }}
                >
                  {snap.stance}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10.5px] text-[var(--t2)] leading-snug line-clamp-2">▸ {snap.doing[0]}</p>
              </div>
              <div className="shrink-0 w-10 flex flex-col gap-0.5 items-end">
                <span className="mono text-[10px] font-bold" style={{ color: actC }}>{snap.activityScore}</span>
                <div className="w-9 h-[3px] bg-[var(--bd)]">
                  <div className="h-full" style={{ width: `${snap.activityScore}%`, background: actC }} />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
