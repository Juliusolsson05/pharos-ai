import Link from 'next/link';

import { BrowseFooter } from '@/features/browse/components/layout/BrowseFooter';
import { BrowseNav } from '@/features/browse/components/layout/BrowseNav';

type Props = {
  children: React.ReactNode;
  description: string;
  title: string;
};

export function LegalPage({ children, description, title }: Props) {
  return (
    <div data-theme="auto" className="flex min-h-screen flex-col bg-[var(--bg-app)]">
      <BrowseNav />
      <main className="flex-1 px-5 py-10 sm:px-8 sm:py-12">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--bd)] bg-[var(--bg-1)] p-6 sm:p-8">
            <span className="section-title text-[var(--blue-l)]">Legal</span>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[var(--t1)] sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[var(--t2)] sm:text-base">
              {description}
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-[var(--t4)]">
              <Link href="/privacy" className="no-underline hover:text-[var(--t1)]">Privacy</Link>
              <Link href="/cookies" className="no-underline hover:text-[var(--t1)]">Cookies</Link>
              <Link href="/terms" className="no-underline hover:text-[var(--t1)]">Terms</Link>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--bd)] bg-[var(--bg-1)] p-6 sm:p-8">
            <div className="flex flex-col gap-8 text-sm leading-7 text-[var(--t2)] sm:text-base">
              {children}
            </div>
          </div>
        </div>
      </main>
      <BrowseFooter />
    </div>
  );
}
