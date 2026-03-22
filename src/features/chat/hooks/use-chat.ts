'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { hasPreferencesConsent } from '@/shared/lib/analytics/consent';

import type { ChatMessage, ChatSessionData } from '@/types/domain';

type UseChatOptions = {
  conflictId: string;
};

export function useChat({ conflictId }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const visitorTokenRef = useRef<string>(crypto.randomUUID());

  const buildHeaders = useCallback((headers?: HeadersInit) => {
    const persistVisitor = hasPreferencesConsent();

    return {
      ...(headers ?? {}),
      'x-pharos-persist-visitor': persistVisitor ? '1' : '0',
      'x-pharos-visitor-token': persistVisitor ? '' : visitorTokenRef.current,
    };
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/chat?conflictId=${encodeURIComponent(conflictId)}`, {
        headers: buildHeaders(),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? 'Failed to load chat');

      const data = json.data as ChatSessionData;
      setMessages(data.messages);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to load chat');
    } finally {
      setIsReady(true);
    }
  }, [buildHeaders, conflictId]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const optimisticUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    const optimisticAssistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    setMessages(previous => [...previous, optimisticUserMessage, optimisticAssistantMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: buildHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ conflictId, input: trimmed }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages(previous => previous.map(message => (
          message.id === optimisticAssistantMessage.id ? { ...message, content: accumulated } : message
        )));
      }
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      const message = cause instanceof Error ? cause.message : 'An error occurred';
      setError(message);
      setMessages(previous => previous.map(entry => (
        entry.id === optimisticAssistantMessage.id ? { ...entry, content: `Error: ${message}` } : entry
      )));
    } finally {
      setIsLoading(false);
      abortRef.current = null;
      await loadSession();
    }
  }, [buildHeaders, conflictId, input, isLoading, loadSession]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  const clear = useCallback(async () => {
    const res = await fetch(`/api/v1/chat?conflictId=${encodeURIComponent(conflictId)}`, {
      headers: buildHeaders(),
      method: 'DELETE',
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) {
      setError(json?.error?.message ?? 'Failed to clear chat');
      return;
    }

    setMessages([]);
    setError(null);
  }, [buildHeaders, conflictId]);

  return { clear, error, handleSubmit, input, isLoading, isReady, messages, setInput, stop };
}
