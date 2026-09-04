// Maintenance gate credentials.
//
// The gate is HTTP Basic Auth rather than an HTML login page on purpose.
// A styled username/password form served from the site's own URLs is
// indistinguishable from a credential-harvesting page to Google Safe
// Browsing, which flagged the site for "possible phishing on user sign-in".
// The browser's native Basic Auth dialog puts no password field in the DOM,
// so there is nothing for the heuristic — or for Chrome's saved-password
// reuse check — to fire on.

export function maintenanceEnabled(): boolean {
  return process.env.MAINTENANCE_MODE === 'true';
}

async function digest(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Digests are fixed-length hex, so this never leaks length information.
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Compare a submitted user/password pair against MAINTENANCE_USER /
 * MAINTENANCE_PASS. Comparing digests rather than the raw strings keeps the
 * check constant-time; with either variable unset nothing is let through.
 */
export async function credentialsMatch(user: string, pass: string): Promise<boolean> {
  const expectedUser = process.env.MAINTENANCE_USER;
  const expectedPass = process.env.MAINTENANCE_PASS;
  if (!expectedUser || !expectedPass) return false;

  const [got, want] = await Promise.all([
    digest(`${user}:${pass}`),
    digest(`${expectedUser}:${expectedPass}`),
  ]);
  return constantTimeEqual(got, want);
}

/**
 * Parse an `Authorization: Basic <base64>` header. Returns null when the
 * header is absent, not Basic, malformed base64, or has no `:` separator.
 */
export function parseBasicAuth(header: string | null): { user: string; pass: string } | null {
  if (!header?.startsWith('Basic ')) return null;

  let decoded: string;
  try {
    // atob yields one char per byte; re-decode as UTF-8 so non-ASCII
    // credentials survive the round trip.
    const bytes = Uint8Array.from(atob(header.slice(6).trim()), (c) => c.charCodeAt(0));
    decoded = new TextDecoder().decode(bytes);
  } catch {
    return null;
  }

  const separator = decoded.indexOf(':');
  if (separator === -1) return null;

  return { user: decoded.slice(0, separator), pass: decoded.slice(separator + 1) };
}
