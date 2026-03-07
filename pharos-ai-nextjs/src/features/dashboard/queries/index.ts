import { useQuery } from '@tanstack/react-query';
import type { BootstrapData } from '@/types/domain';
import { api } from '@/shared/lib/query/client';
import { queryKeys } from '@/shared/lib/query/keys';

export function useBootstrap() {
  return useQuery({
    queryKey: queryKeys.bootstrap.all(),
    queryFn: () => api.get<BootstrapData>('/bootstrap'),
    staleTime: 5 * 60 * 1000,
  });
}
