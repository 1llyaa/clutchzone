import { getTranslations } from 'next-intl/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://clutchzone.club';

// Fill these once real business data is available — see project README/SEO notes.
// Nothing here is fabricated: fields with no env var are omitted rather than guessed.
const STREET_ADDRESS = process.env.NEXT_PUBLIC_BUSINESS_STREET;
const POSTAL_CODE = process.env.NEXT_PUBLIC_BUSINESS_POSTAL_CODE;
const PHONE = process.env.NEXT_PUBLIC_BUSINESS_PHONE;
const TAX_ID = process.env.NEXT_PUBLIC_BUSINESS_ICO;
const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL;
const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_URL;

const OPENING_HOURS = [
  { dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Sunday'], opens: '14:00', closes: '00:00' },
  { dayOfWeek: ['Friday', 'Saturday'], opens: '14:00', closes: '04:00' },
];

export default async function JsonLd({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'meta' });
  const address: Record<string, string> = {
    '@type': 'PostalAddress',
    addressLocality: t('addressLocality'),
    addressCountry: 'CZ',
  };
  if (STREET_ADDRESS) address.streetAddress = STREET_ADDRESS;
  if (POSTAL_CODE) address.postalCode = POSTAL_CODE;

  const sameAs = [INSTAGRAM_URL, DISCORD_URL].filter(Boolean) as string[];

  const data = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'SportsActivityLocation'],
    '@id': `${SITE_URL}/#business`,
    name: 'Clutch Zone',
    description: t('description'),
    url: SITE_URL,
    image: `${SITE_URL}/${locale}/opengraph-image`,
    address,
    ...(PHONE ? { telephone: PHONE } : {}),
    ...(TAX_ID ? { taxID: TAX_ID } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    priceRange: '75+ Kč',
    openingHoursSpecification: OPENING_HOURS.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      ...h,
    })),
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
