import { NextResponse } from 'next/server';

const GAMMA = 'https://gamma-api.polymarket.com';

// Search queries — pull broadly then filter
const QUERIES = [
  'iran', 'israel iran', 'hormuz', 'khamenei', 'nuclear iran',
  'iran strike', 'israel strike iran', 'war powers iran', 'iran ceasefire',
  'iran oil', 'irgc', 'iran us war', 'persian gulf',
];

// Pharos AI market classification — keyword-based
const CATEGORY_RULES: Record<string, string[]> = {
  NUCLEAR:     ['nuclear', 'uranium', 'enrichment', 'iaea', 'warhead', 'centrifuge', 'fordow', 'natanz', 'bomb', 'nonproliferation'],
  MILITARY:    ['strike', 'attack', 'airstrike', 'bomb', 'troops', 'invasion', 'missile', 'operation', 'military', 'irgc', 'b-2', 'combat', 'kill', 'assassin'],
  CEASEFIRE:   ['ceasefire', 'truce', 'peace', 'deal', 'agreement', 'negotiate', 'diplomacy', 'talks', 'end war', 'conflict end'],
  NAVAL:       ['hormuz', 'strait', 'naval', 'fleet', 'carrier', 'blockade', 'ship', 'tanker', 'port'],
  POLITICAL:   ['leader', 'regime', 'president', 'government', 'power', 'election', 'khamenei', 'netanyahu', 'trump', 'supreme leader', 'resign', 'overthrow'],
  ECONOMIC:    ['oil', 'energy', 'price', 'trade', 'economy', 'sanctions', 'brent', 'crude', 'export'],
};

function classify(title: string, description: string): string {
  const text = (title + ' ' + description).toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_RULES)) {
    if (keywords.some(kw => text.includes(kw))) return cat;
  }
  return 'GEOPOLITICAL';
}

interface PolyEvent {
  id: string;
  title: string;
  description: string;
  volume: number;
  liquidity: number;
  active: boolean;
  closed: boolean;
  endDate: string;
  image: string;
  volume24hr: number;
  volume1wk: number;
  markets: Array<{
    id: string;
    slug?: string;
    question: string;
    outcomes: string;
    outcomePrices: string;
    volume: string;
    liquidity: string;
    active: boolean;
    closed: boolean;
    endDate: string;
    conditionId: string;
  }>;
}

export interface PredictionMarket {
  id: string;
  title: string;
  description: string;
  category: string;
  outcomes: string[];
  prices: number[];   // implied probabilities 0-1
  volume: number;
  volume24hr: number;
  volume1wk: number;
  liquidity: number;
  active: boolean;
  closed: boolean;
  endDate: string;
  image: string;
  polyUrl: string;
  conditionId: string;
}

export async function GET() {
  try {
    // Fetch all queries in parallel
    const results = await Promise.allSettled(
      QUERIES.map(q =>
        fetch(`${GAMMA}/public-search?q=${encodeURIComponent(q)}&limit=20`, {
          next: { revalidate: 120 }, // cache 2 min
        }).then(r => r.json())
      )
    );

    // Collect and deduplicate events
    const seen = new Set<string>();
    const events: PolyEvent[] = [];

    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      const data = result.value as { events?: PolyEvent[] };
      for (const event of (data.events ?? [])) {
        if (!seen.has(event.id) && event.markets?.length > 0) {
          seen.add(event.id);
          events.push(event);
        }
      }
    }

    // Sort by volume descending
    events.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));

    // Transform to clean PredictionMarket objects
    const markets: PredictionMarket[] = events.slice(0, 60).map(event => {
      const market = event.markets[0];
      let outcomes: string[] = [];
      let prices: number[] = [];
      try { outcomes = JSON.parse(market.outcomes ?? '[]'); } catch { /* ignore */ }
      try { prices = (JSON.parse(market.outcomePrices ?? '[]') as string[]).map(Number); } catch { /* ignore */ }

      return {
        id: event.id,
        title: event.title,
        description: event.description?.slice(0, 300) ?? '',
        category: classify(event.title, event.description ?? ''),
        outcomes,
        prices,
        volume: event.volume ?? 0,
        volume24hr: event.volume24hr ?? 0,
        volume1wk: event.volume1wk ?? 0,
        liquidity: event.liquidity ?? 0,
        active: event.active ?? false,
        closed: event.closed ?? false,
        endDate: event.endDate ?? '',
        image: event.image ?? '',
        polyUrl: `https://polymarket.com/event/${event.markets[0]?.slug ?? event.id}`,
        conditionId: market.conditionId ?? '',
      };
    });

    return NextResponse.json({ markets, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: String(err), markets: [] }, { status: 500 });
  }
}
