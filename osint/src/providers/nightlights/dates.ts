export function resolveNightlightsDate(input?: string) {
  if (input && input !== 'today') {
    return input;
  }

  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
