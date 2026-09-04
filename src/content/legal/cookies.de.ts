// Cookie-Einstellungen — deutsche Gefälligkeitsübersetzung des vom Betreiber
// gelieferten Dokuments.
//
// Verbindlich ist ausschließlich die tschechische Fassung in `cookies.cs.ts`;
// diese Datei ist eine Übersetzung, die nur der Bequemlichkeit dient. Bei
// Abweichungen hat der tschechische Wortlaut Vorrang.
//
// Der Text beschreibt die Website so, wie sie der Jurist des Betreibers
// beschrieben hat — das entspricht nicht in jeder Hinsicht dem heutigen Stand
// der Website. Die Abweichungen sind in den gesonderten rechtlichen Notizen des
// Betreibers festgehalten (außerhalb dieses Repositorys) und werden hier nicht
// stillschweigend korrigiert.
//
// Steht noch zur Prüfung durch den Betreiber aus — bislang weder vom Betreiber
// noch von einem Übersetzer freigegeben.
import type { LegalDocument } from './types';

export const COOKIES_DE: LegalDocument = {
  version: '2026-09-03',
  eyebrow: '// RECHTLICHE HINWEISE',
  title: 'Cookie-Einstellungen',
  sections: [
    {
      id: 'co-jsou-cookies',
      title: '1. Was Cookies sind',
      body: [
        {
          type: 'p',
          text: 'Cookies sind kleine Textdateien, die eine Website beim Besuch auf Ihrem Gerät (Computer, Tablet, Mobiltelefon) speichert. Sie sorgen dafür, dass die Website korrekt funktioniert, und können sich gegebenenfalls Ihre Einstellungen merken.',
        },
      ],
    },
    {
      id: 'jake-cookies-pouzivame',
      title: '2. Welche Cookies wir verwenden',
      body: [
        {
          type: 'p',
          text: 'Die Website https://clutchzone.club verwendet ausschließlich unbedingt erforderliche (technische) Cookies, die für den grundlegenden Betrieb der Website und des Reservierungssystems notwendig sind. Ohne diese Cookies wäre es beispielsweise nicht möglich, eine Online-Reservierung abzuschließen oder im Kundenkonto angemeldet zu bleiben.',
        },
        {
          type: 'table',
          head: ['Cookie / Zweck', 'Beschreibung', 'Gültigkeitsdauer'],
          rows: [
            [
              'Session-Cookie des Reservierungssystems (ggLeap / ggCircuit)',
              'Ermöglicht die Online-Reservierung, die Anmeldung im Kundenkonto und den Erhalt des Reservierungsinhalts beim Navigieren auf der Website.',
              'Für die Dauer der Sitzung (Session)',
            ],
            [
              'Sicherheits-Cookie',
              'Schützt das Webformular und den Anmeldevorgang vor Missbrauch (z. B. CSRF-Schutz).',
              'Für die Dauer der Sitzung (Session)',
            ],
            [
              'Cookie der Cookie-Einwilligung',
              'Speichert die Information, dass Sie diese Cookie-Einstellungen zur Kenntnis genommen haben, damit das Banner nicht wiederholt angezeigt wird.',
              'Bis zu 12 Monate',
            ],
          ],
        },
        {
          type: 'p',
          text: 'Da es sich ausschließlich um unbedingt erforderliche Cookies handelt, die für den Betrieb der Website notwendig sind, ist nach der geltenden Rechtslage Ihre aktive Einwilligung in deren Verwendung nicht erforderlich.',
        },
      ],
    },
    {
      id: 'cookies-ktere-nepouzivame',
      title: '3. Cookies, die wir nicht verwenden',
      body: [
        {
          type: 'p',
          text: 'Die Website von Clutch Zone verwendet keine Analyse-Cookies (z. B. Google Analytics) und keine Marketing- oder Werbe-Cookies (z. B. Meta Pixel, Remarketing-Tools). Ihr Verhalten auf der Website erfassen und werten wir daher nicht zu statistischen oder Werbezwecken aus und teilen es zu diesem Zweck mit niemandem.',
        },
        {
          type: 'p',
          text: 'Sollte sich dies künftig ändern, werden diese Cookie-Einstellungen aktualisiert und auf der Website wird die Möglichkeit angezeigt, in die neuen Cookie-Typen einzuwilligen.',
        },
      ],
    },
    {
      id: 'sprava-cookies',
      title: '4. Wie Sie Cookies verwalten können',
      body: [
        {
          type: 'p',
          text: 'Auch unbedingt erforderliche Cookies können Sie jederzeit in den Einstellungen Ihres Internetbrowsers löschen oder blockieren. Wir weisen darauf hin, dass das Blockieren dieser Cookies die Funktionalität der Website einschränken kann, insbesondere die Möglichkeit, eine Online-Reservierung abzuschließen oder im Kundenkonto angemeldet zu bleiben.',
        },
        { type: 'p', text: 'Anleitungen für die gängigsten Browser finden Sie hier:' },
        {
          type: 'ul',
          items: [
            'Google Chrome: Browsereinstellungen → Datenschutz und Sicherheit → Cookies und andere Websitedaten',
            'Mozilla Firefox: Browsereinstellungen → Datenschutz & Sicherheit → Cookies und Website-Daten',
            'Safari: Einstellungen → Datenschutz',
            'Microsoft Edge: Browsereinstellungen → Datenschutz, Suche und Dienste → Cookies',
          ],
        },
      ],
    },
    {
      id: 'kamerovy-system',
      title: '5. Kamerasystem',
      body: [
        {
          type: 'p',
          text: 'In den Räumlichkeiten der Filiale von Clutch Zone ist ein Kamerasystem mit Aufzeichnung in Betrieb, das dem Schutz des Eigentums sowie der Sicherheit der Besucher und des Personals dient. Das Kamerasystem steht in keinem Zusammenhang mit den auf der Website verwendeten Cookies. Informationen über die Verarbeitung personenbezogener Daten im Zusammenhang mit dem Kamerasystem sind im gesonderten Dokument „Schutz personenbezogener Daten“ angegeben, das auf der Website des Betreibers verfügbar ist.',
        },
      ],
    },
    {
      id: 'kontakt',
      title: '6. Kontakt',
      body: [
        {
          type: 'p',
          text: 'Bei Fragen zu diesen Cookie-Einstellungen können Sie uns unter der E-Mail-Adresse info@clutchzone.club kontaktieren.',
        },
        {
          type: 'p',
          text: 'Diese Cookie-Einstellungen sind auf der Website https://clutchzone.club/cookies verfügbar.',
        },
      ],
    },
  ],
};
