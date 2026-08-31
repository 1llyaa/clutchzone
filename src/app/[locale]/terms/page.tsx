import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import { getLegalDocument } from '@/content/legal';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = `${getLegalDocument('terms', locale).title} — Clutch Zone`;
  return {
    title,
    alternates: { canonical: `/${locale}/terms` },
    openGraph: { title, url: `/${locale}/terms` },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <LegalPage doc={getLegalDocument('terms', locale)} />;
}
