'use client';

import { Button } from '@/components/ui/button';

import { fmtPrice,RANGES } from '@/features/economics/components/focused-chart-constants';

import { ECON_CATEGORY_MAP } from '@/data/economic-indexes';
import type { EconomicIndex, MarketResult } from '@/types/domain';

type Props = {
  index: EconomicIndex;
  data: MarketResult;
  rangeIdx: number;
  setRangeIdx: (idx: number) => void;
  fetching: boolean;
  positive: boolean;
  handleClose: () => void;
};

export function FocusedChartHeader({ index, data, rangeIdx, setRangeIdx, fetching, positive, handleClose }: Props) {
  const cat = ECON_CATEGORY_MAP[index.category];

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--bd)] shrink-0">
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: index.color }} />
      <div>
        <span className="mono text-[length:var(--text-body)] font-bold text-[var(--t1)] tracking-wide">{index.shortName}</span>
        <span className="mono text-[length:var(--text-label)] text-[var(--t4)] ml-3">{index.name}</span>
      </div>

      {/* Badges */}
      <span
        className="mono text-[length:var(--text-micro)] font-bold px-[5px] py-[2px] tracking-wider"
        style={{
          color: index.tier === 1 ? 'var(--danger)' : index.tier === 2 ? 'var(--warning)' : 'var(--t4)',
          background: index.tier === 1 ? 'var(--danger-dim)' : index.tier === 2 ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${index.tier === 1 ? 'var(--danger-bd)' : index.tier === 2 ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.1)'}`,
        }}
      >
        T{index.tier}
      </span>
      <span
        className="mono text-[length:var(--text-micro)] font-bold px-[5px] py-[2px] tracking-wider"
        style={{ color: cat.color, background: `${cat.color}18`, border: `1px solid ${cat.color}30` }}
      >
        {cat.label}
      </span>

      {/* Range selector */}
      <div className="ml-auto flex items-center gap-1 mr-4">
        {RANGES.map((r, i) => (
          <Button
            key={r.key}
            variant="ghost"
            size="sm"
            onClick={() => setRangeIdx(i)}
            disabled={fetching}
            className={`px-2 py-1 h-auto rounded text-[length:var(--text-caption)] mono font-bold tracking-wider disabled:opacity-40 ${
              i === rangeIdx
                ? 'bg-white/12 text-white border border-white/25'
                : 'text-[var(--t4)] hover:text-[var(--t2)] border border-transparent hover:bg-white/5'
            }`}
          >
            {r.label}
          </Button>
        ))}
        {fetching && (
          <div className="w-3.5 h-3.5 border-[1.5px] border-white/10 border-t-white/50 rounded-full animate-spin ml-1" />
        )}
      </div>

      {/* Price */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="mono text-xl font-bold text-[var(--t1)] leading-none">
            {fmtPrice(data.price, index.unit)}
          </div>
          <div
            className="mono text-[length:var(--text-body-sm)] font-bold mt-0.5"
            style={{ color: positive ? 'var(--success)' : 'var(--danger)' }}
          >
            {positive ? '▲' : '▼'} {fmtPrice(Math.abs(data.change), index.unit)} ({Math.abs(data.changePct).toFixed(2)}%)
          </div>
        </div>

        {/* Close */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="w-8 h-8 text-[var(--t4)] hover:text-[var(--t1)] hover:bg-white/10 mono text-sm"
        >
          ✕
        </Button>
      </div>
    </div>
  );
}
