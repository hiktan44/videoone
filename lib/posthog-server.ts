// PostHog server-side query helper'lari (admin panel icin).

const PH_HOST = process.env.POSTHOG_HOST || "https://eu.posthog.com";
const PH_PROJECT_ID = process.env.POSTHOG_PROJECT_ID || "";
const PH_PERSONAL_KEY = process.env.POSTHOG_PERSONAL_API_KEY || "";

export function isPostHogServerConfigured(): boolean {
  return !!(PH_PROJECT_ID && PH_PERSONAL_KEY);
}

async function phFetch(path: string, init?: RequestInit) {
  if (!isPostHogServerConfigured()) {
    throw new Error("PostHog Personal API Key veya Project ID eksik");
  }
  const res = await fetch(`${PH_HOST}/api/projects/${PH_PROJECT_ID}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${PH_PERSONAL_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`PostHog ${res.status}: ${txt.slice(0, 200)}`);
  }
  return res.json();
}

/** HogQL sorgusu çalıştırır. */
export async function hogQuery(query: string): Promise<any[]> {
  const data = await phFetch("/query/", {
    method: "POST",
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
  });
  return data?.results || [];
}

export type AnalyticsSummary = {
  totalEvents7d: number;
  totalEvents24h: number;
  uniqueUsers7d: number;
  topEvents: Array<{ event: string; count: number }>;
  signups7d: number;
  activeRecentSessions: number;
};

/** Dashboard icin ozet metrikler. */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary | { error: string }> {
  if (!isPostHogServerConfigured()) {
    return { error: "PostHog yapılandırılmamış (POSTHOG_PERSONAL_API_KEY + POSTHOG_PROJECT_ID gerekli)" };
  }
  try {
    // Tek bir HogQL ile birden fazla metrik (paralel)
    const [eventsTotal, eventsToday, uniqueUsers, top, signups, sessions] = await Promise.all([
      hogQuery("select count() from events where timestamp > now() - interval 7 day"),
      hogQuery("select count() from events where timestamp > now() - interval 24 hour"),
      hogQuery("select count(distinct distinct_id) from events where timestamp > now() - interval 7 day"),
      hogQuery(
        "select event, count() as c from events where timestamp > now() - interval 7 day group by event order by c desc limit 8"
      ),
      hogQuery(
        "select count() from events where event = 'user_signed_up' and timestamp > now() - interval 7 day"
      ),
      hogQuery(
        "select count(distinct properties.\\$session_id) from events where timestamp > now() - interval 1 hour and properties.\\$session_id is not null"
      ),
    ]);

    return {
      totalEvents7d: Number(eventsTotal?.[0]?.[0] || 0),
      totalEvents24h: Number(eventsToday?.[0]?.[0] || 0),
      uniqueUsers7d: Number(uniqueUsers?.[0]?.[0] || 0),
      topEvents: (top || []).map((row: any[]) => ({
        event: String(row[0] || "?"),
        count: Number(row[1] || 0),
      })),
      signups7d: Number(signups?.[0]?.[0] || 0),
      activeRecentSessions: Number(sessions?.[0]?.[0] || 0),
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "PostHog sorgu hatası" };
  }
}

/** Son N event'i live activity icin getir. */
export async function getRecentEvents(limit = 20): Promise<Array<any>> {
  try {
    const rows = await hogQuery(
      `select timestamp, event, distinct_id, properties.\\$current_url from events order by timestamp desc limit ${Math.min(
        100,
        Math.max(1, limit)
      )}`
    );
    return (rows || []).map((r: any[]) => ({
      timestamp: r[0],
      event: r[1],
      distinctId: r[2],
      url: r[3],
    }));
  } catch {
    return [];
  }
}
