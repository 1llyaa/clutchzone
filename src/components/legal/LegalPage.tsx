import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LegalSection from './LegalSection';
import type { LegalDocument } from '@/content/legal/types';

export default function LegalPage({ doc }: { doc: LegalDocument }) {
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
          {doc.sections.map((section) => (
            <LegalSection key={section.id} section={section} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
