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
};

export default withNextIntl(nextConfig);
