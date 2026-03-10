import { Header } from '@/shared/components/layout/Header';
import { ViewportHeightSync } from '@/shared/components/layout/ViewportHeightSync';

export default function DashboardShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ViewportHeightSync />
      <div className="flex flex-col min-h-0 overflow-hidden" style={{ height: 'var(--app-height)' }}>
        <Header />
        <div className="flex flex-1 min-h-0 overflow-hidden pb-[var(--safe-bottom)]">
          {children}
        </div>
      </div>
    </>
  );
}
