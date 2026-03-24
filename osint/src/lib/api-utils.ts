import type { Response } from 'express';

export function ok<T>(res: Response, data: T) {
  res.json({ ok: true, data });
}

export function err(res: Response, code: string, message: string, status = 400) {
  res.status(status).json({ ok: false, error: { code, message } });
}
