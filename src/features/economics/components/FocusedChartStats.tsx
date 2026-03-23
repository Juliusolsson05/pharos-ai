'use client';

import { Button } from '@/components/ui/button';

import { fmtPct,fmtPrice } from '@/features/economics/components/focused-chart-constants';

import type { EconomicIndex } from '@/types/domain';

type Props = {
  index: EconomicIndex;
  periodOpen: number;
  periodHigh: number;
  periodLow: number;
  pctFromOpen: number;
  crosshairValue: { price: number; time: number } | null;
  anchorPrice: number | null;
  pctFromAnchor: number | null;
  anchorMode: boolean;
  setAnchorMode: (v: boolean | ((prev: boolean) => boolean)) => void;
  clearAnchor: () => void;
};

export function FocusedChartStats({
  index,
  periodOpen,
  periodHigh,
  periodLow,
  pctFromOpen,
  crosshairValue,
  anchorPrice,
  pctFromAnchor,
  anchorMode,
  setAnchorMode,
  clearAnchor,
}: Props) {
  return (
    <div className="flex items-center gap-0 px-4 py-2 border-b border-[var(--bd)] bg-[var(--bg-2)] shrink-0 overflow-x-auto">
      {[
        { label: 'OPEN',   value: fmtPrice(periodOpen, index.unit) },
        { label: 'HIGH',   value: fmtPrice(periodHigh, index.unit), color: 'var(--success)' },
        { label: 'LOW',    value: fmtPrice(periodLow,  index.unit), color: 'var(--danger)'  },
        { label: 'CHANGE', value: fmtPct(pctFromOpen), color: pctFromOpen >= 0 ? 'var(--success)' : 'var(--danger)' },
      ].map((s) => (
        <div key={s.label} className="flex items-center gap-3 pr-4 mr-4 border-r border-[var(--bd)] last:border-r-0">
          <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] tracking-widest shrink-0">{s.label}</span>
          <span className="mono text-[length:var(--text-body-sm)] font-bold" style={{ color: s.color ?? 'var(--t1)' }}>{s.value}</span>
        </div>
      ))}

      {/* Crosshair live value */}
      {crosshairValue && (
        <>
          <div className="w-px h-4 bg-[var(--bd)] mx-3" />
          <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] tracking-widest shrink-0">CURSOR</span>
          <span className="mono text-[length:var(--text-body-sm)] font-bold text-[var(--t1)] ml-2 shrink-0">
            {fmtPrice(crosshairValue.price, index.unit)}
          </span>
          {anchorPrice && (
            <span
              className="mono text-[length:var(--text-body-sm)] font-bold ml-3 shrink-0 px-2 py-0.5 rounded"
              style={{
                color: (pctFromAnchor ?? 0) >= 0 ? 'var(--success)' : 'var(--danger)',
                background: (pctFromAnchor ?? 0) >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              }}
            >
              {fmtPct(pctFromAnchor ?? 0)} from anchor
            </span>
          )}
        </>
      )}

      {/* Anchor controls */}
      <div className="ml-auto flex items-center gap-2 shrink-0">
        {anchorPrice && (
          <div className="flex items-center gap-2">
            <span className="mono text-[length:var(--text-tiny)] text-amber-400/80 tracking-wider">
              ANCHOR: {fmtPrice(anchorPrice, index.unit)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAnchor}
              className="mono text-[length:var(--text-tiny)] h-auto px-1 py-0 text-[var(--t4)] hover:text-[var(--danger)]"
            >
              ✕ CLEAR
            </Button>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAnchorMode(v => !v)}
          className={`mono text-[length:var(--text-tiny)] h-auto font-bold px-2 py-1 tracking-wider ${
            anchorMode
              ? 'text-amber-300 bg-amber-400/15 border-amber-400/40'
              : 'text-[var(--t4)] border-[var(--bd)] hover:text-[var(--t2)] hover:border-white/20'
          }`}
        >
          {anchorMode ? '⊕ CLICK CHART TO ANCHOR' : '⊕ SET ANCHOR'}
        </Button>
      </div>
    </div>
  );
}
