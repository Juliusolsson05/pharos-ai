import type { Prisma } from '.prisma/osint-client';

export function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
