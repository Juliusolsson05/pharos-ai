'use client';

import type { EconomicIndex } from '@/types/domain';
import type { MarketResult } from '@/types/domain';
import { ECON_CATEGORY_MAP } from '@/data/economic-indexes';
import { MiniChart } from './MiniChart';

type IndexCardProps = {
  index: EconomicIndex;
  data?: MarketResult;
  loading: boolean;
  onFocus: () => void;
};

export function IndexCard({ index, data, loading, onFocus }: IndexCardProps) {
  const cat = ECON_CATEGORY_MAP[index.category];
  const positive = (data?.changePct ?? 0) >= 0;
  const changeColor = positive ? 'var(--success)' : 'var(--danger)';
  const canFocus = !loading && !!data && !data.error && data.chart.length > 0;

  return (
    <div
      className={`group flex flex-col overflow-hidden bg-[var(--bg-1)] border border-[var(--bd)] transition-all duration-150 ${
        canFocus ? 'hover:border-white/20 hover:bg-[var(--bg-2)] cursor-pointer' : ''
      }`}
      onClick={canFocus ? onFocus : undefined}
      title={canFocus ? `Click to expand ${index.shortName}` : undefined}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--bd)]">
        <div className="w-[6px] h-[6px] rounded-full shrink-0" style={{ backgroundColor: index.color }} />
        <span className="mono text-[10px] font-bold text-[var(--t1)] tracking-wide">{index.shortName}</span>

        {/* Tier badge */}
        <span
          className="mono text-[7px] font-bold px-[4px] py-[1px] tracking-wider"
          style={{
            color: index.tier === 1 ? 'var(--danger)' : index.tier === 2 ? 'var(--warning)' : 'var(--t4)',
            background: index.tier === 1 ? 'var(--danger-dim)' : index.tier === 2 ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${index.tier === 1 ? 'var(--danger-bd)' : index.tier === 2 ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.1)'}`,
          }}
        >
          T{index.tier}
        </span>

        {/* Category tag */}
        <span
          className="mono text-[7px] font-bold px-[4px] py-[1px] tracking-wider"
          style={{ color: cat.color, background: `${cat.color}18`, border: `1px solid ${cat.color}30` }}
        >
          {cat.label}
        </span>

        {/* Price + change — right aligned */}
        <div className="ml-auto flex items-center gap-2">
          {loading ? (
            <span className="mono text-[10px] text-[var(--t4)] animate-pulse">…</span>
          ) : data?.error ? (
            <span className="mono text-[9px] text-[var(--danger)]">ERR</span>
          ) : (
            <>
              <span className="mono text-[13px] font-bold text-[var(--t1)]">
                {index.unit === '$' ? '$' : ''}
                {data?.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
                {index.unit === '%' ? '%' : ''}
              </span>
              <div className="flex flex-col items-end">
                <span className="mono text-[10px] font-bold" style={{ color: changeColor }}>
                  {(data?.changePct ?? 0) >= 0 ? '+' : ''}{data?.change.toFixed(2)}
                </span>
                <span className="mono text-[9px]" style={{ color: changeColor }}>
                  {(data?.changePct ?? 0) >= 0 ? '▲' : '▼'} {Math.abs(data?.changePct ?? 0).toFixed(2)}%
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart area — shows expand hint on hover */}
      <div className="flex-1 min-h-0 relative">
        {loading ? (
          <div className="flex items-center justify-center h-[80px]">
            <div className="w-4 h-4 border-2 border-white/10 border-t-white/30 rounded-full animate-spin" />
          </div>
        ) : data?.chart && data.chart.length > 0 ? (
          <>
            <MiniChart data={data.chart} color={index.color} positive={positive} height={80} />
            {/* Hover expand hint */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
              <span className="mono text-[8px] text-white/60 bg-black/50 px-2 py-1 tracking-widest">
                ⊞ EXPAND
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-[80px]">
            <span className="mono text-[9px] text-[var(--t4)]">NO DATA</span>
          </div>
        )}
      </div>

      {/* Footer — description */}
      <div className="px-3 py-[6px] border-t border-[var(--bd)]">
        <p className="text-[9px] text-[var(--t4)] leading-snug line-clamp-1">{index.description}</p>
      </div>
    </div>
  );
}
