'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { STALE } from '@/shared/lib/query/keys';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: STALE.SHORT, refetchOnWindowFocus: true } },
});

type Props = { children: React.ReactNode };

export function QueryProvider({ children }: Props) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
