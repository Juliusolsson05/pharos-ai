import { LegalPage } from '@/features/legal/components/LegalPage';

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
          The app uses strictly necessary storage for things like anonymous chat session continuity, workspace layout persistence,
          map preferences, and similar product settings. These are used to keep the application functional and are not disabled by the analytics toggle.
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
          and filters. A necessary cookie is used for anonymous chat continuity. Optional analytics cookies or storage are only enabled after consent.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-[var(--t1)]">Your choices</h2>
        <p>
          You can reject analytics on first visit, accept them, or reopen cookie settings later from the app navigation or footer.
          You can also review our dedicated Cookie Policy for a more explicit breakdown of storage categories.
        </p>
      </section>
    </LegalPage>
  );
}
