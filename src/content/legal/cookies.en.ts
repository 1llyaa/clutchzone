// Cookie settings — English convenience translation of the operator's supplied
// document.
//
// The Czech version in `cookies.cs.ts` is the authoritative, binding one; this
// file is a translation provided for convenience only. In case of any
// discrepancy, the Czech wording prevails.
//
// The text describes the site as the operator's lawyer described it, which is
// not in every respect what the site currently does — the differences are
// written up in the operator's separate legal review notes (kept outside this
// repo) rather than patched in here.
//
// Pending owner review — not yet signed off by the operator or a translator.
import type { LegalDocument } from './types';

export const COOKIES_EN: LegalDocument = {
  version: '2026-09-03',
  eyebrow: '// LEGAL',
  title: 'Cookie settings',
  sections: [
    {
      id: 'co-jsou-cookies',
      title: '1. What cookies are',
      body: [
        {
          type: 'p',
          text: 'Cookies are small text files that a website stores on your device (computer, tablet, mobile phone) when you visit it. They make the website work correctly and can remember your settings.',
        },
      ],
    },
    {
      id: 'jake-cookies-pouzivame',
      title: '2. Which cookies we use',
      body: [
        {
          type: 'p',
          text: 'The website https://clutchzone.club uses strictly necessary (technical) cookies only, which are required for the basic operation of the website and the booking system. Without these cookies it would not be possible, for example, to complete an online booking or stay signed in to a customer account.',
        },
        {
          type: 'table',
          head: ['Cookie / purpose', 'Description', 'Validity period'],
          rows: [
            [
              'Booking system session cookie (ggLeap / ggCircuit)',
              'Enables online booking, signing in to a customer account and keeping the contents of the booking while browsing the site.',
              'For the duration of the session',
            ],
            [
              'Security cookie',
              'Protects the web form and the sign-in process against misuse (e.g. CSRF protection).',
              'For the duration of the session',
            ],
            [
              'Cookie consent cookie',
              'Stores the fact that you have read these cookie settings so the bar is not shown repeatedly.',
              'Up to 12 months',
            ],
          ],
        },
        {
          type: 'p',
          text: 'As these are exclusively necessary cookies required for the website to work, your active consent to their use is not required under the applicable legislation.',
        },
      ],
    },
    {
      id: 'cookies-ktere-nepouzivame',
      title: '3. Cookies we do not use',
      body: [
        {
          type: 'p',
          text: 'The Clutch Zone website does not use any analytics cookies (e.g. Google Analytics) or marketing or advertising cookies (e.g. Meta Pixel, remarketing tools). We therefore neither collect nor evaluate your behaviour on the website for statistical or advertising purposes, and we do not share it with anyone for that purpose.',
        },
        {
          type: 'p',
          text: 'Should this change in the future, these cookie settings will be updated and the website will offer the option to consent to the new cookie types.',
        },
      ],
    },
    {
      id: 'sprava-cookies',
      title: '4. How you can manage cookies',
      body: [
        {
          type: 'p',
          text: 'You can delete or block even necessary cookies at any time in your browser settings. Please note that blocking these cookies may limit the functionality of the website, in particular the ability to complete an online booking or stay signed in to a customer account.',
        },
        { type: 'p', text: 'Instructions for the most common browsers:' },
        {
          type: 'ul',
          items: [
            'Google Chrome: browser settings → Privacy and security → Cookies and other site data',
            'Mozilla Firefox: browser settings → Privacy & Security → Cookies and Site Data',
            'Safari: Preferences → Privacy',
            'Microsoft Edge: browser settings → Privacy, search and services → Cookies',
          ],
        },
      ],
    },
    {
      id: 'kamerovy-system',
      title: '5. Camera system',
      body: [
        {
          type: 'p',
          text: 'A recording camera system is in operation on the premises of the Clutch Zone branch, serving to protect property and the safety of visitors and staff. The camera system is unrelated to the cookies used on the website. Information about the processing of personal data in connection with the camera system is set out in the separate document “Personal data protection” available on the operator’s website.',
        },
      ],
    },
    {
      id: 'kontakt',
      title: '6. Contact',
      body: [
        {
          type: 'p',
          text: 'If you have any questions about these cookie settings, you can contact us at info@clutchzone.club.',
        },
        {
          type: 'p',
          text: 'These cookie settings are available on the website https://clutchzone.club/cookies.',
        },
      ],
    },
  ],
};
