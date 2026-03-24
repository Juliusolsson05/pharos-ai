'use client';

import { useEffect, useState } from 'react';

import { usePathname } from 'next/navigation';

import { Eraser, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useChat } from '../hooks/use-chat';
import { useChatPanelSize } from '../hooks/use-chat-panel-size';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { ChatResizeHandle } from './ChatResizeHandle';
import { ChatTrigger } from './ChatTrigger';

const CONFLICT_ID = process.env.NEXT_PUBLIC_CONFLICT_ID ?? 'iran-2026';
const MOBILE_CHAT_ROUTES = [
  '/dashboard',
  '/dashboard/actors',
  '/dashboard/feed',
  '/dashboard/signals',
  '/dashboard/brief',
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { isMobile, size, startResize } = useChatPanelSize();
  const { messages, input, setInput, isLoading, isReady, error, handleSubmit, stop, clear } = useChat({
    conflictId: CONFLICT_ID,
  });
  const isMapRoute = pathname.startsWith('/dashboard/map');
  const shouldShowOnCurrentRoute = !isMapRoute && (!isMobile || MOBILE_CHAT_ROUTES.includes(pathname));

  // Lock body scroll on mobile when chat is open
  useEffect(() => {
    if (!isMobile || !isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isOpen]);

  const panelClassName = isMobile
    ? 'chat-panel chat-panel-mobile fixed inset-0 z-50 flex flex-col overflow-hidden bg-[var(--bg-1)]'
    : 'chat-panel fixed bottom-20 right-5 z-50 flex flex-col overflow-hidden rounded border border-[var(--bd)] bg-[var(--bg-1)] shadow-2xl';

  return (
    <>
      {shouldShowOnCurrentRoute && (
        <ChatTrigger
          isOpen={isOpen}
          hasMessages={messages.length > 0}
          onToggle={() => setIsOpen(prev => !prev)}
        />
      )}

      {shouldShowOnCurrentRoute && isOpen && (
        <>
          {/* Backdrop — mobile only */}
          {isMobile && (
            <div
              className="fixed inset-0 z-40 bg-black/60"
              onClick={() => setIsOpen(false)}
            />
          )}

          <div className={panelClassName} style={isMobile ? undefined : { width: size.width, height: size.height }}>
            {/* Header */}
            <div className="panel-header justify-between safe-px">
              <span className="section-title flex items-center gap-2">
                <span className="dot dot-live" />
                INTEL ASSISTANT
              </span>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <Button variant="ghost" size="icon-sm" onClick={clear} aria-label="Clear chat">
                    <Eraser size={12} />
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm" onClick={() => setIsOpen(false)} aria-label="Close chat">
                  <X size={14} />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="min-h-0 flex-1">
              <div className="p-3 safe-px">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <p className="mb-1 text-[length:var(--text-body)] text-[var(--t3)]">Pharos Intel Assistant</p>
                    <p className="max-w-[260px] text-[length:var(--text-body-sm)] text-[var(--t4)]">
                      {isReady
                        ? 'Ask about events, actors, signals, or any intelligence in the conflict database.'
                        : 'Loading prior session...'}
                    </p>
                  </div>
                )}
                {messages.map(msg => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                {error && <p className="px-1 pt-2 text-[length:var(--text-body-sm)] text-[var(--danger)]">{error}</p>}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="safe-px safe-pb">
              <ChatInput
                value={input}
                isLoading={isLoading}
                onChange={setInput}
                onSubmit={handleSubmit}
                onStop={stop}
              />
            </div>

            {!isMobile && <ChatResizeHandle hidden={false} onPointerDown={startResize} />}
          </div>
        </>
      )}
    </>
  );
}
