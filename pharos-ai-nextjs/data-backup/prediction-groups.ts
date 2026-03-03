import type { MarketGroup } from '@/types/domain';

export const MARKET_GROUPS: MarketGroup[] = [
  {
    id: 'regime-change',
    label: 'REGIME CHANGE',
    description: 'Iranian leadership transitions and governmental collapse',
    color: '#E76A6E',
    bg: 'rgba(231,106,110,0.08)',
    border: 'rgba(231,106,110,0.25)',
    titleMatches: ['khamenei', 'supreme leader', 'regime change', 'iran government'],
  },
  {
    id: 'military-ops',
    label: 'MILITARY OPERATIONS',
    description: 'Active strike campaigns, war declarations, and offensive operations',
    color: '#EC9A3C',
    bg: 'rgba(236,154,60,0.08)',
    border: 'rgba(236,154,60,0.25)',
    titleMatches: [
      'strike iran', 'strikes iran', 'strike on iran',
      'declare war on iran', 'war on iran', 'officially declare war',
      'which countries will strike',
      'us/israel strikes', 'us or israel strike',
    ],
  },
  {
    id: 'hormuz',
    label: 'STRAIT OF HORMUZ',
    description: 'Closure or disruption of the critical maritime chokepoint',
    color: '#4C90F0',
    bg: 'rgba(76,144,240,0.08)',
    border: 'rgba(76,144,240,0.25)',
    titleMatches: ['hormuz', 'strait of hormuz', 'strait'],
  },
  {
    id: 'nuclear',
    label: 'NUCLEAR NEGOTIATIONS',
    description: 'US–Iran nuclear deal timelines and enrichment agreements',
    color: '#A28BE0',
    bg: 'rgba(162,139,224,0.08)',
    border: 'rgba(162,139,224,0.25)',
    titleMatches: ['nuclear deal', 'nuclear agreement', 'nuclear negotiat', 'nuclear weapons', 'enrichment'],
  },
  {
    id: 'ceasefire',
    label: 'CEASEFIRE & DIPLOMACY',
    description: 'Conflict resolution, ceasefires, and diplomatic outcomes',
    color: '#23A26D',
    bg: 'rgba(35,162,109,0.08)',
    border: 'rgba(35,162,109,0.25)',
    titleMatches: ['ceasefire', 'peace deal', 'peace agreement', 'truce', 'end war', 'diplomatic'],
  },
  {
    id: 'economic',
    label: 'ECONOMIC IMPACT',
    description: 'Oil markets, sanctions, and regional economic fallout',
    color: '#E8D24C',
    bg: 'rgba(232,210,76,0.08)',
    border: 'rgba(232,210,76,0.25)',
    titleMatches: ['oil price', 'crude', 'brent', 'sanctions', 'iran economy', 'iran oil'],
  },
];

export const UNCATEGORIZED_GROUP: MarketGroup = {
  id: 'uncategorized',
  label: 'UNCATEGORIZED',
  description: 'Pending LLM classification',
  color: 'var(--t4)',
  bg: 'rgba(95,107,124,0.06)',
  border: 'rgba(95,107,124,0.2)',
  titleMatches: [],
};

export function assignGroup(title: string): MarketGroup {
  const lower = title.toLowerCase();
  for (const group of MARKET_GROUPS) {
    if (group.titleMatches.some(match => lower.includes(match))) {
      return group;
    }
  }
  return UNCATEGORIZED_GROUP;
}
