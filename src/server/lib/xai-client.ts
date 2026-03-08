/** Wrapper around X AI (Grok) Responses API. Requires XAI_API_KEY env. */

const XAI_BASE = 'https://api.x.ai/v1';
const MODEL = process.env.XAI_MODEL ?? 'grok-4-1-fast-reasoning';

// Types

export type XAIAnnotation = {
  type: string;
  url: string;
  start_index?: number;
  end_index?: number;
  title?: string;
};

export type XAIContentBlock = {
  type: string;
  text?: string;
  annotations?: XAIAnnotation[];
};

export type XAIOutputItem = {
  type: string;
  content?: XAIContentBlock[];
};

export type XAIResponse = {
  id: string;
  output: XAIOutputItem[];
  citations?: string[];
};

// Helpers

function getApiKey(): string {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error('XAI_API_KEY environment variable is not set');
  return key;
}

function extractTextAndCitations(response: XAIResponse): {
  text: string;
  citations: string[];
} {
  let text = '';
  const citations: string[] = response.citations ?? [];

  for (const item of response.output) {
    if (item.type === 'message' && item.content) {
      for (const block of item.content) {
        if (block.type === 'output_text' && block.text) {
          text += block.text;
          // Also extract inline citation URLs from annotations
          if (block.annotations) {
            for (const ann of block.annotations) {
              if (ann.url && !citations.includes(ann.url)) {
                citations.push(ann.url);
              }
            }
          }
        }
      }
    }
  }

  return { text, citations };
}

// Core API call

async function grokResponses(
  prompt: string,
  tools: Record<string, unknown>[],
  systemPrompt?: string,
): Promise<{ text: string; citations: string[] }> {
  const apiKey = getApiKey();

  const input: { role: string; content: string }[] = [];
  if (systemPrompt) {
    input.push({ role: 'system', content: systemPrompt });
  }
  input.push({ role: 'user', content: prompt });

  const res = await fetch(`${XAI_BASE}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input,
      tools,
      include: ['no_inline_citations'],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`X AI API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as XAIResponse;
  return extractTextAndCitations(data);
}

// Public API

export type TweetVerificationResult = {
  exists: boolean;
  contentMatch: 'exact' | 'partial' | 'mismatch' | 'not_found';
  actualContent?: string;
  actualHandle?: string;
  discrepancies?: string[];
  citations: string[];
  grokResponse: string;
};

/** Uses x_search with handle filter to find and verify the tweet. */
export async function verifyTweet(
  tweetId: string,
  expectedHandle: string,
  expectedContent: string,
): Promise<TweetVerificationResult> {
  const bareHandle = expectedHandle.replace(/^@/, '');

  const prompt = `I need you to verify if a specific tweet exists on X/Twitter.

Tweet ID: ${tweetId}
Expected handle: @${bareHandle}
Expected content (summary): "${expectedContent.slice(0, 300)}"

Please search for this tweet. I need you to:
1. Determine if this tweet actually exists
2. If it exists, tell me the ACTUAL content of the tweet
3. Compare the actual content to the expected content above
4. List any discrepancies

Respond in this exact JSON format (no markdown, just raw JSON):
{
  "exists": true/false,
  "actualContent": "the actual tweet text if found, or null",
  "actualHandle": "the actual handle if found, or null",
  "contentMatch": "exact" or "partial" or "mismatch" or "not_found",
  "discrepancies": ["list of differences if any"]
}`;

  const { text, citations } = await grokResponses(
    prompt,
    [
      {
        type: 'x_search',
        allowed_x_handles: [bareHandle],
      },
    ],
    'You are a tweet verification assistant. You must respond ONLY with valid JSON. No markdown, no explanations, just the JSON object.',
  );

  // Parse Grok's response
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        exists: parsed.exists ?? false,
        contentMatch: parsed.contentMatch ?? 'not_found',
        actualContent: parsed.actualContent ?? undefined,
        actualHandle: parsed.actualHandle ?? undefined,
        discrepancies: parsed.discrepancies ?? undefined,
        citations,
        grokResponse: text,
      };
    }
  } catch { /* JSON parse failed */ }

  return {
    exists: false,
    contentMatch: 'not_found',
    citations,
    grokResponse: text,
  };
}

export type CorroborationResult = {
  found: boolean;
  confidence: 'high' | 'medium' | 'low' | 'none';
  evidence?: string;
  citations: string[];
  grokResponse: string;
};

