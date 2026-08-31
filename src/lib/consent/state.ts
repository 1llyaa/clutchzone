'use client';

// Analytics consent, opt-in. Nothing in src/lib/analytics fires until the
// visitor actively accepts — `null` (no choice yet) is treated as a refusal,
// not as permission. See /privacy#cookies.

const STORAGE_KEY = 'cz_cookie_consent';
// The pre-consent-gate bar only stored "this was acknowledged", which is not a
// consent signal — anyone carrying it must still be asked properly.
const LEGACY_ACK_KEY = 'cz_cookie_ack';

export const CONSENT_CHANGED_EVENT = 'cz:consent-changed';

export type ConsentValue = 'accepted' | 'rejected';

export function getConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === 'accepted' || raw === 'rejected' ? raw : null;
  } catch {
    // Private mode / storage blocked — no stored consent means no tracking.
    return null;
  }
}

export function setConsent(value: ConsentValue): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
    window.localStorage.removeItem(LEGACY_ACK_KEY);
  } catch {
    // Ignore — the event still fires so the UI updates for this page view.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: value }));
}

/** Withdrawal has to be as easy as granting — this reopens the choice. */
export function clearConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_ACK_KEY);
  } catch {
    // Ignore.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: null }));
}

export function hasAnalyticsConsent(): boolean {
  return getConsent() === 'accepted';
}
