import type { GrokAsset, GrokResult, IntelEvent, ParsedArgs } from './types';

export async function fetchEvent({ baseUrl, conflictId, eventId }: ParsedArgs) {
  const url = `${baseUrl}/api/v1/conflicts/${conflictId}/events/${eventId}`;
  const response = await fetchJson<{ data: IntelEvent }>(url);
  return response.data;
}

export function buildPrompt(event: IntelEvent) {
  return [
    'You are helping collect image assets for a conflict-tracking product. The primary goal is to return useful image assets for the target event.',
    '',
    'Target event:',
    `- id: ${event.id}`,
    `- date: ${event.timestamp}`,
    `- title: ${event.title}`,
    `- location: ${event.location}`,
    `- summary: ${event.summary}`,
    `- description: ${event.fullContent}`,
    '',
    'Priority order:',
    '1. Find image assets from a strong article/photo page directly tied to the exact event.',
    '2. If that fails, find likely image assets from the same event coverage on the open internet.',
    '3. Last resort: search freely across the internet for likely matching images of this exact strike aftermath.',
    '',
    'Important:',
    '- The goal is IMAGE ASSETS. Do not fail just because article matching is imperfect.',
    '- We care more about getting plausible, useful event images than about returning the best article.',
    '- A selected_article is helpful but optional.',
    '- It is acceptable to use a likely match if it strongly appears to show this exact strike or its immediate aftermath.',
    '- Still avoid obvious unrelated images, old file photos, stock photos, maps, logos, or images from different strikes/dates.',
    '',
    'Hard requirements for every asset:',
    '- image_url must be an exact direct image URL copied from a real page source, CDN, gallery, social card, or image file URL.',
    '- Do not guess or synthesize image URLs.',
    '- The URL must load directly in a browser.',
    '- Include a short evidence note explaining why the image is likely tied to this event.',
    '- confidence should reflect how certain you are: high, medium, or low.',
    '',
    'Use one source page if possible. But if no single-source page works, you may return the best individual assets you can find from the open web.',
    '',
    'Return JSON only with this exact shape:',
    '{"event":{"id":"...","date":"...","title":"..."},"selected_article":{"publisher":"...","url":"...","headline":"...","reason":"..."}|null,"assets":[{"image_url":"https://...","caption":"...","credit":"...","source_page":"...","why_relevant":"...","evidence":"...","confidence":"high | medium | low"}]}',
    '',
    'Return JSON only. No markdown fences.',
  ].join('\n');
}

export async function callXai(prompt: string) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error('Missing XAI_API_KEY');

  const payload = {
    input: [{ content: prompt, role: 'user' }],
    model: process.env.XAI_MODEL ?? 'grok-4.20-reasoning',
    tools: [{ enable_image_understanding: true, type: 'web_search' }],
  };

  const response = await fetch('https://api.x.ai/v1/responses', {
    body: JSON.stringify(payload),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(`xAI request failed: ${response.status} ${response.statusText}\n${rawText}`);
  }

  return {
    payload,
    response: JSON.parse(rawText) as Record<string, unknown>,
  };
}

export function extractResult(response: Record<string, unknown>) {
  const output = Array.isArray(response.output) ? response.output : [];

  for (const item of output) {
    if (!item || typeof item !== 'object' || item.type !== 'message') continue;
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (!part || typeof part !== 'object' || part.type !== 'output_text') continue;
      if (typeof part.text !== 'string') continue;
      const match = part.text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Could not extract JSON block from xAI response');
      return JSON.parse(match[0]) as GrokResult;
    }
  }

  throw new Error('xAI response did not include output text');
}

export async function validateAssets(assets: GrokAsset[]) {
  return Promise.all(
    assets.map(async asset => {
      const url = asset.image_url;
      if (!url) return { ...asset, url_check: 'missing image_url' };

      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          method: 'HEAD',
        });
        const contentType = response.headers.get('content-type') ?? '';
        return { ...asset, url_check: `${response.status} ${contentType}`.trim() };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { ...asset, url_check: `ERROR ${message}` };
      }
    }),
  );
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}
