'use client';

import { useCallback } from 'react';

import { Send, Square } from 'lucide-react';

import { Button } from '@/components/ui/button';

type Props = {
  value: string;
  isLoading: boolean;
  onChange: (val: string) => void;
  onSubmit: () => void;
  onStop: () => void;
};

export function ChatInput({ value, isLoading, onChange, onSubmit, onStop }: Props) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isLoading && value.trim()) onSubmit();
      }
    },
    [isLoading, onSubmit, value],
  );

  return (
    <div className="flex items-end gap-2 border-t border-[var(--bd)] bg-[var(--bg-app)] p-2">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about events, actors, signals..."
        rows={1}
        disabled={isLoading}
        className="flex-1 resize-none bg-transparent text-[16px] text-[var(--t1)] placeholder:text-[var(--t4)] outline-none disabled:opacity-50 md:text-[13px]"
        style={{ maxHeight: 120, minHeight: 32 }}
      />
      {isLoading ? (
        <Button variant="outline" size="icon-sm" onClick={onStop} aria-label="Stop generating">
          <Square size={12} />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="icon-sm"
          onClick={onSubmit}
          disabled={!value.trim()}
          aria-label="Send message"
        >
          <Send size={12} />
        </Button>
      )}
    </div>
  );
}
