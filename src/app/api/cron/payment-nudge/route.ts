import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { runPaymentNudgeBatch } from '@/lib/bookings/payment-nudge';

// Driven by pg_cron every minute (see migration 025). Nothing about the
// response may be cached.
export const dynamic = 'force-dynamic';

/**
 * Constant-time comparison over fixed-width digests, so neither the length nor
 * the content of CRON_SECRET leaks through response timing.
 */
function secretsMatch(provided: string, expected: string): boolean {
  return timingSafeEqual(
    createHash('sha256').update(provided).digest(),
    createHash('sha256').update(expected).digest(),
  );
}

export async function POST(request: NextRequest) {
  const expected = process.env.CRON_SECRET;

  // 503, deliberately not a quiet 200. A route that no-ops when misconfigured
  // is how this feature dies unnoticed: the job keeps succeeding and no
  // customer is ever nudged.
  if (!expected) {
    console.error('Payment nudge cron called but CRON_SECRET is not set.');
    return NextResponse.json({ error: 'Cron not configured' }, { status: 503 });
  }

  const provided = request.headers.get('x-cron-secret') ?? '';
  if (!secretsMatch(provided, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const summary = await runPaymentNudgeBatch();
  return NextResponse.json(summary);
}
