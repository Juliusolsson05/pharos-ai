import { ok } from '@/server/lib/api-utils';
import { clearAnonymousVisitorCookie } from '@/server/lib/chat/visitor';

export async function DELETE() {
  await clearAnonymousVisitorCookie();
  return ok({ cleared: true });
}
