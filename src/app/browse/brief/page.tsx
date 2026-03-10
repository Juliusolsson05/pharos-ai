import type { Metadata } from 'next';

import { BriefList } from '@/features/browse/components/BriefList';
import { BrowseBreadcrumb } from '@/features/browse/components/BrowseBreadcrumb';
import { BrowsePagination } from '@/features/browse/components/BrowsePagination';
import { getBriefs, PAGE_SIZE } from '@/features/browse/queries';

export const metadata: Metadata = {
  title: 'Daily Briefs — Iran Conflict Timeline',
  description:
    'Day-by-day intelligence briefs for the Iran conflict. Escalation levels, casualty reports, economic impact, and scenario analysis updated daily.',
  alternates: { canonical: 'https://www.conflicts.app/browse/brief' },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BrowseBriefPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const { briefs, total } = await getBriefs({ page });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <BrowseBreadcrumb crumbs={[{ label: 'Briefs' }]} />

      <header className="mt-6 mb-8">
        <p className="label mb-2">Intelligence briefs</p>
        <h1 className="text-lg font-bold text-[var(--t1)] mb-1">Daily Briefs</h1>
        <p className="text-xs text-[var(--t3)]">
          {total > PAGE_SIZE
            ? `Showing ${from}–${to} of ${total} briefs`
            : `${total} briefs`}
          {' '}covering the Iran conflict
        </p>
      </header>

      <BriefList briefs={briefs} />

      {totalPages > 1 && (
        <div className="mt-10">
          <BrowsePagination page={page} totalPages={totalPages} basePath="/browse/brief" />
        </div>
      )}
    </div>
  );
}
