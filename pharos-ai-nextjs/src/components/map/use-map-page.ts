'use client';

import { useCallback, useMemo, useState } from 'react';

import { useAppSelector, useAppDispatch } from '@/store';
import {
  setViewState    as setViewStateAction,
  activateStory   as activateStoryAction,
  setActiveStory  as setActiveStoryAction,
  setSelectedItem as setSelectedItemAction,
  toggleSidebar   as toggleSidebarAction,
  setSidebarOpen  as setSidebarOpenAction,
  setMapStyle     as setMapStyleAction,
} from '@/store/map-slice';
import { useMapStories } from '@/api/map';
import { useMapFilters } from '@/hooks/use-map-filters';
import { useMapLayers } from '@/hooks/use-map-layers';
import { createBuildTooltip } from '@/lib/map-tooltip';

import type { MapViewState, PickingInfo } from '@deck.gl/core';
import type { StrikeArc, MissileTrack, Target, Asset, ThreatZone } from '@/data/map-data';
import type { OverlayVisibility } from '@/components/map/MapVisibilityMenu';

export function useMapPage({ isMobile }: { isMobile: boolean }) {
  const dispatch = useAppDispatch();
  const viewState    = useAppSelector(s => s.map.viewState);
  const activeStory  = useAppSelector(s => s.map.activeStory);
  const selectedItem = useAppSelector(s => s.map.selectedItem);
  const sidebarOpen  = useAppSelector(s => s.map.sidebarOpen);
  const mapStyle     = useAppSelector(s => s.map.mapStyle);
  const { data: stories = [] } = useMapStories();

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
    isSatellite: mapStyle === 'satellite',
    isMobile,
  });

  const handleMapClick = useCallback(({ object, layer }: PickingInfo) => {
    if (!object || !layer) { dispatch(setSelectedItemAction(null)); return; }
    const id = layer.id;
    if (id === 'strikes')                                dispatch(setSelectedItemAction({ type: 'strike',  data: object as StrikeArc   }));
    else if (id === 'missiles')                          dispatch(setSelectedItemAction({ type: 'missile', data: object as MissileTrack }));
    else if (id === 'targets' || id === 'target-labels') dispatch(setSelectedItemAction({ type: 'target',  data: object as Target      }));
    else if (id === 'assets'  || id === 'asset-labels')  dispatch(setSelectedItemAction({ type: 'asset',   data: object as Asset       }));
    else if (id === 'zones')                             dispatch(setSelectedItemAction({ type: 'zone',    data: object as ThreatZone  }));
    else dispatch(setSelectedItemAction(null));
  }, [dispatch]);

  const showTimeline = overlayVisibility.timeline && !(isMobile && !!selectedItem);

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
    // Actions (pre-bound for convenience)
    setViewState:    (vs: MapViewState) => { dispatch(setViewStateAction(vs)); },
    activateStory:   (story: Parameters<typeof activateStoryAction>[0]) => dispatch(activateStoryAction(story)),
    setActiveStory:  (story: Parameters<typeof setActiveStoryAction>[0]) => dispatch(setActiveStoryAction(story)),
    setSelectedItem: (item: Parameters<typeof setSelectedItemAction>[0]) => dispatch(setSelectedItemAction(item)),
    toggleSidebar:   () => dispatch(toggleSidebarAction()),
    setSidebarOpen:  (open: boolean) => dispatch(setSidebarOpenAction(open)),
    setMapStyle:     (style: Parameters<typeof setMapStyleAction>[0]) => dispatch(setMapStyleAction(style)),
  };
}

export type MapPageContext = ReturnType<typeof useMapPage>;
