export function parseTileParams(params: Record<string, string | undefined>) {
  const date = params.date || '';
  const z = parseInt(params.z || '', 10);
  const x = parseInt(params.x || '', 10);
  const y = parseInt((params['y.webp'] ?? params.y?.replace('.webp', '') ?? ''), 10);

  if (isNaN(z) || isNaN(x) || isNaN(y) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  return { date, z, x, y };
}

export function parseDateParam(params: Record<string, string | undefined>) {
  const date = params.date || '';
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}
