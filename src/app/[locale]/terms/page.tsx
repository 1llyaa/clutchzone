// DRAFT legal text — standard small-business template, not reviewed by an
// advokát. Get it checked before relying on it, especially the cancellation
// window in §4 (24h assumed, not confirmed by the business owner) since
// payments run through Stripe.
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { BUSINESS } from '@/lib/business';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://clutchzone.club';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isCs = locale === 'cs';
  const title = isCs ? 'Obchodní podmínky — Clutch Zone' : 'Terms & Conditions — Clutch Zone';
  return {
    title,
    alternates: { canonical: `/${locale}/terms` },
    openGraph: { title, url: `/${locale}/terms` },
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 40 }}>
      <h2
        className="font-display text-cz-orange uppercase"
        style={{ fontSize: 22, letterSpacing: 1, marginBottom: 14 }}
      >
        {title}
      </h2>
      <div className="font-body text-cz-gray-light" style={{ fontSize: 15, lineHeight: 1.8 }}>
        {children}
      </div>
    </section>
  );
}

function CS() {
  return (
    <>
      <Section title="1. Úvodní ustanovení">
        <p>
          Tyto obchodní podmínky upravují vzájemná práva a povinnosti mezi {BUSINESS.ownerName}, IČO:{' '}
          {BUSINESS.ico}, se sídlem {BUSINESS.registeredAddress} (dále jen &bdquo;provozovatel&ldquo;),
          a zákazníkem při rezervaci herních stanic (PC, PS5), účasti na turnajích a soukromých akcích
          v provozovně na adrese {BUSINESS.venueAddress}, sjednaných prostřednictvím webu{' '}
          {SITE_URL.replace('https://', '')}.
        </p>
      </Section>

      <Section title="2. Rezervace">
        <p>
          Rezervaci lze provést přes rezervační formulář na webu. Rezervace je závazná okamžikem
          jejího potvrzení provozovatelem (zobrazením potvrzení a přidělením rezervačního čísla,
          případně e-mailem). Zákazník odpovídá za správnost uvedených kontaktních údajů.
        </p>
      </Section>

      <Section title="3. Ceny a platba">
        <p>
          Ceny za pronájem stanic se řídí aktuálním ceníkem zveřejněným na webu. Platbu lze provést
          online platební kartou (zpracovává Stripe) při rezervaci, nebo na místě v provozovně.
          Provozovatel nemá přístup k údajům platební karty — ty zpracovává výhradně Stripe.
        </p>
      </Section>

      <Section title="4. Storno a změny rezervace">
        <p>
          Rezervaci lze bezplatně zrušit nebo změnit nejpozději 24 hodin před jejím začátkem, a to
          kontaktováním provozovatele na {BUSINESS.email} nebo {BUSINESS.phone}. Při zrušení v kratší
          lhůtě nebo při nedostavení se bez omluvy si provozovatel vyhrazuje právo účtovat storno
          poplatek ve výši uhrazené zálohy, pokud byla platba provedena online předem.
        </p>
      </Section>

      <Section title="5. Pravidla provozovny">
        <p>
          Zákazník je povinen chovat se v prostorách provozovny ohleduplně k ostatním hostům
          a šetrně zacházet se zapůjčeným vybavením. Za škodu na vybavení způsobenou úmyslně nebo
          z hrubé nedbalosti odpovídá zákazník v plné výši.
        </p>
      </Section>

      <Section title="6. Turnaje">
        <p>
          Účast na turnajích se řídí pravidly zveřejněnými u konkrétního turnaje na webu (formát,
          herní pravidly, výše a podmínky výplaty výher). Registrace na turnaj je závazná okamžikem
          jejího potvrzení.
        </p>
      </Section>

      <Section title="7. Reklamace">
        <p>
          Případné reklamace uplatňuje zákazník bez zbytečného odkladu na {BUSINESS.email}.
          Provozovatel reklamaci vyřídí do 30 dnů od jejího uplatnění.
        </p>
      </Section>

      <Section title="8. Ochrana osobních údajů">
        <p>
          Zpracování osobních údajů zákazníků je popsáno samostatně v{' '}
          <Link href="/cs/privacy" className="text-cz-orange hover:underline">
            zásadách ochrany osobních údajů
          </Link>
          .
        </p>
      </Section>

      <Section title="9. Závěrečná ustanovení">
        <p>
          Tyto podmínky se řídí právním řádem České republiky. Provozovatel si vyhrazuje právo
          podmínky v přiměřeném rozsahu měnit; aktuální znění je vždy dostupné na této stránce.
        </p>
      </Section>
    </>
  );
}

