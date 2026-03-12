import { useQuery } from '@tanstack/react-query';

import { api, buildUrl } from '@/shared/lib/query/client';
import { queryKeys, REFETCH, STALE } from '@/shared/lib/query/keys';

import type { EconFilters, EconomicIndex, MarketResult } from '@/types/domain';

export function useEconomicIndexes(filters?: EconFilters) {
  return useQuery({
    queryKey: queryKeys.economics.indexes(filters),
    queryFn: () =>
      api.get<EconomicIndex[]>(
        buildUrl('/economics/indexes', {
          tier: filters?.tier,
          category: filters?.category,
        }),
      ),
    staleTime: STALE.LONG,
    refetchInterval: REFETCH.SLOW,
  });
}

export function useMarketData(
  tickers: string[],
  range: { key: string; interval: string },
) {
  const tickerStr = tickers.join(',');
  return useQuery({
    queryKey: queryKeys.economics.markets(tickerStr, range.key, range.interval),
    queryFn: () =>
      api.get<{ results: MarketResult[] }>(
        buildUrl('/markets', {
          tickers: tickerStr,
          range: range.key,
          interval: range.interval,
        }),
      ),
    staleTime: STALE.LONG,
    enabled: tickers.length > 0,
    refetchInterval: REFETCH.FAST,
  });
}
