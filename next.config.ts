import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['swiper'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/**' },
      {
        protocol: 'https',
        hostname: 'supabasekong-alfa5ntltxm2x4650331a8mr.clutchzone.club',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
