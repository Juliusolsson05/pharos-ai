import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Overview',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {children}
    </div>
  );
}
