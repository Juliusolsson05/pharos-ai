export type IntelEvent = {
  fullContent: string;
  id: string;
  location: string;
  summary: string;
  timestamp: string;
  title: string;
};

export type GrokAsset = {
  caption?: string;
  confidence?: string;
  credit?: string;
  evidence?: string;
  image_url?: string;
  source_page?: string;
  url_check?: string;
  why_relevant?: string;
};

export type GrokResult = {
  assets: GrokAsset[];
  event: {
    date: string;
    id: string;
    title: string;
  };
  selected_article: null | {
    headline: string;
    publisher: string;
    reason: string;
    url: string;
  };
};

export type ParsedArgs = {
  baseUrl: string;
  conflictId: string;
  eventId: string;
  outDir: string;
};
