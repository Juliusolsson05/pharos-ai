import type { Metadata } from 'next';

import { EventFilterBar } from '@/features/browse/components/events/EventFilterBar';
import { EventList } from '@/features/browse/components/events/EventList';
import { BrowsePageHeader } from '@/features/browse/components/layout/BrowsePageHeader';
import { BrowsePagination } from '@/features/browse/components/layout/BrowsePagination';
import { StructuredData } from '@/features/browse/components/seo/StructuredData';
import {
  buildBrowseMetadata,
  buildDescription,
  getCanonicalListPath,
  hasActiveFilters,
} from '@/features/browse/lib/seo';
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildItemListJsonLd,
} from '@/features/browse/lib/structured-data';
import { getEventDates, getEvents, PAGE_SIZE } from '@/features/browse/queries';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const severity = params.severity
    ? Array.isArray(params.severity) ? params.severity : [params.severity]
    : undefined;
  const date = typeof params.date === 'string' ? params.date : undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const isFiltered = hasActiveFilters([severity, date]);
  const path = isFiltered ? '/browse/events' : getCanonicalListPath('/browse/events', page);
  const title = isFiltered
    ? 'Filtered Iran Conflict Events'
    : page > 1 ? `Iran Conflict Events Timeline - Page ${page}` : 'Iran Conflict Events Timeline';
  const description = isFiltered
    ? buildDescription('Filtered Iran conflict events by severity and date. Browse airstrikes, diplomacy, intelligence operations, and humanitarian incidents with source-backed summaries.')
    : buildDescription('Track Iran conflict events in a searchable timeline covering airstrikes, diplomacy, intelligence operations, and humanitarian incidents with severity scoring and sources.');

  return buildBrowseMetadata({
    title,
    description,
    path,
    robots: { isIndexable: !isFiltered },
    image: { alt: 'Iran conflict events timeline on Conflicts.app' },
  });
}

export default async function BrowseEventsPage({ searchParams }: Props) {
  const params = await searchParams;
  const severity = params.severity
    ? Array.isArray(params.severity) ? params.severity : [params.severity]
    : undefined;
  const date = typeof params.date === 'string' ? params.date : undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const [{ events, total }, eventDatesSet] = await Promise.all([
    getEvents({ severity, date, page }),
    getEventDates(),
  ]);
  const eventDates = [...eventDatesSet];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const filterParams = new URLSearchParams();
  if (severity) for (const s of severity) filterParams.append('severity', s);
  if (date) filterParams.set('date', date);
  const filterQs = filterParams.toString();
  const canonicalPath = hasActiveFilters([severity, date])
    ? '/browse/events'
    : getCanonicalListPath('/browse/events', page);

  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: 'Browse', path: '/browse' },
      { name: 'Events', path: '/browse/events' },
    ]),
    buildCollectionPageJsonLd({
      name: 'Iran Conflict Events Timeline',
      description: 'Searchable timeline of Iran conflict events with source-backed summaries and severity scoring.',
      path: canonicalPath,
    }),
    buildItemListJsonLd({
      name: 'Iran Conflict Events',
      path: canonicalPath,
      items: events.map((event) => ({
        name: event.title,
        url: `/browse/events/${event.id}`,
        description: event.summary,
      })),
    }),
  ];

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <StructuredData data={jsonLd} />
      <BrowsePageHeader crumbs={[{ label: 'Events' }]} hasAutoRefresh />
      <header className="mt-6 mb-8">
        <p className="label mb-2">Intelligence feed</p>
        <h1 className="text-lg font-bold text-[var(--t1)] mb-1">Events</h1>
        <p className="text-xs text-[var(--t3)]">
          {total > PAGE_SIZE ? `Showing ${from}–${to} of ${total} events` : `${total} events`}
          {severity || date ? ' matching filters' : ' tracked across the Iran conflict'}
        </p>
      </header>
      <EventList events={events} page={page} filterBar={<EventFilterBar eventDates={eventDates} />} />
      {totalPages > 1 && (
        <div className="mt-10">
          <BrowsePagination page={page} totalPages={totalPages} basePath="/browse/events" searchParams={filterQs} />
        </div>
      )}
    </div>
  );
}
