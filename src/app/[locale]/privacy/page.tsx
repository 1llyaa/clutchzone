// DRAFT legal text — standard small-business GDPR template, not reviewed by
// an advokát. Get it checked before relying on it, especially the retention
// periods in §5 which use generic defaults.
import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { BUSINESS } from '@/lib/business';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isCs = locale === 'cs';
  const title = isCs
    ? 'Ochrana osobních údajů — Clutch Zone'
    : 'Privacy Policy — Clutch Zone';
  return {
    title,
    alternates: { canonical: `/${locale}/privacy` },
    openGraph: { title, url: `/${locale}/privacy` },
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
      <div className="font-body text-cz-gray-light" style={{ fontSize: 19, lineHeight: 1.8 }}>
        {children}
      </div>
    </section>
  );
}

function CS() {
  return (
    <>
      <Section title="1. Správce údajů">
        <p>
          Správcem osobních údajů je {BUSINESS.ownerName}, IČO: {BUSINESS.ico}, se sídlem{' '}
          {BUSINESS.registeredAddress}, provozovna {BUSINESS.venueAddress}. Kontakt:{' '}
          {BUSINESS.email}, {BUSINESS.phone}.
        </p>
      </Section>

      <Section title="2. Jaké údaje zpracováváme">
        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li>jméno a příjmení, e-mail, telefon — z rezervačního a kontaktního formuláře,</li>
          <li>údaje o rezervaci — vybraná stanice, datum, čas, délka, cena,</li>
          <li>
            platební údaje při online platbě zpracovává výhradně Stripe — číslo karty se
            k provozovateli nikdy nedostane.
          </li>
        </ul>
      </Section>

      <Section title="3. Účel a právní základ zpracování">
        <p>
          Údaje zpracováváme za účelem vyřízení rezervace a plnění smlouvy (čl. 6 odst. 1 písm. b)
          GDPR) a za účelem oprávněného zájmu provozovatele na provozu a bezpečnosti klubu (čl. 6
          odst. 1 písm. f) GDPR).
        </p>
      </Section>

      <Section title="4. Příjemci údajů">
        <p>Údaje jsou zpřístupněny těmto zpracovatelům:</p>
        <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li>Supabase — databázová infrastruktura a přihlašování do administrace,</li>
          <li>Stripe — zpracování online plateb,</li>
          <li>poskytovatel e-mailových notifikací (Seznam.cz SMTP) — potvrzení a upozornění o rezervaci.</li>
        </ul>
      </Section>

      <Section title="5. Doba uchování">
        <p>
          Údaje o rezervaci uchováváme po dobu nezbytnou k jejímu vyřízení a dále po dobu, kterou
          vyžadují právní předpisy (např. účetní a daňové doklady po dobu stanovenou zákonem).
          Zprávy z kontaktního formuláře mažeme, jakmile pominul důvod jejich uchování.
        </p>
      </Section>

      <Section title="6. Vaše práva">
        <p>
          Máte právo na přístup k údajům, jejich opravu, výmaz, omezení zpracování, přenositelnost
          a právo vznést námitku. Svá práva můžete uplatnit na {BUSINESS.email}. Máte také právo
          podat stížnost u Úřadu pro ochranu osobních údajů (uoou.cz).
        </p>
      </Section>

      <Section title="7. Cookies">
        <p>
          Web používá pouze technicky nezbytné cookies — uložení jazykové volby a přihlašovací
          session pro administraci. Žádné marketingové ani analytické sledovací cookies aktuálně
          nepoužíváme, souhlas s cookies proto není vyžadován.
        </p>
      </Section>
    </>
  );
}

function EN() {
  return (
    <>
      <Section title="1. Data controller">
        <p>
          The data controller is {BUSINESS.ownerName}, Company ID (IČO): {BUSINESS.ico}, registered
          at {BUSINESS.registeredAddress}, venue at {BUSINESS.venueAddress}. Contact:{' '}
          {BUSINESS.email}, {BUSINESS.phone}.
        </p>
      </Section>

      <Section title="2. What data we process">
        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li>name, email, phone number — from the booking and contact forms,</li>
          <li>booking details — station, date, time, duration, price,</li>
          <li>
            online payment details are processed exclusively by Stripe — card numbers never reach
            the operator.
          </li>
        </ul>
      </Section>

      <Section title="3. Purpose and legal basis">
        <p>
          We process data to fulfil bookings under contract (GDPR Art. 6(1)(b)) and based on the
          operator&rsquo;s legitimate interest in running and securing the club (GDPR Art. 6(1)(f)).
        </p>
      </Section>

      <Section title="4. Recipients">
        <p>Data is shared with the following processors:</p>
        <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li>Supabase — database infrastructure and admin authentication,</li>
          <li>Stripe — online payment processing,</li>
          <li>our email notification provider (Seznam.cz SMTP) — booking confirmations and alerts.</li>
        </ul>
      </Section>

      <Section title="5. Retention">
        <p>
          Booking data is kept for as long as needed to fulfil the booking, and afterwards for as
          long as required by law (e.g. accounting records for the statutory period). Contact-form
          messages are deleted once there is no longer a reason to keep them.
        </p>
      </Section>

      <Section title="6. Your rights">
        <p>
          You have the right to access, correct, delete, or restrict processing of your data, to
          data portability, and to object to processing. Exercise these rights at {BUSINESS.email}.
          You also have the right to lodge a complaint with the Czech Office for Personal Data
          Protection (uoou.cz).
        </p>
      </Section>

      <Section title="7. Cookies">
        <p>
          The website only uses strictly necessary cookies — storing the language preference and
          the admin login session. We do not currently use any marketing or analytics tracking
          cookies, so cookie consent is not required.
        </p>
      </Section>
    </>
  );
}

export default async function PrivacyPage({
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
            style={{ fontSize: 16, letterSpacing: 4, marginBottom: 10 }}
          >
            {isCs ? '// PRÁVNÍ INFORMACE' : '// LEGAL'}
          </span>
          <h1
            className="font-display text-white uppercase"
            style={{ fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: 1.5, lineHeight: 0.95 }}
          >
            {isCs ? 'Ochrana osobních údajů' : 'Privacy Policy'}
          </h1>
          {isCs ? <CS /> : <EN />}
        </div>
      </main>
      <Footer />
    </>
  );
}
