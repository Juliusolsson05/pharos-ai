import type { Metadata } from 'next';

import { ActorGrid } from '@/features/browse/components/actors/ActorGrid';
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
import { getActors, PAGE_SIZE } from '@/features/browse/queries';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const type = params.type ? Array.isArray(params.type) ? params.type : [params.type] : undefined;
  const affiliation = params.affiliation
    ? Array.isArray(params.affiliation) ? params.affiliation : [params.affiliation]
    : undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const isFiltered = hasActiveFilters([type, affiliation]);
  const path = isFiltered ? '/browse/actors' : getCanonicalListPath('/browse/actors', page);
  const title = isFiltered
    ? 'Filtered Iran Conflict Actors'
    : page > 1 ? `Iran Conflict Actors - Page ${page}` : 'Iran Conflict Actors';
  const description = isFiltered
    ? buildDescription('Filtered Iran conflict actors by type and affiliation. Browse state and non-state entities with activity scores, stances, and intelligence assessments.')
    : buildDescription('Browse Iran conflict actors across state and non-state entities with activity scores, affiliations, stances, and intelligence assessments.');

  return buildBrowseMetadata({
    title,
    description,
    path,
    robots: { isIndexable: !isFiltered },
    image: { alt: 'Iran conflict actor intelligence profiles on Conflicts.app' },
  });
}

export default async function BrowseActorsPage({ searchParams }: Props) {
  const params = await searchParams;
  const type = params.type ? Array.isArray(params.type) ? params.type : [params.type] : undefined;
  const affiliation = params.affiliation
    ? Array.isArray(params.affiliation) ? params.affiliation : [params.affiliation]
    : undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const { actors, total } = await getActors({ type, affiliation, page });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const filterParams = new URLSearchParams();
  if (type) for (const value of type) filterParams.append('type', value);
  if (affiliation) for (const value of affiliation) filterParams.append('affiliation', value);
  const filterQs = filterParams.toString();
  const canonicalPath = hasActiveFilters([type, affiliation])
    ? '/browse/actors'
    : getCanonicalListPath('/browse/actors', page);

  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: 'Browse', path: '/browse' },
      { name: 'Actors', path: '/browse/actors' },
    ]),
    buildCollectionPageJsonLd({
      name: 'Iran Conflict Actors',
      description: 'State and non-state actors in the Iran conflict with affiliations, activity scores, and intelligence assessments.',
      path: canonicalPath,
    }),
    buildItemListJsonLd({
      name: 'Iran Conflict Actors',
      path: canonicalPath,
      items: actors.map((actor) => ({
        name: actor.name,
        url: `/browse/actors/${actor.id}`,
        description: actor.assessment,
      })),
    }),
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <StructuredData data={jsonLd} />
      <BrowsePageHeader crumbs={[{ label: 'Actors' }]} hasAutoRefresh />
      <header className="mt-6 mb-8">
        <p className="label mb-2">Intelligence profiles</p>
        <h1 className="text-lg font-bold text-[var(--t1)] mb-1">Actors</h1>
        <p className="text-xs text-[var(--t3)]">
          {total > PAGE_SIZE ? `Showing ${from}–${to} of ${total} actors` : `${total} actors`} tracked in the Iran conflict
        </p>
      </header>
      <ActorGrid actors={actors} />
      {totalPages > 1 && (
        <div className="mt-10">
          <BrowsePagination page={page} totalPages={totalPages} basePath="/browse/actors" searchParams={filterQs} />
        </div>
      )}
    </div>
  );
}
