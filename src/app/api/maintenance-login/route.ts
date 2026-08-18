import { NextRequest, NextResponse } from 'next/server';
import { MAINTENANCE_COOKIE, maintenanceToken } from '@/lib/maintenance';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const user = String(formData.get('username') ?? '');
  const pass = String(formData.get('password') ?? '');
  const from = String(formData.get('from') ?? '/');
  const locale = String(formData.get('locale') ?? 'cs');

  const expectedUser = process.env.MAINTENANCE_USER;
  const expectedPass = process.env.MAINTENANCE_PASS;

  const url = request.nextUrl.clone();

  if (!expectedUser || !expectedPass || user !== expectedUser || pass !== expectedPass) {
    url.pathname = `/${locale}/maintenance`;
    url.searchParams.set('error', '1');
    if (from && from !== '/') url.searchParams.set('from', from);
    return NextResponse.redirect(url);
  }

  const token = await maintenanceToken(expectedUser, expectedPass);
  url.pathname = from && from.startsWith('/') ? from : `/${locale}`;
  url.search = '';

  const response = NextResponse.redirect(url);
  response.cookies.set(MAINTENANCE_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}
