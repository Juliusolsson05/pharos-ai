import type React from 'react';
import type { WidgetKey } from '@/features/dashboard/state/presets';

import { SituationWidget } from './SituationWidget';
import { LatestEventsWidget } from './LatestEventsWidget';
import { ActorsWidget } from './ActorsWidget';
import { SignalsWidget } from './SignalsWidget';
import { MapWidget } from './MapWidget';
import { KeyFactsWidget } from './KeyFactsWidget';
import { CasualtiesWidget } from './CasualtiesWidget';
import { CommandersWidget } from './CommandersWidget';
import { PredictionsWidget } from './PredictionsWidget';
import { BriefWidget } from './BriefWidget';

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
  };
}