/** Uses x_search/web_search based on post type to find corroboration. */
export async function corroboratePost(
  content: string,
  handle: string,
  postType: string,
): Promise<CorroborationResult> {
  const bareHandle = handle.replace(/^@/, '');
  const useWebSearch = postType === 'NEWS_ARTICLE' || postType === 'PRESS_RELEASE';
  const useXSearch = postType === 'OFFICIAL_STATEMENT' || postType === 'XPOST';

  const tools: Record<string, unknown>[] = [];
  if (useXSearch || (!useWebSearch && !useXSearch)) {
    tools.push({ type: 'x_search' });
  }
  if (useWebSearch || (!useWebSearch && !useXSearch)) {
    tools.push({ type: 'web_search' });
  }
  // Always include at least x_search
  if (tools.length === 0) tools.push({ type: 'x_search' });

  const prompt = `I need to verify if the following statement/article is real and has been published.

Source: @${bareHandle}
Post type: ${postType}
Content: "${content.slice(0, 500)}"

Search for evidence that this statement, article, or press release was actually published. Look for:
- The original post/article if it exists
- Other sources reporting on the same content
- Official statements corroborating the claims

Respond in this exact JSON format (no markdown, just raw JSON):
{
  "found": true/false,
  "confidence": "high" or "medium" or "low" or "none",
  "evidence": "brief description of what you found"
}`;

  const { text, citations } = await grokResponses(
    prompt,
    tools,
    'You are a fact-checking assistant. You must respond ONLY with valid JSON. No markdown, no explanations, just the JSON object.',
  );

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        found: parsed.found ?? false,
        confidence: parsed.confidence ?? 'none',
        evidence: parsed.evidence ?? undefined,
        citations,
        grokResponse: text,
      };
    }
  } catch { /* JSON parse failed */ }

  return {
    found: false,
    confidence: 'none',
    citations,
    grokResponse: text,
  };
}

export type DiscoveredPost = {
  tweetUrl: string;
  tweetId: string;
  handle: string;
  displayName: string;
  content: string;
  timestamp?: string;
  relevance: string;
};

export type SearchResult = {
  posts: DiscoveredPost[];
  citations: string[];
  grokResponse: string;
};

/** Returns discovered posts with citations for verified signal creation. */
export async function searchXPosts(
  query: string,
  options: {
    handles?: string[];
    fromDate?: string;
    toDate?: string;
    maxResults?: number;
  } = {},
): Promise<SearchResult> {
  const maxResults = options.maxResults ?? 10;

  const xSearchTool: Record<string, unknown> = { type: 'x_search' };
  if (options.handles && options.handles.length > 0) {
    xSearchTool.allowed_x_handles = options.handles.map(h => h.replace(/^@/, ''));
  }
  if (options.fromDate) xSearchTool.from_date = options.fromDate;
  if (options.toDate) xSearchTool.to_date = options.toDate;

  const prompt = `Search X/Twitter for real posts about: "${query}"

I need up to ${maxResults} real, verified posts from X. For each post found, provide:
- The full URL of the tweet
- The tweet ID (numeric)
- The handle (with @)
- The display name
- The full text content of the post
- The timestamp if available
- A brief note on why this post is relevant

Respond in this exact JSON format (no markdown, just raw JSON):
{
  "posts": [
    {
      "tweetUrl": "https://x.com/handle/status/12345",
      "tweetId": "12345",
      "handle": "@handle",
      "displayName": "Display Name",
      "content": "Full post text",
      "timestamp": "2026-03-03T14:00:00Z",
      "relevance": "Brief relevance note"
    }
  ]
}`;

  const { text, citations } = await grokResponses(
    prompt,
    [xSearchTool, { type: 'web_search' }],
    'You are a social media research assistant. You must respond ONLY with valid JSON. No markdown, no explanations, just the JSON object. Only include posts that actually exist on X — never fabricate tweets.',
  );

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const posts = Array.isArray(parsed.posts) ? parsed.posts : [];
      return {
        posts: posts.map((p: Record<string, unknown>) => ({
          tweetUrl: (p.tweetUrl as string) ?? '',
          tweetId: (p.tweetId as string) ?? '',
          handle: (p.handle as string) ?? '',
          displayName: (p.displayName as string) ?? '',
          content: (p.content as string) ?? '',
          timestamp: (p.timestamp as string) ?? undefined,
          relevance: (p.relevance as string) ?? '',
        })),
        citations,
        grokResponse: text,
      };
    }
  } catch { /* JSON parse failed */ }

  return { posts: [], citations, grokResponse: text };
}

export function isXAIConfigured(): boolean {
  return !!process.env.XAI_API_KEY;
}
