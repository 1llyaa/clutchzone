import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { ALLOWED_IMAGE_HOSTS } from './src/lib/images';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['swiper'],
  images: {
    // Exact hosts, shared with src/lib/images.ts. The former `**.supabase.co`
    // wildcard matched every Supabase project there is, which is what made the
    // optimizer reachable with attacker-hosted files.
    remotePatterns: ALLOWED_IMAGE_HOSTS.map((hostname) => ({
      protocol: 'https' as const,
      hostname,
      pathname: '/storage/v1/object/**',
    })),
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            // Report-only on purpose: a mistake in a live policy takes the site
            // down. Watch the browser console on every page before promoting
            // this to `Content-Security-Policy`.
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "img-src 'self' data: blob: https:",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co https://supabasekong-alfa5ntltxm2x4650331a8mr.clutchzone.club https://tiles.openfreemap.org https://api.stripe.com",
              "frame-src https://js.stripe.com https://player.twitch.tv",
              "worker-src 'self' blob:",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
      {
        // Signed self-service links carry a token in the query string; a
        // referer header would hand it to whatever the customer clicks next.
        source: '/:locale/rezervace/:id*',
        headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }],
      },
      {
        source: '/:locale/kredit/:orderId*',
        headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
