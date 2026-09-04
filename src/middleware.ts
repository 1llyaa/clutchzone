import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '../i18n/routing';
import { credentialsMatch, maintenanceEnabled, parseBasicAuth } from '@/lib/maintenance';

const intlMiddleware = createMiddleware(routing);

function unauthorized(): NextResponse {
  return new NextResponse('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Clutch Zone", charset="UTF-8"',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export default async function middleware(request: NextRequest) {
  // Auth runs before locale negotiation: while the gate is up every path
  // answers 401, so there is no page for a crawler to index and no redirect
  // chain to keep exceptions for.
  if (maintenanceEnabled()) {
    const credentials = parseBasicAuth(request.headers.get('authorization'));
    if (!credentials || !(await credentialsMatch(credentials.user, credentials.pass))) {
      return unauthorized();
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
