import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Sources',
};

export default function DataLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 w-full min-h-0 overflow-hidden">
      {children}
    </div>
  );
}
