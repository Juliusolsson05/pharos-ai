'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { MapViewState, PickingInfo } from '@deck.gl/core';

import type { OverlayVisibility } from '@/features/map/components/MapVisibilityMenu';
import type { SelectedItem } from '@/features/map/components/types';
import { useMapFilters } from '@/features/map/hooks/use-map-filters';
import { useMapLayers } from '@/features/map/hooks/use-map-layers';
import { createBuildTooltip } from '@/features/map/lib/map-tooltip';
import { useMapStories } from '@/features/map/queries';
import {
  activateStory   as activateStoryAction,
  setActiveStory  as setActiveStoryAction,
  setMapStyle     as setMapStyleAction,
  setSelectedItem as setSelectedItemAction,
  setSidebarOpen  as setSidebarOpenAction,
  setViewState    as setViewStateAction,
  toggleSidebar   as toggleSidebarAction,
} from '@/features/map/state/map-slice';

import { track } from '@/shared/lib/analytics';

import type { Asset, MissileTrack, StrikeArc, Target, ThreatZone } from '@/data/map-data';

import { useAppDispatch, useAppSelector } from '@/shared/state';

export function useMapPage({ isMobile }: { isMobile: boolean }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewState    = useAppSelector(s => s.map.viewState);
  const activeStory  = useAppSelector(s => s.map.activeStory);
  const selectedItem = useAppSelector(s => s.map.selectedItem);
  const sidebarOpen  = useAppSelector(s => s.map.sidebarOpen);
  const mapStyle     = useAppSelector(s => s.map.mapStyle);
  const { data: stories = [], isLoading: storiesLoading } = useMapStories();

  const [overlayVisibility, setOverlayVisibility] = useState<OverlayVisibility>(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches
      ? { timeline: true, filters: false, legend: false }
      : { timeline: true, filters: true, legend: true }
  ));

  const toggleOverlay = useCallback((key: keyof OverlayVisibility) => {
    setOverlayVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const f = useMapFilters();
  const tooltip = useMemo(() => createBuildTooltip(f.actorMeta), [f.actorMeta]);

  const layers = useMapLayers({
    filtered:    f.filtered,
    actorMeta:   f.actorMeta,
    activeStory,
    selectedItem,
    viewState,
    isSatellite: mapStyle === 'satellite',
    isMobile,
  });

  const handleMapClick = useCallback(({ object, layer }: PickingInfo): SelectedItem | null => {
    if (!object || !layer) {
      dispatch(setSelectedItemAction(null));
      return null;
    }

    const id = layer.id;
    let next: SelectedItem | null = null;
    if (id === 'strikes') next = { type: 'strike', data: object as StrikeArc };
    else if (id === 'missiles') next = { type: 'missile', data: object as MissileTrack };
    else if (id === 'targets' || id === 'target-labels') next = { type: 'target', data: object as Target };
    else if (id === 'assets' || id === 'asset-labels') next = { type: 'asset', data: object as Asset };
    else if (id === 'zones') next = { type: 'zone', data: object as ThreatZone };

    dispatch(setSelectedItemAction(next));
    if (next) track('map_object_clicked', { type: next.type });
    return next;
  }, [dispatch]);

  const showTimeline = overlayVisibility.timeline && !(isMobile && !!selectedItem);
  const isLoading = storiesLoading || f.isLoading;

  const storyId = searchParams.get('story');

  useEffect(() => {
    if (!storyId) {
      if (activeStory) dispatch(setActiveStoryAction(null));
      return;
    }

    const nextStory = stories.find(story => story.id === storyId) ?? null;
    if (!nextStory) return;
    if (activeStory?.id === nextStory.id) return;

    dispatch(activateStoryAction(nextStory));
  }, [activeStory, dispatch, stories, storyId]);

  const syncStoryQuery = useCallback((story: Parameters<typeof activateStoryAction>[0] | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (story) next.set('story', story.id);
    else next.delete('story');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return {
    dispatch,
    viewState,
    activeStory,
    selectedItem,
    sidebarOpen,
    mapStyle,
    stories,
    overlayVisibility,
    toggleOverlay,
    f,
    tooltip,
    layers,
    handleMapClick,
    showTimeline,
    isLoading,
    // Actions (pre-bound for convenience)
    setViewState:    (vs: MapViewState) => { dispatch(setViewStateAction(vs)); },
    activateStory:   (story: Parameters<typeof activateStoryAction>[0]) => {
      syncStoryQuery(story);
      track('map_story_activated', { story_id: story?.id });
      return dispatch(activateStoryAction(story));
    },
    setActiveStory:  (story: Parameters<typeof setActiveStoryAction>[0]) => {
      syncStoryQuery(story);
      return dispatch(setActiveStoryAction(story));
    },
    setSelectedItem: (item: Parameters<typeof setSelectedItemAction>[0]) => dispatch(setSelectedItemAction(item)),
    toggleSidebar:   () => dispatch(toggleSidebarAction()),
    setSidebarOpen:  (open: boolean) => dispatch(setSidebarOpenAction(open)),
    setMapStyle:     (style: Parameters<typeof setMapStyleAction>[0]) => { track('map_style_changed', { style }); return dispatch(setMapStyleAction(style)); },
  };
}

export type MapPageContext = ReturnType<typeof useMapPage>;