function EN() {
  return (
    <>
      <Section title="1. Introduction">
        <p>
          These terms govern the relationship between {BUSINESS.ownerName}, Company ID (IČO):{' '}
          {BUSINESS.ico}, registered at {BUSINESS.registeredAddress} (&ldquo;the operator&rdquo;), and
          the customer when booking gaming stations (PC, PS5), tournament entries, or private events
          at the venue at {BUSINESS.venueAddress}, arranged through {SITE_URL.replace('https://', '')}.
        </p>
      </Section>

      <Section title="2. Bookings">
        <p>
          Bookings are made through the booking form on the website. A booking becomes binding once
          confirmed by the operator (booking reference shown, optionally by email). The customer is
          responsible for the accuracy of the contact details provided.
        </p>
      </Section>

      <Section title="3. Prices and payment">
        <p>
          Prices follow the current price list published on the website. Payment can be made online
          by card (processed by Stripe) at the time of booking, or in person at the venue. The
          operator never has access to card details — these are handled exclusively by Stripe.
        </p>
      </Section>

      <Section title="4. Cancellations and changes">
        <p>
          A booking can be cancelled or changed free of charge up to 24 hours before its start time,
          by contacting the operator at {BUSINESS.email} or {BUSINESS.phone}. Cancelling later, or not
          showing up without notice, may result in a cancellation fee equal to any amount already
          paid online.
        </p>
      </Section>

      <Section title="5. Venue rules">
        <p>
          Customers are expected to behave considerately toward other guests and handle rented
          equipment with care. Customers are fully liable for damage to equipment caused
          intentionally or through gross negligence.
        </p>
      </Section>

      <Section title="6. Tournaments">
        <p>
          Tournament participation follows the rules published for each specific tournament on the
          website (format, in-game rules, prize amounts and payout conditions). A tournament
          registration becomes binding once confirmed.
        </p>
      </Section>

      <Section title="7. Complaints">
        <p>
          Complaints should be raised without undue delay at {BUSINESS.email}. The operator will
          resolve complaints within 30 days of receipt.
        </p>
      </Section>

      <Section title="8. Personal data">
        <p>
          How customer personal data is processed is described separately in the{' '}
          <Link href="/en/privacy" className="text-cz-orange hover:underline">
            privacy policy
          </Link>
          .
        </p>
      </Section>

      <Section title="9. Final provisions">
        <p>
          These terms are governed by the laws of the Czech Republic. The operator may amend these
          terms within a reasonable scope; the current version is always available on this page.
        </p>
      </Section>
    </>
  );
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isCs = locale === 'cs';

  return (
    <>
      <Navbar />
      <main className="bg-cz-black px-6 py-20 md:px-16 md:py-28">
        <div className="max-w-[760px] mx-auto">
          <span
            className="font-mono text-cz-orange uppercase block"
            style={{ fontSize: 11, letterSpacing: 4, marginBottom: 10 }}
          >
            {isCs ? '// PRÁVNÍ INFORMACE' : '// LEGAL'}
          </span>
          <h1
            className="font-display text-white uppercase"
            style={{ fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: 1.5, lineHeight: 0.95 }}
          >
            {isCs ? 'Obchodní podmínky' : 'Terms & Conditions'}
          </h1>
          {isCs ? <CS /> : <EN />}
        </div>
      </main>
      <Footer />
    </>
  );
}
