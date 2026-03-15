'use client';

import { MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';

type Props = {
  isOpen: boolean;
  hasMessages: boolean;
  onToggle: () => void;
};

export function ChatTrigger({ isOpen, hasMessages, onToggle }: Props) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggle}
      aria-label={isOpen ? 'Close chat' : 'Open Intel Assistant'}
      className="chat-trigger fixed z-50 h-11 w-11 rounded-full border-[var(--bd)] bg-[var(--bg-2)] shadow-lg transition-all hover:bg-[var(--bg-3)]"
    >
      <MessageSquare size={18} className={hasMessages ? 'text-[var(--blue-l)]' : 'text-[var(--t2)]'} />
    </Button>
  );
}
