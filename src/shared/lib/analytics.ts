import { captureAnalyticsEvent } from '@/shared/lib/analytics/client';

export type AnalyticsEventName =
  | 'actor_selected'
  | 'actor_tab_changed'
  | 'brief_view_changed'
  | 'dashboard_view_changed'
  | 'economics_index_focused'
  | 'economics_range_changed'
  | 'event_selected'
  | 'event_tab_changed'
  | 'map_object_clicked'
  | 'map_story_activated'
  | 'map_style_changed'
  | 'navigation_clicked'
  | 'news_view_changed'
  | 'prediction_market_opened'
  | 'predictions_view_changed'
  | 'perspectives_preset_changed'
  ;

export type AnalyticsLayoutMode = 'desktop' | 'mobile' | 'landscape_phone';

export type AnalyticsSurface =
  | 'actors'
  | 'browse_landing'
  | 'browse_navigation'
  | 'dashboard_brief'
  | 'dashboard_data'
  | 'dashboard_header'
  | 'dashboard_overview'
  | 'dashboard_predictions'
  | 'events'
  | 'news';

type NavigationClickProperties = {
  component: string;
  cta_variant?: string;
  data_source_id?: string;
  destination_path: string;
  layout_mode: AnalyticsLayoutMode;
  pathname: string;
  surface: AnalyticsSurface;
  widget_key?: string;
};

type ViewChangeProperties = {
  control: string;
  day?: string;
  layout_mode: AnalyticsLayoutMode;
  pathname: string;
  surface: AnalyticsSurface;
  value: string | boolean;
};

type PredictionMarketOpenProperties = {
  active_only: boolean;
  group_id: string;
  layout_mode: AnalyticsLayoutMode;
  market_id: string;
  pathname: string;
  sort_by: string;
  surface: 'dashboard_predictions';
};

export function track(event: AnalyticsEventName, properties?: Record<string, unknown>) {
  captureAnalyticsEvent(event, properties);
}

export function getAnalyticsLayoutMode(options: {
  isLandscapePhone?: boolean;
  isMobile?: boolean;
}): AnalyticsLayoutMode {
  if (options.isLandscapePhone) return 'landscape_phone';
  if (options.isMobile) return 'mobile';
  return 'desktop';
}

export function trackNavigationClicked(properties: NavigationClickProperties) {
  track('navigation_clicked', properties);
}

export function trackDashboardViewChanged(properties: ViewChangeProperties) {
  track('dashboard_view_changed', properties);
}

export function trackBriefViewChanged(properties: ViewChangeProperties) {
  track('brief_view_changed', properties);
}

export function trackPredictionsViewChanged(properties: ViewChangeProperties) {
  track('predictions_view_changed', properties);
}

export function trackPredictionMarketOpened(properties: PredictionMarketOpenProperties) {
  track('prediction_market_opened', properties);
}
