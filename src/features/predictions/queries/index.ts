import { useQuery } from '@tanstack/react-query';

import { api, buildUrl } from '@/shared/lib/query/client';
import { queryKeys, REFETCH, STALE } from '@/shared/lib/query/keys';

import type { MarketGroup, PredictionMarket, TimePoint } from '@/types/domain';

export function usePredictionGroups() {
  return useQuery({
    queryKey: queryKeys.predictions.groups(),
    queryFn: () => api.get<MarketGroup[]>('/predictions/groups'),
    staleTime: STALE.LONG,
    refetchInterval: REFETCH.SLOW,
  });
}

export function usePredictionMarkets() {
  return useQuery({
    queryKey: queryKeys.predictions.markets(),
    queryFn: () =>
      api.get<{ markets: PredictionMarket[]; fetchedAt?: string }>(
        '/predictions/markets',
      ),
    staleTime: STALE.LONG,
    refetchInterval: REFETCH.SLOW,
  });
}

export function usePredictionHistory(tokenId: string, range: string) {
  return useQuery({
    queryKey: queryKeys.predictions.history(tokenId, range),
    queryFn: () =>
      api.get<{ history: TimePoint[] }>(
        buildUrl('/predictions/history', { tokenId, range }),
      ),
    staleTime: STALE.LONG,
    refetchInterval: REFETCH.SLOW,
    enabled: !!tokenId,
  });
}

export function usePredictionChart(tokenId: string) {
  return useQuery({
    queryKey: queryKeys.predictions.chart(tokenId),
    queryFn: () =>
      api.get<{ history: TimePoint[] }>(
        `/predictions/chart?id=${tokenId}`,
      ),
    staleTime: STALE.LONG,
    refetchInterval: REFETCH.SLOW,
    enabled: !!tokenId,
  });
}
