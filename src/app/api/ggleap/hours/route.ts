import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { lookupUser } from '@/lib/ggleap/client';
import { checkRateLimit, readCache, writeCache } from '@/lib/ggleap/hours';

/**
 * Public ggLeap hours lookup for the checkout flows.
 *
 * POST rather than GET so nicknames stay out of access logs, `Referer` headers
 * and any CDN cache. The response carries only `{ status, minutes }` — never the
 * email, name, UUID or Kč balance that ggLeap also returns — so an enumeration
 * attempt learns as little as possible.
 */

const HoursSchema = z.object({
  username: z.string().trim().min(2).max(64),
});

type PublicResult = { status: 'ok'; minutes: number } | { status: 'not_found' } | { status: 'unavailable' };

function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(req: NextRequest) {
  const parsed = HoursSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Neplatné údaje', details: parsed.error.flatten() }, { status: 400 });
  }

  if (!checkRateLimit(clientKey(req))) {
    return NextResponse.json({ error: 'Příliš mnoho dotazů' }, { status: 429 });
  }

  const username = parsed.data.username;
  const cacheKey = username.toLowerCase();

  const cached = readCache<PublicResult>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const lookup = await lookupUser(username);
  const result: PublicResult =
    lookup.status === 'ok' ? { status: 'ok', minutes: lookup.user.minutes } : { status: lookup.status };

  // `unavailable` means ggLeap itself is down or unconfigured; caching it would
  // keep serving the failure for a minute after it recovers.
  if (result.status !== 'unavailable') writeCache(cacheKey, result);

  return NextResponse.json(result);
}
