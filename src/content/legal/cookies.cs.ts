// Nastavení cookies — CS is the authoritative version and is reproduced here
// VERBATIM from the operator's supplied document.
//
// Do not "fix" this text. It describes the site as the operator's lawyer
// described it, which is not in every respect what the site currently does —
// the differences are written up in the operator's separate legal review notes
// (kept outside this repo) rather than patched in here.
import type { LegalDocument } from './types';

export const COOKIES_CS: LegalDocument = {
  version: '2026-09-03',
  eyebrow: '// PRÁVNÍ INFORMACE',
  title: 'Nastavení cookies',
  sections: [
    {
      id: 'co-jsou-cookies',
      title: '1. Co jsou cookies',
      body: [
        {
          type: 'p',
          text: 'Cookies jsou malé textové soubory, které webová stránka ukládá do vašeho zařízení (počítače, tabletu, mobilního telefonu) při jeho návštěvě. Slouží k tomu, aby webová stránka fungovala správně, případně aby si zapamatovala vaše nastavení.',
        },
      ],
    },
    {
      id: 'jake-cookies-pouzivame',
      title: '2. Jaké cookies používáme',
      body: [
        {
          type: 'p',
          text: 'Web https://clutchzone.club používá výhradně nezbytné (technické) cookies, které jsou nutné pro základní fungování webu a rezervačního systému. Bez těchto cookies by nebylo možné například dokončit online rezervaci nebo zůstat přihlášeni do zákaznického účtu.',
        },
        {
          type: 'table',
          head: ['Cookie / účel', 'Popis', 'Doba platnosti'],
          rows: [
            [
              'Session cookie rezervačního systému (ggLeap / ggCircuit)',
              'Zajišťuje funkčnost online rezervace, přihlášení do zákaznického účtu a uchování obsahu rezervace při procházení webu.',
              'Po dobu trvání relace (session)',
            ],
            [
              'Bezpečnostní cookie',
              'Chrání webový formulář a přihlašovací proces před zneužitím (např. CSRF ochrana).',
              'Po dobu trvání relace (session)',
            ],
            [
              'Cookie souhlasu s cookies',
              'Uchovává informaci o tom, že jste se seznámili s tímto nastavením cookies, aby se lišta nezobrazovala opakovaně.',
              'Až 12 měsíců',
            ],
          ],
        },
        {
          type: 'p',
          text: 'Vzhledem k tomu, že se jedná výhradně o nezbytné cookies nutné pro fungování webu, není podle platné právní úpravy vyžadován váš aktivní souhlas s jejich použitím.',
        },
      ],
    },
    {
      id: 'cookies-ktere-nepouzivame',
      title: '3. Cookies, které nepoužíváme',
      body: [
        {
          type: 'p',
          text: 'Web Clutch Zone nepoužívá žádné analytické cookies (např. Google Analytics) ani marketingové či reklamní cookies (např. Meta Pixel, remarketingové nástroje). Vaše chování na webu proto neshromažďujeme ani nevyhodnocujeme pro statistické nebo reklamní účely a s nikým jej za tímto účelem nesdílíme.',
        },
        {
          type: 'p',
          text: 'Pokud se toto v budoucnu změní, bude toto nastavení cookies aktualizováno a na webu bude zobrazena možnost udělit k novým typům cookies souhlas.',
        },
      ],
    },
    {
      id: 'sprava-cookies',
      title: '4. Jak můžete cookies spravovat',
      body: [
        {
          type: 'p',
          text: 'I nezbytné cookies můžete kdykoli smazat nebo zablokovat v nastavení svého internetového prohlížeče. Upozorňujeme, že zablokování těchto cookies může omezit funkčnost webu, zejména možnost dokončit online rezervaci nebo zůstat přihlášeni do zákaznického účtu.',
        },
        { type: 'p', text: 'Návod pro nejběžnější prohlížeče najdete zde:' },
        {
          type: 'ul',
          items: [
            'Google Chrome: nastavení prohlížeče → Soukromí a zabezpečení → Cookies a další data webů',
            'Mozilla Firefox: nastavení prohlížeče → Soukromí a zabezpečení → Cookies a data webových stránek',
            'Safari: Předvolby → Soukromí',
            'Microsoft Edge: nastavení prohlížeče → Soukromí, vyhledávání a služby → Cookies',
          ],
        },
      ],
    },
    {
      id: 'kamerovy-system',
      title: '5. Kamerový systém',
      body: [
        {
          type: 'p',
          text: 'V prostorách pobočky Clutch Zone je v provozu kamerový systém se záznamem, sloužící k ochraně majetku a bezpečnosti návštěvníků a personálu. Kamerový systém nesouvisí s cookies používanými na webu. Informace o zpracování osobních údajů v souvislosti s kamerovým systémem jsou uvedeny v samostatném dokumentu „Ochrana osobních údajů“ dostupném na webových stránkách provozovatele.',
        },
      ],
    },
    {
      id: 'kontakt',
      title: '6. Kontakt',
      body: [
        {
          type: 'p',
          text: 'V případě dotazů k tomuto nastavení cookies nás můžete kontaktovat na e-mailu info@clutchzone.club.',
        },
        {
          type: 'p',
          text: 'Toto nastavení cookies je dostupné na webových stránkách https://clutchzone.club/cookies.',
        },
      ],
    },
  ],
};
