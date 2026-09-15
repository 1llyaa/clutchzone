import type { Metadata } from 'next';
import { alternatesFor } from '@/lib/seo/alternates';
import LegalPage from '@/components/legal/LegalPage';
import { getLegalDocument } from '@/content/legal';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = `${getLegalDocument('privacy', locale).title} — Clutch Zone`;
  return {
    title,
    alternates: alternatesFor(locale, '/privacy'),
    openGraph: { title, url: `/${locale}/privacy` },
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <LegalPage doc={getLegalDocument('privacy', locale)} />;
}
