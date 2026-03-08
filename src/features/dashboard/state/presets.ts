// Widget & layout types

export type WidgetKey =
  | 'situation' | 'latest' | 'actors' | 'signals' | 'map'
  | 'keyfacts' | 'casualties' | 'commanders' | 'predictions' | 'brief'
  | 'threat' | 'alerts' | 'escalation' | 'livefeed' | 'temporal' | 'sourcenet' | 'strategy';

export type Column = {
  id: string;
  widgets: WidgetKey[];
};

export const ALL_WIDGET_KEYS: WidgetKey[] = [
  'situation', 'latest', 'actors', 'signals', 'map',
  'keyfacts', 'casualties', 'commanders', 'predictions', 'brief',
  'threat', 'alerts', 'escalation', 'livefeed', 'temporal', 'sourcenet', 'strategy',
];

export const WIDGET_LABELS: Record<WidgetKey, string> = {
  situation:   'Situation Summary',
  latest:      'Latest Events',
  actors:      'Actor Positions',
  signals:     'Field Signals',
  map:         'Intel Map',
  keyfacts:    'Key Facts',
  casualties:  'Casualties',
  commanders:  'Commanders',
  predictions: 'Prediction Markets',
  brief:       'Daily Brief',
  threat:      'Threat Assessment',
  alerts:      'Active Alerts',
  escalation:  'Escalation Analysis',
  livefeed:    'Live Event Feed',
  temporal:    'Temporal Analysis',
  sourcenet:   'Source Network',
  strategy:    'Strategic Game',
};

// Presets

export type PresetId = 'analyst' | 'commander' | 'executive' | 'intelligence';

export type WorkspaceLayout = { columns: Column[] };

type PresetDefinition = {
  label: string;
  description: string;
  columns: Column[];
  columnSizes: Record<string, number>;
};

export const PRESETS: Record<PresetId, PresetDefinition> = {
  analyst: {
    label: 'DEFAULT',
    description: 'Map-first layout with live event stream',
    columns: [
      { id: 'col-a', widgets: ['map'] },
      { id: 'col-b', widgets: ['latest'] },
    ],
    columnSizes: { 'col-a': 70, 'col-b': 30 },
  },
  commander: {
    label: 'PRESET 2',
    description: 'Operational focus with map, casualties, and key leaders',
    columns: [
      { id: 'col-a', widgets: ['map'] },
      { id: 'col-b', widgets: ['latest', 'casualties'] },
      { id: 'col-c', widgets: ['commanders', 'keyfacts'] },
    ],
    columnSizes: { 'col-a': 33.3, 'col-b': 33.3, 'col-c': 33.4 },
  },
  executive: {
    label: 'PRESET 3',
    description: 'High-level brief with predictions and key facts',
    columns: [
      { id: 'col-a', widgets: ['brief'] },
      { id: 'col-b', widgets: ['predictions', 'keyfacts'] },
      { id: 'col-c', widgets: ['situation'] },
    ],
    columnSizes: { 'col-a': 33.3, 'col-b': 33.3, 'col-c': 33.4 },
  },
  intelligence: {
    label: 'INTEL ENGINE',
    description: 'Full-spectrum conflict analysis: strategic game model, threat assessment, escalation ladder, temporal patterns, source network, and live event feed',
    columns: [
      { id: 'col-a', widgets: ['strategy', 'alerts'] },
      { id: 'col-b', widgets: ['threat', 'escalation'] },
      { id: 'col-c', widgets: ['temporal', 'sourcenet', 'livefeed'] },
    ],
    columnSizes: { 'col-a': 35, 'col-b': 30, 'col-c': 35 },
  },
};
