import { NextResponse } from 'next/server';
import { fetchPriceConfig } from '@/lib/utils/pricing-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const prices = await fetchPriceConfig();
  return NextResponse.json(prices);
}
