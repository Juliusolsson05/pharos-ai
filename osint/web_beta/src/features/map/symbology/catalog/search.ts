
import type { SearchResult, SymbolEntry } from '../types';

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .trim()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

function searchableText(entry: SymbolEntry): string[] {
  return [
    entry.label,
    entry.plainLabel,
    entry.description,
    ...(entry.keywords ?? []),
    ...(entry.aliases ?? []),
    ...(entry.tags ?? []),
  ]
    .join(' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

export function searchSymbolCatalog(entries: SymbolEntry[], query: string): SearchResult[] {
  const q = tokenize(query);
  if (q.length === 0) {
    return entries.map((entry) => ({ entry, score: 1, highlights: [] }));
  }

  return entries
    .map((entry) => {
      const haystack = searchableText(entry);
      let score = 0;
      const highlights = new Set<string>();

      for (const token of q) {
        for (const term of haystack) {
          if (term === token) {
            score += 4;
            highlights.add(term);
          } else if (term.startsWith(token)) {
            score += 2;
            highlights.add(term);
          } else if (term.includes(token)) {
            score += 1;
            highlights.add(term);
          }
        }
      }

      if (entry.label.toLowerCase().includes(query.toLowerCase())) {
        score += 3;
      }

      return {
        entry,
        score,
        highlights: [...highlights],
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.label.localeCompare(b.entry.label));
}
