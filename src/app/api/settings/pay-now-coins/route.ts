import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const admin = createAdminClient();

  const { data: setting } = await admin
    .from('site_settings')
    .select('value')
    .eq('key', 'pay_now_coins_amount')
    .single();

  const amount = setting?.value ? parseInt(setting.value, 10) : 50;

  return NextResponse.json({ amount });
}
