import { BrowseShell } from '@/features/browse/components/layout/BrowseShell';
import { ViewportHeightSync } from '@/shared/components/layout/ViewportHeightSync';

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ViewportHeightSync />
      <div
        data-theme="auto"
        className="flex flex-col min-h-0 overflow-hidden bg-[var(--bg-app)]"
        style={{ height: 'var(--app-shell-height)' }}
      >
        <BrowseShell>{children}</BrowseShell>
      </div>
    </>
  );
}
