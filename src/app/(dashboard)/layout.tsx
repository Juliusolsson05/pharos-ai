import { ChatWidget } from '@/features/chat/components/ChatWidget';
import { NotificationRuntime } from '@/features/notifications/components/NotificationRuntime';
import { FloatingChannelWindow } from '@/features/perspectives/components/FloatingChannelWindow';
import { FloatingChannelWindowProvider } from '@/features/perspectives/components/FloatingChannelWindowProvider';
import { SettingsRuntime } from '@/features/settings/components/SettingsRuntime';
import { Header } from '@/shared/components/layout/Header';
import { ViewportHeightSync } from '@/shared/components/layout/ViewportHeightSync';

export default function DashboardShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <FloatingChannelWindowProvider>
      <ViewportHeightSync />
      <div className="dashboard-shell bg-[var(--bg-app)]">
        <SettingsRuntime />
        <Header />
        <NotificationRuntime />
        <div className="flex flex-1 min-h-0 pb-[var(--safe-bottom)] md:overflow-hidden">
          {children}
        </div>
      </div>
      <ChatWidget />
      <FloatingChannelWindow />
    </FloatingChannelWindowProvider>
  );
}
