import { NextRequest, NextResponse } from 'next/server';

import { isValid, parseISO } from 'date-fns';
import { z } from 'zod';

import { err } from './api-utils';

function formatPath(path: Array<string | number>): string {
  if (path.length === 0) {
    return 'body';
  }

  return path.reduce<string>((acc, segment) => {
    if (typeof segment === 'number') {
      return `${acc}[${segment}]`;
    }

    return acc ? `${acc}.${segment}` : String(segment);
  }, '');
}

function formatIssue(issue: z.core.$ZodIssue): string {
  const path = issue.path.filter(
    (segment): segment is string | number => typeof segment === 'string' || typeof segment === 'number',
  );

  if (issue.code === 'unrecognized_keys') {
    const pathLabel = formatPath(path);
    const keys = issue.keys.join(', ');

    if (path.length === 1 && path[0] === 'viewState' && issue.keys.includes('center')) {
      return 'viewState.center is no longer accepted. Use viewState.longitude, viewState.latitude, and viewState.zoom.';
    }

    if (path.length === 0 && issue.keys.includes('economicImpact')) {
      return 'economicImpact is no longer accepted. Use top-level economicChips and economicNarrative instead.';
    }

    if (path[0] === 'casualties' && issue.keys.includes('kia')) {
      return 'casualties rows must use killed, not kia. Admin writes use flat rows like { faction, killed, wounded, civilians, injured }.';
    }

    if (path[0] === 'casualties' && issue.keys.includes('regional')) {
      return 'regional is not a nested casualties object. Flatten regional casualties into separate rows, for example { faction: "gulf states", killed: 20, injured: 0 }.';
    }

    return `${pathLabel} contains unrecognized key(s): ${keys}`;
  }

  if (
    path.length === 1 &&
    path[0] === 'casualties' &&
    issue.code === 'invalid_type' &&
    issue.expected === 'array'
  ) {
    return 'casualties must be an array of faction rows, not the old nested object format.';
  }

  return `${formatPath(path)}: ${issue.message}`;
}

function formatIssues(issues: z.core.$ZodIssue[]): string {
  return issues.map(formatIssue).join('; ');
}

export async function parseBodyWithSchema<TSchema extends z.ZodType>(
  req: NextRequest,
  schema: TSchema,
): Promise<z.infer<TSchema> | NextResponse> {
  let body: unknown;

  try {
    body = await req.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON';
    return err('BAD_JSON', `Malformed JSON body: ${message}`);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return err('VALIDATION', formatIssues(parsed.error.issues), 422);
  }

  return parsed.data;
}

/**
 * Cast a value to Prisma's InputJsonValue. Useful when Zod infers
 * Record<string, unknown> but Prisma expects InputJsonValue.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toJsonValue(value: unknown): any {
  return value;
}

export function parseDayParam(day: string): Date | null {
  const parsed = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(day);
  if (!parsed.success) {
    return null;
  }

  const value = parseISO(`${day}T00:00:00Z`);
  if (!isValid(value) || value.toISOString().slice(0, 10) !== day) {
    return null;
  }

  return value;
}
