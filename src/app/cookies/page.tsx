import type { Metadata } from 'next';

import { buildBrowseMetadata } from '@/features/browse/lib/seo';
import { LegalPage } from '@/features/legal/components/LegalPage';
import { OpenCookiePreferencesButton } from '@/shared/components/privacy/OpenCookiePreferencesButton';

export const metadata: Metadata = buildBrowseMetadata({
  title: 'Cookie Policy',
  description: 'What storage Conflicts.app uses, which categories are necessary, and how to manage consent.',
  path: '/cookies',
});

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      description="What storage Conflicts.app uses, which categories are necessary, and how to manage consent."
    >
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-[var(--t1)]">Storage categories</h2>
        <p>
          We separate storage into necessary functionality, optional preferences, and optional analytics. Necessary storage stays enabled because the product depends on it.
          Preference storage and analytics may be controlled separately where consent controls are available.
        </p>
        <div>
          <OpenCookiePreferencesButton
            label="Manage cookie settings"
            className="border-[var(--bd)] bg-[var(--bg-2)] text-[var(--t1)] hover:bg-[var(--bg-3)]"
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-[var(--t1)]">Necessary</h2>
        <p>
          Necessary storage is limited to core request handling, security, and basic application delivery.
          It does not include remembered preferences, analytics, or optional chat continuity.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-[var(--t1)]">Preferences</h2>
        <p>
          Preference storage covers remembered chat continuity, dashboard layout persistence, map preferences, and similar convenience features.
          If optional storage is turned off, those features can still work in-session but may no longer be remembered on device.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-[var(--t1)]">Analytics</h2>
        <p>
          When accepted, PostHog and Vercel Analytics help us understand product usage patterns such as page views, navigation flow,
          and feature engagement. We use this information to improve performance, prioritize product work, and verify adoption of new features.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-[var(--t1)]">Changing your decision</h2>
        <p>
          When cookie controls are enabled in the product, you can reopen settings from the dashboard menu, public footer, or the button on this page.
          If optional storage is turned off later, future analytics capture is disabled and remembered preference storage is cleared where supported.
        </p>
      </section>
    </LegalPage>
  );
}
