import type { MapViewState } from '@deck.gl/core';

import type { SelectedItem } from '@/features/map/components/types';

import type { Asset, Target } from '@/data/map-data';
import type { MapStory } from '@/types/domain';

type LabelCandidate = {
  id: string;
  kind: 'target' | 'asset';
  point: Target | Asset;
  position: [number, number];
  score: number;
  pinned: boolean;
};

type LabelSelection = {
  targets: Target[];
  assets: Asset[];
};

const PRIORITY_SCORE = { P1: 130, P2: 80, P3: 30 } as const;
const STATUS_SCORE = { ACTIVE: 10, DEGRADED: 40, STRUCK: 85, DAMAGED: 110, DESTROYED: 140 } as const;
const TYPE_SCORE = { CARRIER: 150, NUCLEAR_SITE: 130, AIR_BASE: 110, NAVAL_BASE: 105, COMMAND: 80, ARMY_BASE: 55, INFRASTRUCTURE: 15 } as const;

function labelBudget(zoom: number) {
  if (zoom < 4.5) return { maxTotal: 10, maxPerCell: 1, cellLng: 7, cellLat: 4 };
  if (zoom < 5.5) return { maxTotal: 16, maxPerCell: 1, cellLng: 4.5, cellLat: 2.8 };
  if (zoom < 6.5) return { maxTotal: 24, maxPerCell: 2, cellLng: 2.4, cellLat: 1.6 };
  if (zoom < 7.5) return { maxTotal: 34, maxPerCell: 2, cellLng: 1.2, cellLat: 0.9 };
  return { maxTotal: 48, maxPerCell: 3, cellLng: 0.7, cellLat: 0.55 };
}

function recencyScore(timestamp?: string) {
  if (!timestamp) return -30;
  const age = Date.now() - new Date(timestamp).getTime();

  if (!Number.isFinite(age) || age < 0) return 0;
  if (age <= 12 * 60 * 60 * 1000) return 140;
  if (age <= 24 * 60 * 60 * 1000) return 110;
  if (age <= 3 * 24 * 60 * 60 * 1000) return 70;
  if (age <= 7 * 24 * 60 * 60 * 1000) return 35;

  return 0;
}

function centerBias(position: [number, number], viewState: MapViewState) {
  const lngSpan = 360 / 2 ** Math.max(viewState.zoom - 1, 0);
  const latSpan = 180 / 2 ** Math.max(viewState.zoom - 1, 0);
  const lngDist = Math.abs(position[0] - viewState.longitude) / Math.max(lngSpan, 0.0001);
  const latDist = Math.abs(position[1] - viewState.latitude) / Math.max(latSpan, 0.0001);

  return Math.max(0, 60 - (lngDist + latDist) * 90);
}

function isInViewport(position: [number, number], viewState: MapViewState) {
  const lngSpan = 360 / 2 ** Math.max(viewState.zoom - 1, 0);
  const latSpan = 180 / 2 ** Math.max(viewState.zoom - 1, 0);
  const lngDist = Math.abs(position[0] - viewState.longitude);
  const latDist = Math.abs(position[1] - viewState.latitude);

  return lngDist <= lngSpan * 0.7 && latDist <= latSpan * 0.7;
}

function isSelected(point: Target | Asset, selectedItem: SelectedItem | null) {
  return selectedItem?.type === 'target' || selectedItem?.type === 'asset'
    ? selectedItem.data.id === point.id
    : false;
}

function scoreTarget(target: Target, viewState: MapViewState, selectedItem: SelectedItem | null, activeStory: MapStory | null) {
  return (PRIORITY_SCORE[target.priority] ?? 0)
    + (STATUS_SCORE[target.status] ?? 0)
    + (TYPE_SCORE[target.type] ?? 0)
    + recencyScore(target.timestamp)
    + centerBias(target.position, viewState)
    + (activeStory?.highlightTargetIds.includes(target.id) ? 320 : activeStory ? -60 : 0)
    + (isSelected(target, selectedItem) ? 1000 : 0);
}

function scoreAsset(asset: Asset, viewState: MapViewState, selectedItem: SelectedItem | null, activeStory: MapStory | null) {
  return (PRIORITY_SCORE[asset.priority] ?? 0)
    + (STATUS_SCORE[asset.status] ?? 0)
    + (TYPE_SCORE[asset.type] ?? 0)
    + recencyScore(asset.timestamp)
    + centerBias(asset.position, viewState)
    + (activeStory?.highlightAssetIds.includes(asset.id) ? 320 : activeStory ? -70 : 0)
    + (!asset.timestamp && asset.priority === 'P3' ? -45 : 0)
    + (isSelected(asset, selectedItem) ? 1000 : 0);
}

function toCellKey(position: [number, number], zoom: number) {
  const budget = labelBudget(zoom);
  const lng = Math.floor((position[0] + 180) / budget.cellLng);
  const lat = Math.floor((position[1] + 90) / budget.cellLat);

  return `${lng}:${lat}`;
}

export function selectVisibleLabels(
  targets: Target[],
  assets: Asset[],
  viewState: MapViewState,
  selectedItem: SelectedItem | null,
  activeStory: MapStory | null,
): LabelSelection {
  const budget = labelBudget(viewState.zoom);
  const candidates: LabelCandidate[] = [
    ...targets.map((target) => ({
      id: target.id,
      kind: 'target' as const,
      point: target,
      position: target.position,
      score: scoreTarget(target, viewState, selectedItem, activeStory),
      pinned: isSelected(target, selectedItem) || !!activeStory?.highlightTargetIds.includes(target.id),
    })),
    ...assets.map((asset) => ({
      id: asset.id,
      kind: 'asset' as const,
      point: asset,
      position: asset.position,
      score: scoreAsset(asset, viewState, selectedItem, activeStory),
      pinned: isSelected(asset, selectedItem) || !!activeStory?.highlightAssetIds.includes(asset.id),
    })),
  ]
    .filter((candidate) => isSelected(candidate.point, selectedItem) || isInViewport(candidate.position, viewState))
    .sort((a, b) => b.score - a.score);

  const picked = new Set<string>();
  const cellCounts = new Map<string, number>();
  const selected: LabelCandidate[] = [];

  for (const candidate of candidates) {
    const cellKey = toCellKey(candidate.position, viewState.zoom);
    const cellCount = cellCounts.get(cellKey) ?? 0;
    const canBypassCell = candidate.pinned && selected.length < Math.min(12, budget.maxTotal);

    if (!canBypassCell && (selected.length >= budget.maxTotal || cellCount >= budget.maxPerCell)) continue;
    if (picked.has(candidate.id)) continue;

    picked.add(candidate.id);
    selected.push(candidate);
    cellCounts.set(cellKey, cellCount + 1);
  }

  return {
    targets: selected.filter((item): item is LabelCandidate & { point: Target; kind: 'target' } => item.kind === 'target').map((item) => item.point),
    assets: selected.filter((item): item is LabelCandidate & { point: Asset; kind: 'asset' } => item.kind === 'asset').map((item) => item.point),
  };
}
