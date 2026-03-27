import type { Metadata } from 'next';

import { buildBrowseMetadata } from '@/features/browse/lib/seo';
import { LegalPage } from '@/features/legal/components/LegalPage';

export const metadata: Metadata = buildBrowseMetadata({
  title: 'Privacy Policy',
  description: 'How Conflicts.app handles analytics, chat continuity, and local device storage.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="How Conflicts.app handles analytics, chat continuity, and local device storage."
    >
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-[var(--t1)]">Overview</h2>
        <p>
          Conflicts.app uses a small amount of device storage to keep core product behavior working and, if you allow it,
          to understand product usage through analytics. We aim to keep this collection limited and tied to improving the product.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-[var(--t1)]">Necessary storage</h2>
        <p>
          Conflicts.app uses a small amount of strictly necessary storage for core request handling, security, and basic app delivery.
          This category does not include optional remembered preferences or analytics.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-[var(--t1)]">Preference storage</h2>
        <p>
          Preference storage covers optional remembered behavior like anonymous chat continuity, workspace layout persistence,
          map UI preferences, and dismissible interface state. These improve convenience, but they are separate from strictly necessary storage.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-[var(--t1)]">Analytics</h2>
        <p>
          If you accept analytics cookies, we enable PostHog and Vercel Analytics to measure page views and feature usage.
          This helps us understand what users open, which views are most useful, and where product friction exists after releases.
        </p>
        <p>
          We use analytics to improve navigation, prioritize fixes, and understand which features are being actively used.
          If you reject analytics, those tools remain disabled in your browser.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-[var(--t1)]">Local storage and cookies</h2>
        <p>
          Conflicts.app uses both browser local storage and cookies. Local storage is used for interface state such as layouts
          and filters. A chat visitor cookie may be used when remembered chat continuity is enabled. Analytics storage is separate from preference storage.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-[var(--t1)]">Your choices</h2>
        <p>
          Where consent controls are enabled, you can accept or reject optional storage and revisit those choices later.
          In environments where those controls are not currently shown, the app may operate with analytics and preference storage enabled by default.
          You can also review our dedicated Cookie Policy for a more explicit breakdown of storage categories.
        </p>
      </section>
    </LegalPage>
  );
}
