import { NextResponse } from 'next/server';
import { getPricingConfig } from '@/lib/pricing/config-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = await getPricingConfig();
  return NextResponse.json(config);
}
