'use client';

import { useQuery } from '@tanstack/react-query';

import { extractBatch, loadBatch, loadNightlightsManifest, loadReferenceFeatures } from '@/lib/api';

export type FetchTiming = { name: string; ms: number; count: number };

const KEYS = {
  manifest: ['nightlights', 'manifest'] as const,
  reference: ['providers', 'reference'] as const,
  batch: ['providers', 'batch'] as const,
};

export function useManifest() {
  return useQuery({
    queryKey: KEYS.manifest,
    queryFn: () => loadNightlightsManifest(),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useReference() {
  return useQuery({
    queryKey: KEYS.reference,
    queryFn: () => loadReferenceFeatures(),
    staleTime: 60_000,
  });
}

export function useBatch() {
  return useQuery({
    queryKey: KEYS.batch,
    queryFn: () => loadBatch(),
    staleTime: 30_000,
  });
}

export function useBatchData() {
  const batch = useBatch();
  const extracted = batch.data ? extractBatch(batch.data.data) : null;
  return { ...batch, extracted };
}
