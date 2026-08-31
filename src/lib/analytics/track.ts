'use client';

import type { AnalyticsEvent, AnalyticsEventProperties } from './events';
import { hasAnalyticsConsent } from '@/lib/consent/state';

const SESSION_STORAGE_KEY = 'cz_analytics_sid';

// Per-tab id, sessionStorage only (cleared when the tab closes) — not a
// tracking cookie, just enough to group events into one funnel for
// drop-off analysis. See migrations/020_analytics_events.sql.
function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    let id = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export function track<E extends AnalyticsEvent>(event: E, properties: AnalyticsEventProperties[E]): void {
  if (typeof window === 'undefined') return;
  // Single choke point for the opt-in gate — call sites stay unaware of
  // consent, so there's no way to add a new tracked event that skips it.
  if (!hasAnalyticsConsent()) return;
  const sessionId = getSessionId();
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({ event, properties, sessionId }),
  }).catch(() => {});
}
