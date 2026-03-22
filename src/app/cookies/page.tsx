import { LegalPage } from '@/features/legal/components/LegalPage';
import { OpenCookiePreferencesButton } from '@/shared/components/privacy/OpenCookiePreferencesButton';

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      description="What storage Conflicts.app uses, which categories are necessary, and how to manage consent."
    >
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-[var(--t1)]">Storage categories</h2>
        <p>
          We separate storage into necessary functionality and optional analytics. Necessary storage stays enabled because the product depends on it.
          Analytics stays off until you grant consent.
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
          Necessary storage supports anonymous chat continuity, dashboard layout persistence, map preferences, and related interface behavior.
          These items are used to provide the service and are not switched off by the analytics preference.
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
          You can reopen cookie settings at any time from the dashboard menu, the public footer, or the button on this page.
          If you turn analytics off later, future analytics capture in your browser is disabled.
        </p>
      </section>
    </LegalPage>
  );
}
