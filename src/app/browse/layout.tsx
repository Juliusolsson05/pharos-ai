import { BrowseFooter } from '@/features/browse/components/BrowseFooter';
import { BrowseNav } from '@/features/browse/components/BrowseNav';

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-app)]">
      <BrowseNav />
      <main className="flex-1">{children}</main>
      <BrowseFooter />
    </div>
  );
}
