import { useQuery } from '@tanstack/react-query';
import type { EconomicIndex, EconFilters } from '@/types/domain';
import { api, buildUrl } from '@/shared/lib/query/client';
import { queryKeys } from '@/shared/lib/query/keys';

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
    staleTime: 60 * 60 * 1000,
  });
}
