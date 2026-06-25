import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: '/Users/user/Workspace/clutchzone',
  transpilePackages: ['swiper'],
};

export default withNextIntl(nextConfig);
