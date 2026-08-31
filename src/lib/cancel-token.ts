// Signed links for the self-service cancellation / withdrawal pages.
//
// Bookings are anonymous — there is no customer login to authenticate against,
// so the emailed link itself has to carry the proof. The token is derived, not
// stored: nothing extra has to be written at booking time, and validation stays
// a pure function of (id, exp, secret).
//
// This must be a keyed HMAC rather than the plain SHA-256 digest used in
// maintenance.ts: the booking group id travels in the URL and is not secret, so
// an unkeyed hash of it would be trivially forgeable.

const encoder = new TextEncoder();

function getSecret(): string {
  const secret = process.env.BOOKING_CANCEL_SECRET;
  if (!secret) {
    throw new Error('BOOKING_CANCEL_SECRET is not set — cancellation links cannot be signed.');
  }
  return secret;
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  return Buffer.from(bytes).toString('base64url');
}

/** Namespaced so a booking-cancel token can never be replayed as a withdrawal token. */
export type TokenScope = 'booking-cancel' | 'credit-withdraw';

function payload(scope: TokenScope, id: string, exp: number): string {
  return `${scope}.${id}.${exp}`;
}

export async function signToken(scope: TokenScope, id: string, exp: number): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', await getKey(), encoder.encode(payload(scope, id, exp)));
  return toBase64Url(sig);
}

export async function verifyToken(
  scope: TokenScope,
  id: string,
  exp: number,
  token: string,
): Promise<boolean> {
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;
  let sig: Uint8Array<ArrayBuffer>;
  try {
    // Copied onto a freshly allocated ArrayBuffer — a Buffer is backed by a
    // pooled ArrayBufferLike, which doesn't satisfy BufferSource.
    const decoded = Buffer.from(token, 'base64url');
    sig = new Uint8Array(new ArrayBuffer(decoded.byteLength));
    sig.set(decoded);
  } catch {
    return false;
  }
  try {
    // subtle.verify is constant-time, so this doesn't leak the signature.
    return await crypto.subtle.verify(
      'HMAC',
      await getKey(),
      sig,
      encoder.encode(payload(scope, id, exp)),
    );
  } catch {
    return false;
  }
}

/**
 * Builds the emailed link. `exp` is deliberately generous — the real
 * time-window rule (the free-cancellation cutoff) is enforced server-side
 * against the booking's own start time, so this expiry is only a backstop that
 * stops ancient links from staying live forever.
 */
export async function buildCancelUrl(
  locale: string,
  groupId: string,
  validForDays = 90,
): Promise<string> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://clutchzone.club';
  const exp = Math.floor(Date.now() / 1000) + validForDays * 86400;
  const token = await signToken('booking-cancel', groupId, exp);
  return `${base}/${locale}/rezervace/${groupId}?exp=${exp}&token=${token}`;
}

export async function buildWithdrawUrl(
  locale: string,
  orderId: string,
  validForDays = 30,
): Promise<string> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://clutchzone.club';
  const exp = Math.floor(Date.now() / 1000) + validForDays * 86400;
  const token = await signToken('credit-withdraw', orderId, exp);
  return `${base}/${locale}/kredit/${orderId}/odstoupit?exp=${exp}&token=${token}`;
}
