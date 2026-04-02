import type { Response } from 'express';

function replacer(_key: string, value: unknown) {
  return typeof value === 'bigint' ? value.toString() : value;
}

export function ok<T>(res: Response, data: T) {
  const body = JSON.stringify({ ok: true, data }, replacer);
  res.setHeader('Content-Type', 'application/json');
  res.send(body);
}

export function err(res: Response, code: string, message: string, status = 400) {
  res.status(status).json({ ok: false, error: { code, message } });
}
