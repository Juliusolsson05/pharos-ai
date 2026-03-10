'use client';

import Link from 'next/link';

import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';
import { useLandscapeScrollEmitter } from '@/shared/hooks/use-landscape-scroll-emitter';

const DATA_SOURCES = [
  {
    href: '/dashboard/data/news',
    label: 'RSS NEWS MONITOR',
    description: 'Live RSS feeds from 30 global news sources. Multi-perspective conflict channels with Western, US/Pentagon, Israeli, and Iranian state media.',
    count: '30 feeds',
    status: 'LIVE',
    color: '#ef4444',
  },
  {
    href: '/dashboard/data/predictions',
    label: 'PREDICTION MARKETS',
    description: 'Live Polymarket prediction markets on Iran conflict outcomes — regime change, military ops, Hormuz, nuclear deals, ceasefire, economic impact.',
    count: '~60 markets',
    status: 'LIVE',
    color: '#a78bfa',
  },
  {
    href: '/dashboard/data/economics',
    label: 'ECONOMIC INDICATORS',
    description: '15 conflict-relevant market indexes — oil, gold, VIX, defense, currencies, shipping. Live charts via Yahoo Finance.',
    count: '15 indexes',
    status: 'LIVE',
    color: '#f59e0b',
  },
];

export default function DataIndexPage() {
  const isLandscapePhone = useIsLandscapePhone();
  const onLandscapeScroll = useLandscapeScrollEmitter(isLandscapePhone);

  return (
    <div
      className={`flex-1 ${isLandscapePhone ? 'overflow-y-auto safe-px py-3' : 'overflow-y-auto p-6'}`}
      onScroll={isLandscapePhone ? onLandscapeScroll : undefined}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-baseline gap-3 mb-6">
          <h1 className="mono text-base font-bold text-[var(--t1)] tracking-[0.1em]">DATA SOURCES</h1>
          <span className="text-[10px] text-[var(--t4)]">Open-source intelligence feeds</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DATA_SOURCES.map(source => (
            <Link
              key={source.label}
              href={source.href}
              className={`
                no-underline block p-5 border transition-colors
                ${source.status === 'LIVE'
                  ? 'bg-[var(--bg-1)] border-[var(--bd)] hover:bg-[var(--bg-2)] hover:border-white/20 cursor-pointer'
                  : 'bg-[var(--bg-1)] border-[var(--bd)] opacity-40 cursor-not-allowed pointer-events-none'
                }
              `}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: source.color }} />
                <span className="mono text-[11px] font-bold text-[var(--t1)] tracking-wider">
                  {source.label}
                </span>
                <span className={`ml-auto px-1.5 py-0.5 text-[7px] mono font-bold border ${
                  source.status === 'LIVE'
                    ? 'bg-[var(--danger-dim)] text-[var(--danger)] border-[var(--danger-bd)]'
                    : 'bg-white/5 text-[var(--t4)] border-white/10'
                }`}>
                  {source.status}
                </span>
              </div>
              <p className="text-[10px] text-[var(--t3)] leading-relaxed mb-2">
                {source.description}
              </p>
              <span className="mono text-[9px] text-[var(--t4)]">{source.count}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
