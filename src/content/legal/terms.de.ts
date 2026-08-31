// Allgemeine Geschäftsbedingungen — deutsche Gefälligkeitsübersetzung des vom
// Betreiber gelieferten Dokuments.
//
// Verbindlich ist ausschließlich die tschechische Fassung in `terms.cs.ts`;
// diese Datei ist eine Übersetzung, die nur der Bequemlichkeit dient. Bei
// Abweichungen hat der tschechische Wortlaut Vorrang.
//
// Der tschechische Ausgangstext ist wortwörtlich aus dem Dokument des
// Betreibers übernommen, einschließlich augenscheinlicher Fehler (das in 1.1
// genannte Register, die Zeichensetzung in 1.1, die zwei jeweils mit „3.4.1“
// nummerierten Absätze sowie die Nennungen von „MVP ESports“ / „MVP Esports“
// in 7 und 9.1). Diese Auffälligkeiten wurden hier bewusst beibehalten und
// dürfen nicht „korrigiert“ werden.
//
// Steht noch zur Prüfung durch den Betreiber aus — bislang weder vom Betreiber
// noch von einem Übersetzer freigegeben.
import type { LegalDocument } from './types';

export const TERMS_DE: LegalDocument = {
  version: '2026-08-30',
  eyebrow: '// RECHTLICHE HINWEISE',
  title: 'Allgemeine Geschäftsbedingungen',
  sections: [
    {
      id: 'uvodni-ustanoveni',
      title: '1. Einleitende Bestimmungen',
      body: [
        {
          type: 'p',
          text: '1.1. Diese allgemeinen Geschäftsbedingungen (nachfolgend „AGB“) regeln die Rechte und Pflichten zwischen der Gesellschaft Martin Mašek., mit Sitz in Václava Volfa 1337/37, Identifikationsnummer (IČO): 23095571, eingetragen im Handelsregister, geführt beim Stadtgericht in České Budějovice, nachfolgend „Betreiber“), und dem Kunden bei der Reservierung und Nutzung der Dienstleistungen der Gaming-Center Clutch Zone.',
        },
        {
          type: 'p',
          text: '1.2. Diese AGB gelten insbesondere für die Nutzung von Gaming-PCs, Konsolen und Bootcamp-Zonen, die Teilnahme an Turnieren, die Nutzung eines Kundenkontos, den Kauf von Spielstunden, Paketen, Gutscheinen, Erfrischungen und weiteren ergänzenden Dienstleistungen, die in den Filialen von Clutch Zone erbracht werden (nachfolgend „Dienstleistungen“).',
        },
        {
          type: 'p',
          text: '1.3. Aktuelle Informationen zu Filialen, Preisen, Öffnungszeiten, Aktionen, Reservierungen und verfügbaren Dienstleistungen sind auf der Website https://clutchzone.club oder direkt in der jeweiligen Filiale angegeben.',
        },
        {
          type: 'p',
          text: '1.4. Mit der Nutzung der Dienstleistungen von Clutch Zone bestätigt der Kunde, dass er diese AGB, die Besuchsregeln und die Preisliste der Dienstleistungen zur Kenntnis genommen hat.',
        },
        {
          type: 'p',
          text: '1.5. Vereinbarungen, die bei einem konkreten Angebot, Paket, Turnier, Gutschein oder einer Promo-Aktion angegeben sind, haben Vorrang vor den allgemeinen Bestimmungen dieser AGB.',
        },
      ],
    },
    {
      id: 'identifikace-provozovatele',
      title: '2. Angaben zum Betreiber und zu den Filialen',
      body: [
        { type: 'p', text: '2.1. Betreiber:' },
        {
          type: 'ul',
          items: [
            'Martin Mašek',
            'Sitz: Václava Volfa 1337/37',
            'Identifikationsnummer (IČO): 23095571',
            'Web: https://clutchzone.club',
          ],
        },
        { type: 'p', text: '2.2. Filiale České Budějovice:' },
        {
          type: 'ul',
          items: [
            'Clutch Zone',
            'Adresse: Krajinská 2381/17',
            'Telefon: +420 733 104 289',
            'E-Mail: info@clutchzone.club',
          ],
        },
      ],
    },
    {
      id: 'rezervace-a-storno',
      title: '3. Reservierung und Stornobedingungen',
      body: [
        {
          type: 'p',
          text: '3.1. Die Reservierung der Dienstleistungen erfolgt vorrangig über die Website des Betreibers, gegebenenfalls telefonisch, per E-Mail oder direkt in der Filiale.',
        },
        {
          type: 'p',
          text: '3.2. Das Reservierungssystem kann von einem Dritten bereitgestellt werden (insbesondere durch das System ggLeap / ggCircuit). Der Betreiber haftet nicht für kurzfristige Nichtverfügbarkeit oder technische Fehler des externen Systems, sofern er sie nicht verursacht hat.',
        },
        {
          type: 'p',
          text: '3.3. Die Reservierung kann im Voraus über das Online-Zahlungsgateway auf der Website oder persönlich vor Ort im Gaming-Center vor Beginn der Leistungserbringung bezahlt werden.',
        },
        { type: 'p', text: '3.4. Stornierung der Reservierung durch den Kunden:' },
        {
          type: 'p',
          text: '3.4.1 Rechtzeitige Stornierung (mehr als 15 Minuten im Voraus): Der Kunde kann die Reservierung spätestens 15 Minuten vor ihrem geplanten Beginn kostenlos stornieren. Der gezahlte Betrag wird dem Kunden in diesem Fall in Form eines Guthabens auf seinem Benutzerkonto im Reservierungssystem erstattet (gegebenenfalls zurück auf die Zahlungskarte, sofern er dies schriftlich beantragt).',
        },
        {
          type: 'p',
          text: '3.4.1. Verspätete Stornierung und Nichterscheinen (weniger als 15 Minuten im Voraus): Storniert der Kunde die Reservierung weniger als 15 Minuten vor ihrem Beginn oder erscheint er zum Zeitpunkt der Reservierung nicht, verfällt die Reservierung und der Betreiber ist berechtigt, 100 % des gezahlten Betrags als Stornogebühr für die Blockierung des Spielplatzes einzubehalten.',
        },
        {
          type: 'p',
          text: '3.5. Verspätung des Kunden: Der Kunde ist verpflichtet, zur reservierten Zeit zu erscheinen. Weiß der Kunde, dass er sich verspäten wird, ist er verpflichtet, den Betreiber vorab (telefonisch oder per E-Mail) darüber zu informieren. In diesem Fall kann die Reservierungszeit nach Absprache und unter Berücksichtigung der aktuellen Auslastung verschoben werden. Meldet der Kunde die Verspätung nicht und erscheint er nicht innerhalb von 15 Minuten nach Beginn der Reservierung, kann sein Platz ohne Anspruch auf Rückerstattung der Zahlung anderen Interessenten angeboten werden.',
        },
        {
          type: 'p',
          text: '3.6. Der Betreiber behält sich das Recht vor, eine Reservierung aus technischen, betrieblichen oder Sicherheitsgründen zu stornieren oder zu ändern. In diesem Fall wird dem Kunden ein Ersatztermin angeboten oder die Zahlung in voller Höhe erstattet.',
        },
      ],
    },
    {
      id: 'ceny-a-platebni-podminky',
      title: '4. Preise und Zahlungsbedingungen',
      body: [
        {
          type: 'p',
          text: '4.1. Die Preise der Dienstleistungen sind in der aktuellen Preisliste auf der Website, im Reservierungssystem oder direkt in der Filiale angegeben. Die Preise sind in tschechischen Kronen und inklusive Mehrwertsteuer angegeben, sofern die Mehrwertsteuer nach den Rechtsvorschriften berechnet wird.',
        },
        {
          type: 'p',
          text: '4.2. Die Zahlung für die Dienstleistungen erfolgt in der Regel in der Filiale in bar, mit Zahlungskarte oder auf eine andere vom Betreiber zugelassene Weise.',
        },
        {
          type: 'p',
          text: '4.3. Spielen auf Schulden ist nicht gestattet. Der Kunde ist verpflichtet, die Dienstleistungen vor ihrer Inanspruchnahme oder nach den Anweisungen des Personals zu bezahlen.',
        },
        {
          type: 'p',
          text: '4.4. Der Betreiber nimmt keine beschädigten Banknoten oder Banknoten an, deren Echtheit nicht überprüft werden kann.',
        },
        {
          type: 'p',
          text: '4.5. Rabatte, Boni, Promo-Aktionen und sonstige Vorteile können nicht miteinander kombiniert werden, sofern beim konkreten Angebot nichts anderes angegeben ist.',
        },
        {
          type: 'p',
          text: '4.6. Der Betreiber stellt dem Kunden einen Steuerbeleg oder eine Quittung im Einklang mit den geltenden Rechtsvorschriften aus.',
        },
      ],
    },
    {
      id: 'herni-hodiny-balicky',
      title: '5. Spielstunden, Pakete, Boni und Geschenkgutscheine',
      body: [
        {
          type: 'p',
          text: '5.1. Die Gültigkeit gekaufter Stunden, Pakete, Dauerkarten, Gutscheine, Bonusstunden oder Promo-Stunden richtet sich nach den Bedingungen des konkreten Angebots, Tarifs oder der konkreten Promo-Aktion.',
        },
        {
          type: 'p',
          text: '5.2. Nicht genutzte Stunden verfallen nach Ablauf der Gültigkeitsdauer, sofern beim konkreten Angebot nichts anderes angegeben ist.',
        },
        {
          type: 'p',
          text: '5.3. Bonusstunden, Promo-Stunden und sonstige vergünstigte Guthaben sind nicht in Bargeld umtauschbar und können nicht ausgezahlt werden, sofern nicht ausdrücklich etwas anderes angegeben ist.',
        },
        {
          type: 'p',
          text: '5.4. Die Übertragung von Stunden, Paketen oder eines Kundenkontos auf eine andere Person ist nur mit Zustimmung des Betreibers oder nach den Bedingungen des konkreten Angebots möglich.',
        },
        {
          type: 'p',
          text: '5.5. Geschenkgutscheine können in dem Umfang genutzt werden, der auf dem konkreten Gutschein oder bei dessen Kauf angegeben ist. Sofern auf dem konkreten Gutschein nichts anderes angegeben ist, beträgt die Gültigkeit eines Geschenkgutscheins 12 Monate ab dem Datum seiner Ausstellung.',
        },
        {
          type: 'p',
          text: '5.6. Nach Ablauf der Gültigkeit eines Geschenkgutscheins können weder dessen Verlängerung noch ein Umtausch in Bargeld oder eine andere Leistung verlangt werden, sofern sich der Betreiber mit dem Kunden nicht anders einigt.',
        },
      ],
    },
    {
      id: 'turnaje-a-akce',
      title: '6. Turniere und Veranstaltungen',
      body: [
        {
          type: 'p',
          text: '6.1. Die Teilnahme an Turnieren ist kostenpflichtig, sofern beim konkreten Turnier nichts anderes angegeben ist.',
        },
        {
          type: 'p',
          text: '6.2. Die Teilnahmebedingungen, die Höhe des Startgeldes, die Turnierregeln, die Art der Registrierung, die Möglichkeiten zur Absage der Teilnahme und eine etwaige Rückerstattung des Startgeldes sind stets beim konkreten Turnier bei der Registrierung angegeben.',
        },
        {
          type: 'p',
          text: '6.3. Schließt der Kunde die Registrierung für ein Turnier ab, stimmt er den Regeln und Bedingungen des konkreten Turniers zu.',
        },
        {
          type: 'p',
          text: '6.4. Der Betreiber behält sich das Recht vor, ein Turnier aus organisatorischen, technischen oder Sicherheitsgründen abzusagen, zu verschieben oder dessen Format zu ändern. In diesem Fall werden die Kunden über das weitere Vorgehen informiert.',
        },
      ],
    },
    {
      id: 'pravidla-vyuzivani',
      title: '7. Regeln für die Nutzung der Dienstleistungen und Räumlichkeiten von MVP Esports',
      body: [
        {
          type: 'p',
          text: '7.1. Der Kunde ist verpflichtet, die Besuchsregeln, die Anweisungen des Personals und die Regeln des anständigen Verhaltens einzuhalten.',
        },
        {
          type: 'p',
          text: '7.2. Der Kunde ist verpflichtet, sich gegenüber den übrigen Besuchern, dem Personal, der Ausstattung und den Räumlichkeiten des Centers rücksichtsvoll zu verhalten.',
        },
        {
          type: 'p',
          text: '7.3. Der Kunde darf keine verbotenen Programme, Cheats, Hacks, illegale Software oder sonstige nicht autorisierte Software installieren.',
        },
        {
          type: 'p',
          text: '7.4. Der Kunde darf keine Kabel abziehen, keine Peripheriegeräte zwischen den Arbeitsplätzen verschieben, keine technischen Einstellungen der Geräte ändern und auch sonst nicht ohne Zustimmung des Personals in die Ausstattung eingreifen.',
        },
        {
          type: 'p',
          text: '7.5. Auf den Bildschirmen ist es verboten, beleidigende, diskriminierende, extremistische, pornografische oder sonst ungeeignete Inhalte anzuzeigen.',
        },
        {
          type: 'p',
          text: '7.6. Technische Probleme, Störungen oder Beschädigungen der Ausstattung ist der Kunde verpflichtet, dem Personal unverzüglich zu melden.',
        },
        {
          type: 'p',
          text: '7.7. Das Personal ist berechtigt, eine Sitzung zu beenden oder einen Besucher, der gegen die Regeln verstößt, des Hauses zu verweisen. Wiederholte oder schwerwiegende Regelverstöße können zu einer zeitweiligen Einschränkung oder zu einem Zutrittsverbot führen.',
        },
      ],
    },
    {
      id: 'deti-a-nezletili',
      title: '8. Kinder und minderjährige Besucher',
      body: [
        {
          type: 'p',
          text: '8.1. Kinder unter 12 Jahren dürfen die Dienstleistungen von Clutch Zone nur in Begleitung einer Person über 18 Jahren nutzen.',
        },
        {
          type: 'p',
          text: '8.2. Für ausgewählte Dienstleistungen, Veranstaltungen, Turniere oder Spiele kann eine andere Altersempfehlung oder Altersbeschränkung festgelegt werden. Eine solche Regel ist beim konkreten Angebot, der konkreten Veranstaltung oder dem konkreten Turnier angegeben.',
        },
        {
          type: 'p',
          text: '8.3. Für die Auswahl der Spiele und die Eignung der Inhalte für einen minderjährigen Kunden ist dessen gesetzlicher Vertreter oder die begleitende erwachsene Person verantwortlich.',
        },
      ],
    },
    {
      id: 'obcerstveni-a-alkohol',
      title: '9. Erfrischungen und Alkohol',
      body: [
        {
          type: 'p',
          text: '9.1. In den Räumlichkeiten des Centers dürfen ausschließlich Speisen und Getränke verzehrt werden, die in der jeweiligen Filiale MVP ESports gekauft wurden. Der Verzehr eigener Speisen und Getränke ist nicht gestattet, sofern das Personal nichts anderes bestimmt.',
        },
        {
          type: 'p',
          text: '9.2. Alkoholische Getränke werden nur an Personen über 18 Jahren verkauft und ausgeschenkt. Das Personal ist berechtigt, den Kunden um die Vorlage eines Ausweisdokuments zu bitten.',
        },
        {
          type: 'p',
          text: '9.3. Wird kein Ausweisdokument vorgelegt oder bestehen Zweifel am Alter des Kunden, kann das Personal den Verkauf von Alkohol verweigern.',
        },
        {
          type: 'p',
          text: '9.4. Alkoholische Getränke werden weder an eine Person verkauft noch ausgeschenkt, die offensichtlich unter dem Einfluss von Alkohol oder einer anderen Suchtmittelsubstanz steht.',
        },
        {
          type: 'p',
          text: '9.5. Der Betreiber behält sich das Recht vor, die Bedienung eines Kunden abzulehnen, dessen Verhalten die Sicherheit, die Ordnung, die Ausstattung oder den Komfort der übrigen Besucher gefährden kann.',
        },
      ],
    },
    {
      id: 'odpovednost-za-skodu',
      title: '10. Haftung für Schäden und persönliche Gegenstände',
      body: [
        {
          type: 'p',
          text: '10.1. Der Kunde haftet für Schäden, die er dem Betreiber, einem anderen Kunden oder einer dritten Person vorsätzlich oder fahrlässig zufügt.',
        },
        {
          type: 'p',
          text: '10.2. Die vorsätzliche Beschädigung der Ausstattung, der Computer, Konsolen, Peripheriegeräte, Möbel oder Räumlichkeiten des Centers ist verboten. Der verursachte Schaden muss ersetzt werden.',
        },
        {
          type: 'p',
          text: '10.3. Der Betreiber haftet nicht für verlorene oder unbeaufsichtigt zurückgelassene persönliche Gegenstände der Kunden.',
        },
        {
          type: 'p',
          text: '10.4. Der Betreiber haftet nicht für Ausfälle, Einschränkungen oder Fehler, die durch Internetanbieter, Softwarelieferanten, Spieleplattformen, das externe Reservierungssystem, höhere Gewalt oder sonstige Umstände außerhalb der unmittelbaren Kontrolle des Betreibers verursacht werden.',
        },
      ],
    },
    {
      // Footer "Reklamační řád" links to /terms#reklamace — keep this id.
      id: 'reklamace',
      title: '11. Reklamation von Dienstleistungen',
      body: [
        {
          type: 'p',
          text: '11.1. Stellt der Kunde ein Problem mit der erbrachten Dienstleistung, eine technische Störung oder ein anderes Hindernis fest, das die ordnungsgemäße Nutzung der Dienstleistung verhindert, ist er verpflichtet, dies dem Personal während des Besuchs unverzüglich zu melden.',
        },
        {
          type: 'p',
          text: '11.2. Ist die Reklamation berechtigt, kann der Betreiber dem Kunden eine angemessene Ersatzlösung anbieten, insbesondere eine Verlängerung der Zeit, einen Wechsel an einen anderen Platz, einen Ersatztermin oder eine andere Form der Kompensation.',
        },
        {
          type: 'p',
          text: '11.3. Reklamationen können persönlich in der Filiale oder per E-Mail an den Kontakt der jeweiligen Filiale abgewickelt werden.',
        },
      ],
    },
    {
      id: 'ochrana-osobnich-udaju',
      title: '12. Schutz personenbezogener Daten',
      body: [
        {
          type: 'p',
          text: '12.1. Informationen über die Verarbeitung personenbezogener Daten der Kunden sind in einem gesonderten Dokument „Schutz personenbezogener Daten“ angegeben, das auf der Website des Betreibers verfügbar ist.',
        },
        {
          type: 'p',
          text: '12.2. Informationen über Cookies sind in einem gesonderten Dokument „Cookie-Einstellungen“ angegeben.',
        },
      ],
    },
    {
      id: 'zaverecna-ustanoveni',
      title: '13. Schlussbestimmungen',
      body: [
        { type: 'p', text: '13.1. Diese AGB unterliegen der Rechtsordnung der Tschechischen Republik.' },
        {
          type: 'p',
          text: '13.2. Ist eine Bestimmung dieser AGB ungültig oder unwirksam, so berührt dies nicht die Gültigkeit und Wirksamkeit der übrigen Bestimmungen.',
        },
        {
          type: 'p',
          text: '13.3. Der Betreiber ist berechtigt, diese AGB zu ändern. Die neue Fassung der AGB ist ab dem Tag ihrer Veröffentlichung auf der Website wirksam, sofern nichts anderes angegeben ist.',
        },
        {
          type: 'p',
          text: '13.4. Diese AGB sind auf der Website https://clutchzone.club verfügbar.',
        },
      ],
    },
  ],
};
