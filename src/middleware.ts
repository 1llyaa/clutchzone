import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '../i18n/routing';
import { MAINTENANCE_COOKIE, expectedMaintenanceToken } from '@/lib/maintenance';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  if (process.env.MAINTENANCE_MODE === 'true') {
    const pathname = request.nextUrl.pathname;
    const isRedirect = response.status === 307 || response.status === 308;
    const isMaintenancePage = pathname.includes('/maintenance');

    if (!isRedirect && !isMaintenancePage) {
      const expected = await expectedMaintenanceToken();
      const cookie = request.cookies.get(MAINTENANCE_COOKIE)?.value;

      if (!expected || cookie !== expected) {
        const locale = pathname.split('/')[1] || routing.defaultLocale;
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/maintenance`;
        url.searchParams.set('from', pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
