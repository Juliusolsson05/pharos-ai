/**
 * Proxy helper for forwarding requests to the Scala engine service.
 *
 * The engine runs on port 4100 (configurable via PHAROS_ENGINE_URL).
 * All responses are forwarded as-is since the engine uses the same
 * { ok, data } / { ok, error } envelope format.
 */

const ENGINE_BASE = process.env.PHAROS_ENGINE_URL ?? 'http://localhost:4100';
const ENGINE_TIMEOUT_MS = Number(process.env.PHAROS_ENGINE_TIMEOUT_MS ?? '15000');

export async function engineGet(path: string): Promise<Response> {
  const url = `${ENGINE_BASE}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ENGINE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
      next: { revalidate: 0 },
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export async function enginePost(path: string, body?: unknown): Promise<Response> {
  const url = `${ENGINE_BASE}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ENGINE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      next: { revalidate: 0 },
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

/** Forward an engine response to the Next.js client, preserving status. */
export async function forwardEngineResponse(engineRes: Response): Promise<Response> {
  try {
    const data = await engineRes.json();
    return Response.json(data, { status: engineRes.status });
  } catch {
    return Response.json(
      { ok: false, error: { code: 'ENGINE_ERROR', message: 'Failed to parse engine response' } },
      { status: 502 },
    );
  }
}

/** Check if the engine is healthy. */
export async function engineHealthCheck(): Promise<{ healthy: boolean; status?: string }> {
  try {
    const res = await engineGet('/health');
    if (!res.ok) return { healthy: false };
    const data = await res.json();
    return { healthy: data.status === 'ok', status: data.status };
  } catch {
    return { healthy: false };
  }
}
