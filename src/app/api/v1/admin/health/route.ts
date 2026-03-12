import { NextRequest } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { err,ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok({ status: 'healthy', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    return err('DB_ERROR', 'Database connection failed', 503);
  }
}
