import type { Metadata } from 'next';

import { buildBrowseMetadata } from '@/features/browse/lib/seo';
import { LegalPage } from '@/features/legal/components/LegalPage';

export const metadata: Metadata = buildBrowseMetadata({
  title: 'Terms of Use',
  description: 'Baseline terms for using Conflicts.app, its public intelligence views, and the open-source product.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      description="Baseline terms for using Conflicts.app, its public intelligence views, and the open-source product."
    >
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-[var(--t1)]">Use of the service</h2>
        <p>
          Conflicts.app provides geopolitical intelligence, summaries, event timelines, and related research tooling.
          You may use the service for lawful research, monitoring, and product evaluation purposes.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-[var(--t1)]">No operational guarantee</h2>
        <p>
          The product is informational and may contain delays, gaps, or evolving assessments. It should not be treated as guaranteed,
          real-time operational advice, investment advice, or life-safety guidance.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-[var(--t1)]">Open-source and content</h2>
        <p>
          Conflicts.app includes open-source code and references external reporting, datasets, and public information sources.
          Rights to third-party content remain with their respective owners.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-[var(--t1)]">Changes</h2>
        <p>
          We may update the product, these terms, or related legal pages as the platform evolves. Continued use after updates means you accept the revised terms.
        </p>
      </section>
    </LegalPage>
  );
}
