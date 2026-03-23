'use client';
import { Tabs, TabsContent,TabsList, TabsTrigger } from '@/components/ui/tabs';

import { cn } from '@/shared/lib/utils';

export type TabItem<T extends string> = {
  value: T;
  label: string;
};

type IntelTabsProps<T extends string> = {
  value: T;
  onValueChange: (v: T) => void;
  tabs: TabItem<T>[];
  children: React.ReactNode;
  compact?: boolean;
  safeEdges?: boolean;
};

export function IntelTabBar<T extends string>({
  value, onValueChange, tabs, children, compact = false, safeEdges = false,
}: IntelTabsProps<T>) {
  return (
    <Tabs
      value={value}
      onValueChange={v => onValueChange(v as T)}
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
    >
      <TabsList
        variant="line"
        className={cn(
          'w-full rounded-none border-b border-[var(--bd)] bg-[var(--bg-2)] flex gap-0 p-0 justify-start overflow-x-auto touch-scroll hide-scrollbar',
          compact ? 'h-8' : 'h-[38px]',
          safeEdges && 'safe-px',
        )}
      >
        {tabs.map(tab => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'rounded-none h-full font-bold uppercase shrink-0 transition-[color,border-color,background] duration-100',
              compact ? 'px-3 text-[length:var(--text-caption)] tracking-[0.05em]' : 'px-[18px] text-[length:var(--text-label)] tracking-[0.06em]',
            )}
            style={{
              color: value === tab.value ? 'var(--t1)' : 'var(--t2)',
              borderBottom: value === tab.value ? '2px solid var(--blue)' : '2px solid transparent',
              background: value === tab.value ? 'var(--bg-1)' : 'transparent',
            }}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}

export { TabsContent };
