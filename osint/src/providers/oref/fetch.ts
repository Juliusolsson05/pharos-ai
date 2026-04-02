const ALERTS_URL = 'https://www.oref.org.il/WarningMessages/alert/alerts.json';
const HISTORY_URL = 'https://www.oref.org.il/WarningMessages/alert/History/AlertsHistory.json';
const FETCH_TIMEOUT = 10_000;

export type OrefAlert = {
  id: string;
  cat: string;       // category (missiles, uav, earthquake, etc.)
  title: string;
  data: string[];    // affected areas
  desc: string;
  alertDate: string;
};

/**
 * Fetch current active alerts from OREF.
 * Works locally — in production, needs an Israel-exit proxy.
 */
export async function fetchOrefAlerts(): Promise<OrefAlert[]> {
  try {
    const res = await fetch(ALERTS_URL, {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: 'https://www.oref.org.il/',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });

    if (!res.ok) return [];

    const text = await res.text();
    if (!text.trim()) return []; // empty = no active alerts

    const data = JSON.parse(text);
    if (!Array.isArray(data)) return [];

    return data.map((a: Record<string, unknown>) => ({
      id: String(a.id || ''),
      cat: String(a.cat || ''),
      title: String(a.title || ''),
      data: Array.isArray(a.data) ? a.data.map(String) : [],
      desc: String(a.desc || ''),
      alertDate: String(a.alertDate || ''),
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch recent alert history (last 24h).
 */
export async function fetchOrefHistory(): Promise<OrefAlert[]> {
  try {
    const res = await fetch(HISTORY_URL, {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: 'https://www.oref.org.il/',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as OrefAlert[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
