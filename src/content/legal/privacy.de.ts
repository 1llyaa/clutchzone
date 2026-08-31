// Schutz personenbezogener Daten — deutsche Gefälligkeitsübersetzung des vom
// Betreiber gelieferten Dokuments.
//
// Verbindlich ist ausschließlich die tschechische Fassung in `privacy.cs.ts`;
// diese Datei ist eine Übersetzung, die nur der Bequemlichkeit dient. Bei
// Abweichungen hat der tschechische Wortlaut Vorrang.
//
// Der tschechische Ausgangstext ist wortwörtlich aus dem Dokument des
// Betreibers übernommen, einschließlich augenscheinlicher Fehler (etwa die
// Schreibweise „České BUdějovice“ in Abschnitt 1 sowie die Anschriften in der
// gelieferten Form). Diese Auffälligkeiten wurden hier bewusst beibehalten und
// dürfen nicht „korrigiert“ werden.
//
// Steht noch zur Prüfung durch den Betreiber aus — bislang weder vom Betreiber
// noch von einem Übersetzer freigegeben.
import type { LegalDocument } from './types';

export const PRIVACY_DE: LegalDocument = {
  version: '2026-08-30',
  eyebrow: '// RECHTLICHE HINWEISE',
  title: 'Schutz personenbezogener Daten',
  sections: [
    {
      id: 'spravce',
      title: '1. Verantwortlicher für die personenbezogenen Daten',
      body: [
        { type: 'p', text: 'Verantwortlicher für die personenbezogenen Daten ist:' },
        {
          type: 'ul',
          items: [
            'Martin Mašek',
            'Sitz: Václava Volfa 1337/37, 37005 České Budějovice',
            'Identifikationsnummer (IČO): 23095571',
            'Web: https://clutchzone.club',
          ],
        },
        { type: 'p', text: 'Kontakte der Filialen:' },
        {
          type: 'ul',
          items: [
            'Clutch Zone',
            'Krajinská 2381/17, 37001, České BUdějovice',
            'Telefon: +420 733 104 289',
            'E-Mail: info@clutchzone.club',
          ],
        },
        {
          type: 'p',
          text: 'Dieses Dokument erläutert, wie Clutch Zone die personenbezogenen Daten von Kunden, Besuchern der Website, Turnierteilnehmern und Personen verarbeitet, die mit uns kommunizieren.',
        },
      ],
    },
    {
      id: 'jake-udaje',
      title: '2. Welche personenbezogenen Daten wir verarbeiten',
      body: [
        { type: 'p', text: 'Wir können insbesondere folgende personenbezogene Daten verarbeiten:' },
        {
          type: 'ul',
          items: [
            'Identifikationsdaten: Vorname, Nachname, gegebenenfalls Spitzname oder Teamname;',
            'Kontaktdaten: E-Mail, Telefon;',
            'Daten zur Reservierung: Filiale, Datum, Uhrzeit, Art der Dienstleistung, gewählte Gaming-Zone oder gewählter Platz;',
            'Daten zum Kundenkonto: Kontokennung, Historie der Inanspruchnahme von Dienstleistungen, gekaufte Stunden, Pakete, Boni und Gutscheine;',
            'Daten zu Zahlungen und Käufen: Informationen, die zur Erfassung von Zahlungen, Quittungen, Rechnungen und Buchhaltungsbelegen erforderlich sind;',
            'Daten zu Turnieren und Veranstaltungen: Registrierung, Team, Ergebnisse, Spiel-Nickname, Kommunikation zum Turnier;',
            'Daten aus der Kommunikation: Inhalt der Nachrichten, Anfragen, Reklamationen oder Anliegen des Kunden;',
            'Marketingdaten: Einwilligung in den Erhalt von Werbemitteilungen, Kommunikationspräferenzen, Reaktionen auf Kampagnen;',
            'technische Daten von der Website: IP-Adresse, Gerätetyp, Browser, Cookies und vergleichbare Technologien gemäß den Cookie-Einstellungen.',
          ],
        },
        {
          type: 'p',
          text: 'Wird in einer Filiale ein Kamerasystem eingesetzt, ist der betreffende Bereich mit einem gesonderten Hinweis gekennzeichnet. Kameraaufzeichnungen können insbesondere zum Schutz von Personen, Eigentum und der Betriebssicherheit verarbeitet werden.',
        },
      ],
    },
    {
      id: 'proc-zpracovavame',
      title: '3. Warum wir personenbezogene Daten verarbeiten',
      body: [
        { type: 'p', text: 'Personenbezogene Daten verarbeiten wir insbesondere zu folgenden Zwecken:' },
        {
          type: 'ul',
          items: [
            'Erstellung und Verwaltung der Reservierung;',
            'Erbringung der Dienstleistungen von Clutch Zone;',
            'Verwaltung des Kundenkontos, der Spielstunden, Pakete, Boni und Gutscheine;',
            'Registrierung und Organisation von Turnieren und Veranstaltungen;',
            'Kommunikation mit dem Kunden;',
            'Bearbeitung von Anfragen, Beschwerden und Reklamationen;',
            'Erfüllung buchhalterischer, steuerlicher und sonstiger rechtlicher Pflichten;',
            'Schutz der Rechte, des Eigentums und der Sicherheit des Betreibers, der Kunden und des Personals;',
            'Verbesserung der Dienstleistungen und des Betriebs der Filialen;',
            'Versand von Werbemitteilungen und Marketingkommunikation, sofern wir dafür einen Rechtsgrund oder eine Einwilligung haben;',
            'Analyse der Website-Besuche und Marketingmessung gemäß den Cookie-Einstellungen.',
          ],
        },
      ],
    },
    {
      id: 'pravni-zaklady',
      title: '4. Rechtsgrundlagen der Verarbeitung',
      body: [
        { type: 'p', text: 'Personenbezogene Daten verarbeiten wir auf Grundlage folgender Rechtsgründe:' },
        {
          type: 'ul',
          items: [
            'Erfüllung eines Vertrags oder Durchführung vorvertraglicher Maßnahmen;',
            'Erfüllung rechtlicher Pflichten, insbesondere im Bereich der Buchhaltung und der Steuern;',
            'berechtigtes Interesse des Betreibers, insbesondere Schutz des Eigentums, Betriebssicherheit, Bearbeitung von Reklamationen und Verbesserung der Dienstleistungen;',
            'Einwilligung des Kunden, insbesondere bei einigen Marketingaktivitäten und ausgewählten Cookies.',
          ],
        },
        {
          type: 'p',
          text: 'Beruht die Verarbeitung auf einer Einwilligung, kann der Kunde seine Einwilligung jederzeit widerrufen. Der Widerruf der Einwilligung berührt nicht die Rechtmäßigkeit der vor dem Widerruf erfolgten Verarbeitung.',
        },
      ],
    },
    {
      id: 'prijemci',
      title: '5. An wen wir die Daten weitergeben können',
      body: [
        {
          type: 'p',
          text: 'Personenbezogene Daten können nur im erforderlichen Umfang folgenden Kategorien von Empfängern zugänglich gemacht werden:',
        },
        {
          type: 'ul',
          items: [
            'Anbietern des Reservierungs- oder Kundensystems, zum Beispiel ggLeap / ggCircuit oder vergleichbaren Diensten;',
            'Anbietern von IT, Hosting, Website-Verwaltung und technischem Support;',
            'Anbietern von Zahlungs-, Kassen- und Buchhaltungssystemen;',
            'Buchhaltungs-, Steuer- und Rechtsberatern;',
            'Anbietern von E-Mailing-, SMS- oder Marketingwerkzeugen;',
            'Anbietern von Analyse- und Werbewerkzeugen, sofern diese eingesetzt werden und sofern dafür ein Rechtsgrund besteht;',
            'Behörden der öffentlichen Gewalt, sofern dies die Rechtsvorschriften verlangen.',
          ],
        },
        { type: 'p', text: 'Personenbezogene Daten verkaufen wir nicht an Dritte.' },
      ],
    },
    {
      id: 'doba-uchovani',
      title: '6. Dauer der Aufbewahrung personenbezogener Daten',
      body: [
        {
          type: 'p',
          text: 'Personenbezogene Daten bewahren wir nur so lange auf, wie es für den Zweck erforderlich ist, für den sie erhoben wurden, oder für die durch Rechtsvorschriften festgelegte Dauer.',
        },
        { type: 'p', text: 'Allgemein gilt:' },
        {
          type: 'ul',
          items: [
            'Daten im Zusammenhang mit Reservierungen und dem Kundenkonto bewahren wir für die Dauer der Kundenbeziehung und anschließend für die zum Schutz der Rechte des Betreibers erforderliche Dauer auf;',
            'Buchhaltungs- und Steuerbelege bewahren wir für die durch Rechtsvorschriften festgelegte Dauer auf;',
            'Daten aus der Kommunikation bewahren wir für die zur Erledigung des Anliegens erforderliche Dauer und anschließend für die zum Schutz der Rechte des Betreibers erforderliche Dauer auf;',
            'Marketingdaten verarbeiten wir bis zum Widerruf der Einwilligung oder bis zu dem Zeitpunkt, zu dem sie nicht mehr benötigt werden;',
            'Cookies werden gemäß den Einstellungen der einzelnen Cookies und Einwilligungen aufbewahrt.',
          ],
        },
      ],
    },
    {
      id: 'prava',
      title: '7. Rechte der betroffenen Person',
      body: [
        {
          type: 'p',
          text: 'Im Zusammenhang mit der Verarbeitung personenbezogener Daten hat der Kunde folgende Rechte:',
        },
        {
          type: 'ul',
          items: [
            'das Recht auf Auskunft über die personenbezogenen Daten;',
            'das Recht auf Berichtigung unrichtiger oder unvollständiger Daten;',
            'das Recht auf Löschung der personenbezogenen Daten, sofern die gesetzlichen Voraussetzungen erfüllt sind;',
            'das Recht auf Einschränkung der Verarbeitung;',
            'das Recht auf Widerspruch gegen eine auf einem berechtigten Interesse beruhende Verarbeitung;',
            'das Recht auf Datenübertragbarkeit, sofern die Verarbeitung auf einer Einwilligung oder einem Vertrag beruht und automatisiert erfolgt;',
            'das Recht, die Einwilligung zu widerrufen;',
            'das Recht, eine Beschwerde beim Amt für den Schutz personenbezogener Daten (Úřad pro ochranu osobních údajů) einzureichen.',
          ],
        },
        {
          type: 'ul',
          items: [
            'Amt für den Schutz personenbezogener Daten (Úřad pro ochranu osobních údajů)',
            'Pplk. Sochora 27, 170 00 Praha 7',
            'Web: https://uoou.gov.cz',
          ],
        },
      ],
    },
    {
      id: 'obchodni-sdeleni',
      title: '8. Werbemitteilungen',
      body: [
        {
          type: 'p',
          text: 'Werbemitteilungen versenden wir ausschließlich im Einklang mit den geltenden Rechtsvorschriften. Der Kunde kann sich jederzeit über den Link in der E-Mail oder durch Kontaktaufnahme mit der jeweiligen Filiale vom Bezug der Werbemitteilungen abmelden.',
        },
      ],
    },
    {
      // The /cookies settings page renders this section beneath the consent
      // controls — keep this id.
      id: 'cookies',
      title: '9. Cookies',
      body: [
        {
          type: 'p',
          text: 'Informationen über die Verwendung von Cookies sind in einem gesonderten Dokument „Cookie-Einstellungen“ angegeben.',
        },
      ],
    },
    {
      id: 'zmeny',
      title: '10. Änderungen dieses Dokuments',
      body: [
        {
          type: 'p',
          text: 'Wir können dieses Dokument fortlaufend aktualisieren. Die aktuelle Fassung ist stets auf der Website https://clutchzone.club verfügbar',
        },
      ],
    },
  ],
};
