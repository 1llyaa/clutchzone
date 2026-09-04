import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LegalSection from '@/components/legal/LegalSection';
import { getLegalDocument } from '@/content/legal';
import CookieSettingsClient from './CookieSettingsClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = `${getLegalDocument('cookies', locale).title} — Clutch Zone`;
  return {
    title,
    alternates: { canonical: `/${locale}/cookies` },
    openGraph: { title, url: `/${locale}/cookies` },
  };
}

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // "Nastavení cookies" is a legal document in its own right — the terms and
  // the privacy policy both point here for it.
  const doc = getLegalDocument('cookies', locale);

  return (
    <>
      <Navbar />
      <main className="bg-cz-black px-6 py-20 md:px-16 md:py-28">
        <div className="max-w-[760px] mx-auto">
          <span
            className="font-mono text-cz-orange uppercase block"
            style={{ fontSize: 16, letterSpacing: 4, marginBottom: 10 }}
          >
            {doc.eyebrow}
          </span>
          <h1
            className="font-display text-white uppercase"
            style={{ fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: 1.5, lineHeight: 0.95 }}
          >
            {doc.title}
          </h1>

          <CookieSettingsClient />

          {doc.sections.map((section) => (
            <LegalSection key={section.id} section={section} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
