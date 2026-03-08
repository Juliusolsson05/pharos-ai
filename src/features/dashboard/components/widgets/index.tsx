import type React from 'react';

import type { WidgetKey } from '@/features/dashboard/state/presets';

import { ActorsWidget } from './ActorsWidget';
import { AlertsWidget } from './AlertsWidget';
import { BriefWidget } from './BriefWidget';
import { CasualtiesWidget } from './CasualtiesWidget';
import { CommandersWidget } from './CommandersWidget';
import { EscalationWidget } from './EscalationWidget';
import { KeyFactsWidget } from './KeyFactsWidget';
import { LiveFeedWidget } from './LiveFeedWidget';
import { LatestEventsWidget } from './LatestEventsWidget';
import { MapWidget } from './MapWidget';
import { PredictionsWidget } from './PredictionsWidget';
import { SignalsWidget } from './SignalsWidget';
import { SituationWidget } from './SituationWidget';
import { SourceNetworkWidget } from './SourceNetworkWidget';
import { StrategyWidget } from './StrategyWidget';
import { TemporalWidget } from './TemporalWidget';
import { ThreatWidget } from './ThreatWidget';

export function widgetComponents(): Record<WidgetKey, () => React.ReactNode> {
  return {
    situation:   () => <SituationWidget />,
    latest:      () => <LatestEventsWidget />,
    actors:      () => <ActorsWidget />,
    signals:     () => <SignalsWidget />,
    map:         () => <MapWidget />,
    keyfacts:    () => <KeyFactsWidget />,
    casualties:  () => <CasualtiesWidget />,
    commanders:  () => <CommandersWidget />,
    predictions: () => <PredictionsWidget />,
    brief:       () => <BriefWidget />,
    threat:      () => <ThreatWidget />,
    alerts:      () => <AlertsWidget />,
    escalation:  () => <EscalationWidget />,
    livefeed:    () => <LiveFeedWidget />,
    temporal:    () => <TemporalWidget />,
    sourcenet:   () => <SourceNetworkWidget />,
    strategy:    () => <StrategyWidget />,
  };
}
