import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/auth';
import { getPricingConfig } from '@/lib/pricing/config-server';
import { adminQuote } from '@/lib/bookings/admin-quote';

const QuoteSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startMinutes: z.coerce.number().int().min(0).max(2880),
  durationMinutes: z.coerce.number().int().min(15).max(24 * 60),
  stationType: z.enum(['pc', 'ps5']),
  stationsCount: z.coerce.number().int().min(1).max(20),
});

/** Price suggestion for the admin "new booking" form. `quote: null` = type it in. */
export async function GET(request: NextRequest) {
  const profile = await requireAdmin();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = QuoteSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Neplatná data' }, { status: 400 });
  }

  const config = await getPricingConfig();
  return NextResponse.json({ quote: adminQuote(config, parsed.data) });
}
