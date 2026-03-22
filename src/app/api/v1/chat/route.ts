import { NextRequest } from 'next/server';

import { err, ok } from '@/server/lib/api-utils';
import { appendChatMessage, clearCurrentChatSession, getOrCreateChatSession, listChatMessages } from '@/server/lib/chat/sessions';
import { resolveAnonymousVisitor } from '@/server/lib/chat/visitor';
import { prisma } from '@/server/lib/db';
import { createChatStream } from '@/server/lib/rag/chat-engine';

import { ChatMessageRole } from '@/generated/prisma/client';

type ChatBody = {
  conflictId?: string;
  input?: string;
};

async function readBody(req: NextRequest): Promise<ChatBody | Response> {
  try {
    return await req.json();
  } catch {
    return err('INVALID_JSON', 'Request body must be valid JSON');
  }
}

function readVisitorOptions(req: NextRequest) {
  return {
    persistVisitor: req.headers.get('x-pharos-persist-visitor') !== '0',
    visitorToken: req.headers.get('x-pharos-visitor-token'),
  };
}

async function resolveSession(req: NextRequest, conflictId: string) {
  const visitor = await resolveAnonymousVisitor(readVisitorOptions(req));
  const session = await getOrCreateChatSession(conflictId, visitor.id);
  return { session, visitor };
}

function validateConflictId(conflictId: string | null) {
  if (!conflictId) return err('INVALID_PARAMS', 'conflictId is required');
  return null;
}

export async function GET(req: NextRequest) {
  const conflictId = req.nextUrl.searchParams.get('conflictId');
  const invalid = validateConflictId(conflictId);
  if (invalid) return invalid;

  const { session } = await resolveSession(req, conflictId as string);
  const messages = await listChatMessages(session.id);
  return ok({ sessionId: session.id, messages });
}

export async function DELETE(req: NextRequest) {
  const conflictId = req.nextUrl.searchParams.get('conflictId');
  const invalid = validateConflictId(conflictId);
  if (invalid) return invalid;

  const visitor = await resolveAnonymousVisitor(readVisitorOptions(req));
  const deletedSessionId = await clearCurrentChatSession(conflictId as string, visitor.id);
  return ok({ deletedSessionId });
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return err('CONFIG_ERROR', 'OPENAI_API_KEY is not configured', 503);
  }

  const body = await readBody(req);
  if (body instanceof Response) return body;

  const conflictId = body.conflictId?.trim();
  const input = body.input?.trim();
  if (!conflictId || !input) {
    return err('INVALID_PARAMS', 'conflictId and input are required');
  }

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId }, select: { id: true } });
  if (!conflict) {
    return err('NOT_FOUND', `Conflict ${conflictId} not found`, 404);
  }

  const { session } = await resolveSession(req, conflictId);
  await appendChatMessage(session.id, ChatMessageRole.USER, input);
  const messages = await listChatMessages(session.id);

  const result = await createChatStream({
    conflictId,
    messages: messages.map(message => ({ role: message.role, content: message.content })),
    async onFinish(text) {
      const trimmed = text.trim();
      if (!trimmed) return;
      await appendChatMessage(session.id, ChatMessageRole.ASSISTANT, trimmed);
    },
  });

  return result.toTextStreamResponse({ headers: { 'x-chat-session-id': session.id } });
}
