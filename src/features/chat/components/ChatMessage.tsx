'use client';

import { useEffect, useRef } from 'react';

import type { ChatMessage as Message } from '@/types/domain';

import { ChatMarkdown } from './ChatMarkdown';

type Props = {
  message: Message;
};

export function ChatMessage({ message }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isUser = message.role === 'user';

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [message.content]);

  return (
    <div ref={ref} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[85%] rounded px-3 py-2 text-[length:var(--text-body)] leading-relaxed ${
          isUser
            ? 'bg-[var(--blue-dim)] text-[var(--t1)]'
            : 'bg-[var(--bg-2)] text-[var(--t2)]'
        }`}
      >
        {!isUser && (
          <span className="label mb-1 block text-[var(--blue-l)]">PHAROS INTEL</span>
        )}
        {!message.content && (
          <span className="inline-flex items-center gap-1 text-[var(--t4)]">
            <span className="chat-dot-pulse" />
            Analyzing...
          </span>
        )}
        {!isUser && message.content && <ChatMarkdown content={message.content} />}
        {isUser && message.content && <span className="whitespace-pre-wrap">{message.content}</span>}
      </div>
    </div>
  );
}
