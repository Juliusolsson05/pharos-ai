import type { EconCategory } from '@/types/domain';

export const ECON_CATEGORIES: { key: EconCategory; label: string; color: string; description: string }[] = [
  { key: 'ENERGY',     label: 'ENERGY',       color: '#ef4444', description: 'Oil, gas, and energy commodities — direct conflict impact' },
  { key: 'SAFE_HAVEN', label: 'SAFE HAVEN',   color: '#f59e0b', description: 'Gold, treasuries — flight-to-safety indicators' },
  { key: 'VOLATILITY', label: 'VOLATILITY',   color: '#a78bfa', description: 'Fear gauges and risk metrics' },
  { key: 'EQUITIES',   label: 'EQUITIES',     color: '#3b82f6', description: 'Major stock indexes — broad market sentiment' },
  { key: 'DEFENSE',    label: 'DEFENSE',       color: '#60a5fa', description: 'Defense and aerospace sector' },
  { key: 'CURRENCY',   label: 'CURRENCY',      color: '#10b981', description: 'Key FX pairs affected by conflict' },
  { key: 'SHIPPING',   label: 'SHIPPING',      color: '#f97316', description: 'Maritime and logistics — Hormuz chokepoint impact' },
];

export const ECON_CATEGORY_MAP = Object.fromEntries(
  ECON_CATEGORIES.map(c => [c.key, c]),
) as Record<EconCategory, (typeof ECON_CATEGORIES)[number]>;
