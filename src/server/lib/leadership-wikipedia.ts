type ActorInput = {
  name: string;
  countryCode?: string | null;
};

type WikiPage = {
  title: string;
  fullurl?: string;
  canonicalurl?: string;
  original?: { source?: string };
  thumbnail?: { source?: string };
  pageprops?: Record<string, unknown>;
  missing?: boolean;
  index?: number;
};

type WikiQueryResponse = {
  query?: {
    pages?: WikiPage[];
  };
};

export type LeadershipWikipediaResult = {
  wikipediaQuery: string;
  wikipediaTitle: string | null;
  wikipediaPageUrl: string | null;
  wikipediaImageUrl: string | null;
};

const USER_AGENT = 'PharosAI/1.0 (leadership resolver)';

function getActorHint(actor: ActorInput): string {
  const code = actor.countryCode?.toUpperCase();
  if (code === 'US') return 'United States';
  if (code === 'IR') return 'Iran';
  if (code === 'IL') return 'Israel';
  return actor.name.trim();
}

function normalizeName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeInitials(value: string): string {
  const tokens = normalizeName(value).split(' ').filter(Boolean);
  const collapsed: string[] = [];

  for (const token of tokens) {
    if (token.length === 1 && collapsed.length > 0 && collapsed[collapsed.length - 1].length <= 2) {
      collapsed[collapsed.length - 1] += token;
    } else {
      collapsed.push(token);
    }
  }

  return collapsed.join(' ');
}

function withoutMiddleInitials(value: string): string {
  const tokens = normalizeInitials(value).split(' ').filter(Boolean);
  if (tokens.length <= 2) return tokens.join(' ');

  return tokens
    .filter((token, index) => index === 0 || index === tokens.length - 1 || token.length > 1)
    .join(' ');
}

function isDisambiguation(page: WikiPage | null | undefined): boolean {
  return Boolean(page?.pageprops && 'disambiguation' in page.pageprops);
}

function isLikelySamePerson(personName: string, title: string): boolean {
  const person = withoutMiddleInitials(personName);
  const candidate = withoutMiddleInitials(title);

  if (person === candidate) return true;

  const personTokens = person.split(' ').filter(Boolean);
  const titleTokens = normalizeInitials(title).split(' ').filter(Boolean);

  if (personTokens.length < 2) return false;

  const first = personTokens[0];
  const last = personTokens[personTokens.length - 1];

  if (!titleTokens.includes(first) || !titleTokens.includes(last)) return false;
  if (titleTokens.includes('of') || titleTokens.includes('family')) return false;

  return titleTokens.length <= personTokens.length + 2;
}

async function fetchWikipedia(params: Record<string, string>): Promise<WikiQueryResponse> {
  const url = new URL('https://en.wikipedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  url.searchParams.set('redirects', '1');
  url.searchParams.set('origin', '*');

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) return {};
  return (await res.json()) as WikiQueryResponse;
}

async function fetchExactTitle(title: string): Promise<WikiPage | null> {
  const data = await fetchWikipedia({
    titles: title,
    prop: 'info|pageimages|pageprops',
    inprop: 'url',
    piprop: 'original',
    pilicense: 'any',
  });

  const page = data.query?.pages?.[0];
  if (!page || page.missing || isDisambiguation(page)) return null;

  return page;
}

async function searchPages(query: string): Promise<WikiPage[]> {
  const data = await fetchWikipedia({
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '0',
    gsrlimit: '10',
    prop: 'info|pageimages|pageprops',
    inprop: 'url',
    piprop: 'original',
    pilicense: 'any',
  });

  return [...(data.query?.pages ?? [])]
    .filter(page => !page.missing && !isDisambiguation(page))
    .sort((a, b) => (a.index ?? Number.MAX_SAFE_INTEGER) - (b.index ?? Number.MAX_SAFE_INTEGER));
}

function toResult(wikipediaQuery: string, page: WikiPage | null): LeadershipWikipediaResult {
  return {
    wikipediaQuery,
    wikipediaTitle: page?.title ?? null,
    wikipediaPageUrl: page?.fullurl ?? page?.canonicalurl ?? null,
    wikipediaImageUrl: page?.original?.source ?? page?.thumbnail?.source ?? null,
  };
}

export async function resolveLeadershipWikipedia(personName: string, actor: ActorInput): Promise<LeadershipWikipediaResult> {
  const actorHint = getActorHint(actor);
  const wikipediaQuery = actorHint ? `${personName} ${actorHint}` : personName;

  const exact = await fetchExactTitle(personName);
  if (exact && isLikelySamePerson(personName, exact.title)) {
    return toResult(wikipediaQuery, exact);
  }

  const hintedResults = await searchPages(wikipediaQuery);
  const hintedMatch = hintedResults.find(page => isLikelySamePerson(personName, page.title)) ?? null;
  if (hintedMatch) {
    return toResult(wikipediaQuery, hintedMatch);
  }

  const plainResults = await searchPages(personName);
  const plainMatch = plainResults.find(page => isLikelySamePerson(personName, page.title)) ?? null;

  return toResult(wikipediaQuery, plainMatch);
}
