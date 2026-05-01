// PostHog server-side tracking helper.
// Frontend tracking icin components/PostHogProvider.tsx kullanilir.

import { PostHog } from "posthog-node";

let _client: PostHog | null = null;

function client(): PostHog | null {
  if (_client) return _client;
  const key = process.env.POSTHOG_API_KEY;
  if (!key) return null;
  _client = new PostHog(key, {
    host: process.env.POSTHOG_HOST || "https://eu.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });
  return _client;
}

export function track(
  userId: string | null,
  event: string,
  properties?: Record<string, unknown>
) {
  const c = client();
  if (!c) return;
  c.capture({
    distinctId: userId || "anon",
    event,
    properties: properties || {},
  });
}

export async function identify(userId: string, traits: Record<string, unknown>) {
  const c = client();
  if (!c) return;
  c.identify({ distinctId: userId, properties: traits });
}
