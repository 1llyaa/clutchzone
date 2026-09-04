// Allgemeine Geschäftsbedingungen — deutsche Gefälligkeitsübersetzung des vom
// Betreiber gelieferten Dokuments.
//
// Verbindlich ist ausschließlich die tschechische Fassung in `terms.cs.ts`;
// diese Datei ist eine Übersetzung, die nur der Bequemlichkeit dient. Bei
// Abweichungen hat der tschechische Wortlaut Vorrang (siehe 14.7).
//
// Der tschechische Ausgangstext ist wortwörtlich aus dem Dokument des
// Betreibers übernommen. Einzige Ausnahme ist das Datum in 14.8, das der
// Betreiber von „3.9. 2027“ auf 03.09.2026 korrigiert hat — siehe den Hinweis
// in `terms.cs.ts`.
//
// Steht noch zur Prüfung durch den Betreiber aus — bislang weder vom Betreiber
// noch von einem Übersetzer freigegeben.
import type { LegalDocument } from './types';

export const TERMS_DE: LegalDocument = {
  version: '2026-09-03',
  eyebrow: '// RECHTLICHE HINWEISE',
  title: 'Allgemeine Geschäftsbedingungen',
  sections: [
    {
      id: 'uvodni-ustanoveni',
      title: '1. Einleitende Bestimmungen',
      body: [
        {
          type: 'p',
          text: '1.1. Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB“) regeln die Rechte und Pflichten zwischen Herrn Martin Mašek, einer natürlichen Person, die auf Grundlage einer Gewerbeberechtigung tätig ist, mit Sitz Václava Volfa 1337/37, 370 05 České Budějovice, Ident.-Nr.: 23095571, eingetragen im Gewerberegister, geführt vom Magistrat der Stadt České Budějovice (nachfolgend „Betreiber“), und dem Kunden bei der Reservierung und Nutzung der Dienstleistungen der Gaming-Center Clutch Zone.',
        },
        {
          type: 'p',
          text: '1.2. Diese AGB gelten insbesondere für die Nutzung von Gaming-PCs, Konsolen und Bootcamp-Zonen, die Teilnahme an Turnieren, die Nutzung des Kundenkontos, den Kauf von Spielstunden, Paketen, Vouchern, Erfrischungen und weiteren Zusatzleistungen, die in den Filialen von Clutch Zone erbracht werden (nachfolgend „Dienstleistungen“).',
        },
        {
          type: 'p',
          text: '1.3. Aktuelle Informationen zu Filialen, Preisen, Öffnungszeiten, Veranstaltungen, Reservierungen und verfügbaren Dienstleistungen finden Sie auf der Website https://clutchzone.club oder direkt in der jeweiligen Filiale.',
        },
        {
          type: 'p',
          text: '1.4. Mit der Nutzung der Dienstleistungen von Clutch Zone bestätigt der Kunde, dass er diese AGB, die Besuchsregeln und die Preisliste zur Kenntnis genommen hat.',
        },
        {
          type: 'p',
          text: '1.5. Bestimmungen, die bei einem konkreten Angebot, Paket, Turnier, Voucher oder einer Promo-Aktion angegeben sind, haben Vorrang vor den allgemeinen Bestimmungen dieser AGB.',
        },
        {
          type: 'p',
          text: '1.6. Verbraucher im Sinne dieser AGB ist jeder Mensch, der außerhalb seiner unternehmerischen Tätigkeit oder außerhalb der selbständigen Ausübung seines Berufs einen Vertrag mit dem Betreiber schließt oder anderweitig mit ihm handelt. Bestimmungen dieser AGB, die ausdrücklich Verbraucher betreffen, gelten für andere Kunden nicht.',
        },
      ],
    },
    {
      id: 'identifikace-provozovatele',
      title: '2. Identifikation des Betreibers und der Filialen',
      body: [
        { type: 'p', text: '2.1. Betreiber:' },
        {
          type: 'ul',
          items: [
            'Martin Mašek, natürliche Person, tätig auf Grundlage einer Gewerbeberechtigung',
            'Sitz: Václava Volfa 1337/37, 370 05 České Budějovice',
            'Ident.-Nr.: 23095571',
            'Eingetragen im Gewerberegister, geführt vom Magistrat der Stadt České Budějovice',
            'E-Mail: info@clutchzone.club',
            'Web: https://clutchzone.club',
          ],
        },
        { type: 'p', text: '2.2. Filiale České Budějovice:' },
        {
          type: 'ul',
          items: [
            'Clutch Zone',
            'Adresse: Krajinská 2381/17, České Budějovice',
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
          text: '3.1. Die Reservierung der Dienstleistungen erfolgt vorrangig über die Website des Betreibers, alternativ telefonisch, per E-Mail oder direkt in der Filiale.',
        },
        {
          type: 'p',
          text: '3.2. Das Reservierungssystem kann von einem Dritten bereitgestellt werden (insbesondere ggLeap / ggCircuit). Der Betreiber haftet nicht für kurzfristige Nichtverfügbarkeit oder technische Fehler des externen Systems, die er nicht verursacht hat.',
        },
        {
          type: 'p',
          text: '3.3. Eine Reservierung kann im Voraus über das Online-Zahlungsgateway auf der Website oder persönlich vor Ort im Gaming-Center vor Beginn der Leistungserbringung bezahlt werden.',
        },
        { type: 'p', text: '3.4. Stornierung der Reservierung durch den Kunden:' },
        {
          type: 'p',
          text: '3.4.1. Rechtzeitige Stornierung (mehr als 15 Minuten vorher): Der Kunde kann die Reservierung spätestens 15 Minuten vor dem geplanten Beginn kostenlos stornieren, insbesondere über den Link in der Bestätigungs-E-Mail. Der bezahlte Betrag wird dem Kunden in diesem Fall als Guthaben auf seinem Benutzerkonto im Reservierungssystem gutgeschrieben (bzw. auf die Zahlungskarte zurückerstattet, wenn er dies schriftlich verlangt).',
        },
        {
          type: 'p',
          text: '3.4.2. Verspätete Stornierung und Nichterscheinen (weniger als 15 Minuten vorher): Storniert der Kunde die Reservierung weniger als 15 Minuten vor deren Beginn oder erscheint er zur reservierten Zeit nicht, verfällt die Reservierung und der Betreiber ist berechtigt, 100 % des bezahlten Betrags als Stornogebühr für die Blockierung des Spielplatzes einzubehalten.',
        },
        {
          type: 'p',
          text: '3.5. Verspätung des Kunden: Der Kunde ist verpflichtet, zur reservierten Zeit zu erscheinen. Weiß der Kunde, dass er sich verspäten wird, ist er verpflichtet, den Betreiber vorab zu informieren (telefonisch oder per E-Mail). In diesem Fall kann die Reservierungszeit nach Absprache und je nach aktueller Auslastung verschoben werden. Meldet der Kunde die Verspätung nicht und erscheint er nicht innerhalb von 15 Minuten nach Beginn der Reservierung, kann sein Platz anderen Interessenten angeboten werden, ohne Anspruch auf Rückerstattung.',
        },
        {
          type: 'p',
          text: '3.6. Der Betreiber behält sich das Recht vor, eine Reservierung aus technischen, betrieblichen oder Sicherheitsgründen zu stornieren oder zu ändern. In diesem Fall wird dem Kunden ein Ersatztermin angeboten oder die Zahlung in voller Höhe erstattet.',
        },
        {
          type: 'p',
          text: '3.7. Die Reservierung eines Spielplatzes für ein bestimmtes Datum und eine bestimmte Uhrzeit ist ein Vertrag über die Nutzung von Freizeit zu einem festgelegten Termin. Dem Verbraucher steht dabei kein Recht zu, innerhalb von 14 Tagen vom Vertrag zurückzutreten; Näheres siehe Art. 12 dieser AGB.',
        },
      ],
    },
    {
      id: 'ceny-a-platebni-podminky',
      title: '4. Preise und Zahlungsbedingungen',
      body: [
        {
          type: 'p',
          text: '4.1. Die Preise der Dienstleistungen sind in der aktuellen Preisliste auf der Website, im Reservierungssystem oder direkt in der Filiale angegeben. Die Preise sind in tschechischen Kronen angegeben und verstehen sich inklusive Mehrwertsteuer, sofern diese nach den Rechtsvorschriften berechnet wird.',
        },
        {
          type: 'p',
          text: '4.2. Die Zahlung der Dienstleistungen erfolgt in der Regel in der Filiale bar, mit Zahlungskarte oder auf eine andere vom Betreiber zugelassene Weise, gegebenenfalls im Voraus online über das Zahlungsgateway.',
        },
        {
          type: 'p',
          text: '4.3. Spielen auf Schulden ist nicht gestattet. Der Kunde ist verpflichtet, die Dienstleistungen vor deren Nutzung oder nach Anweisung des Personals zu bezahlen.',
        },
        {
          type: 'p',
          text: '4.4. Der Betreiber nimmt keine beschädigten Banknoten oder Banknoten an, deren Echtheit nicht überprüft werden kann.',
        },
        {
          type: 'p',
          text: '4.5. Rabatte, Boni, Promo-Aktionen und andere Vorteile können nicht miteinander kombiniert werden, sofern beim konkreten Angebot nichts anderes angegeben ist.',
        },
        {
          type: 'p',
          text: '4.6. Der Betreiber stellt dem Kunden einen Steuerbeleg oder eine Quittung im Einklang mit den geltenden Rechtsvorschriften aus.',
        },
        {
          type: 'p',
          text: '4.7. Informiert der Betreiber über einen Preisnachlass für eine Dienstleistung oder Ware, gibt er zugleich den niedrigsten Preis an, zu dem er die betreffende Dienstleistung oder Ware in den 30 Tagen vor Gewährung des Nachlasses angeboten hat. Wurde die Dienstleistung oder Ware weniger als 30 Tage zuvor auf den Markt gebracht, gibt der Betreiber den niedrigsten Preis seit dem Zeitpunkt der Markteinführung an.',
        },
      ],
    },
    {
      id: 'herni-hodiny-balicky',
      title: '5. Spielstunden, Pakete, Boni und Gutscheine',
      body: [
        {
          type: 'p',
          text: '5.1. Die Gültigkeit gekaufter Stunden, Pakete, Dauerkarten, Voucher, Bonusstunden oder Promo-Stunden richtet sich nach den Bedingungen des konkreten Angebots, Tarifs oder der Promo-Aktion.',
        },
        {
          type: 'p',
          text: '5.2. Nicht genutzte Stunden verfallen nach Ablauf der Gültigkeitsdauer, sofern beim konkreten Angebot nichts anderes angegeben ist. Das Recht des Verbrauchers, gemäß Art. 12 dieser AGB vom Vertrag zurückzutreten, bleibt davon unberührt.',
        },
        {
          type: 'p',
          text: '5.3. Bonusstunden, Promo-Stunden und andere vergünstigte Guthaben, die unentgeltlich über den bezahlten Preis hinaus gewährt werden, sind nicht in Bargeld umtauschbar und können nicht ausgezahlt werden, sofern nicht ausdrücklich etwas anderes angegeben ist.',
        },
        {
          type: 'p',
          text: '5.4. Die Übertragung von Stunden, Paketen oder des Kundenkontos auf eine andere Person ist nur mit Zustimmung des Betreibers oder nach den Bedingungen des konkreten Angebots möglich.',
        },
        {
          type: 'p',
          text: '5.5. Gutscheine können in dem auf dem konkreten Gutschein oder bei dessen Kauf angegebenen Umfang eingelöst werden. Sofern auf dem konkreten Gutschein nichts anderes angegeben ist, beträgt die Gültigkeit eines Gutscheins 12 Monate ab dem Ausstellungsdatum.',
        },
        {
          type: 'p',
          text: '5.6. Nach Ablauf der Gültigkeit eines Gutscheins können weder dessen Verlängerung noch ein Umtausch in Bargeld oder eine andere Leistung verlangt werden, sofern der Betreiber und der Kunde nichts anderes vereinbaren. Das Recht des Verbrauchers, vom Vertrag über den Kauf eines Gutscheins innerhalb der Frist gemäß Art. 12 zurückzutreten, bleibt davon unberührt.',
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
          text: '6.2. Teilnahmebedingungen, Höhe des Startgelds, Turnierregeln, Art der Anmeldung, Möglichkeiten der Absage der Teilnahme sowie eine etwaige Rückerstattung des Startgelds sind stets beim konkreten Turnier bei der Anmeldung angegeben.',
        },
        {
          type: 'p',
          text: '6.3. Schließt der Kunde die Anmeldung zu einem Turnier ab, stimmt er den Regeln und Bedingungen des konkreten Turniers zu.',
        },
        {
          type: 'p',
          text: '6.4. Der Betreiber behält sich das Recht vor, ein Turnier aus organisatorischen, technischen oder Sicherheitsgründen abzusagen, zu verschieben oder dessen Format zu ändern. In diesem Fall werden die Kunden über das weitere Vorgehen informiert.',
        },
        {
          type: 'p',
          text: '6.5. Ein zu einem festgelegten Termin stattfindendes Turnier ist eine Freizeitveranstaltung im Sinne von Art. 12.2 dieser AGB; das Recht, innerhalb von 14 Tagen vom Vertrag zurückzutreten, gilt für die Turnieranmeldung nicht. Sagt der Betreiber das Turnier ab, wird das Startgeld in voller Höhe erstattet.',
        },
      ],
    },
    {
      id: 'pravidla-vyuzivani',
      title: '7. Regeln für die Nutzung der Dienstleistungen und Räumlichkeiten von Clutch Zone',
      body: [
        {
          type: 'p',
          text: '7.1. Der Kunde ist verpflichtet, die Besuchsregeln, die Anweisungen des Personals und die Regeln des anständigen Verhaltens einzuhalten.',
        },
        {
          type: 'p',
          text: '7.2. Der Kunde ist verpflichtet, sich gegenüber anderen Besuchern, dem Personal, der Ausstattung und den Räumlichkeiten des Centers rücksichtsvoll zu verhalten.',
        },
        {
          type: 'p',
          text: '7.3. Der Kunde darf keine verbotenen Programme, Cheats, Hacks, illegale Software oder sonstige nicht autorisierte Software installieren.',
        },
        {
          type: 'p',
          text: '7.4. Der Kunde darf ohne Zustimmung des Personals keine Kabel abziehen, keine Peripheriegeräte zwischen Arbeitsplätzen verschieben, keine technischen Einstellungen der Geräte ändern und auch sonst nicht in die Ausstattung eingreifen.',
        },
        {
          type: 'p',
          text: '7.5. Auf den Bildschirmen ist es verboten, beleidigende, diskriminierende, extremistische, pornografische oder anderweitig unangemessene Inhalte anzuzeigen.',
        },
        {
          type: 'p',
          text: '7.6. Technische Probleme, Mängel oder Beschädigungen der Ausstattung ist der Kunde verpflichtet, dem Personal unverzüglich zu melden.',
        },
        {
          type: 'p',
          text: '7.7. Das Personal ist berechtigt, die Sitzung zu beenden oder einen Besucher, der gegen die Regeln verstößt, des Hauses zu verweisen. Wiederholte oder schwerwiegende Regelverstöße können zu einer zeitweiligen Einschränkung oder einem Zutrittsverbot führen.',
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
          text: '8.2. Für ausgewählte Dienstleistungen, Veranstaltungen, Turniere oder Spiele kann eine andere Altersempfehlung oder -beschränkung festgelegt werden. Eine solche Regel ist beim konkreten Angebot, der Veranstaltung oder dem Turnier angegeben.',
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
          text: '9.1. In den Räumlichkeiten des Centers dürfen ausschließlich Speisen und Getränke konsumiert werden, die in der jeweiligen Filiale von Clutch Zone gekauft wurden. Der Verzehr eigener Speisen und Getränke ist nicht gestattet, sofern das Personal nichts anderes bestimmt.',
        },
        {
          type: 'p',
          text: '9.2. Alkoholische Getränke werden nur an Personen über 18 Jahren verkauft und ausgeschenkt. Das Personal ist berechtigt, den Kunden zur Vorlage eines Ausweises aufzufordern.',
        },
        {
          type: 'p',
          text: '9.3. Wird kein Ausweis vorgelegt oder bestehen Zweifel am Alter des Kunden, kann das Personal den Verkauf von Alkohol verweigern.',
        },
        {
          type: 'p',
          text: '9.4. An Personen, die offensichtlich unter dem Einfluss von Alkohol oder einer anderen Suchtsubstanz stehen, werden keine alkoholischen Getränke verkauft oder ausgeschenkt.',
        },
        {
          type: 'p',
          text: '9.5. Der Betreiber behält sich das Recht vor, einen Kunden nicht zu bedienen, dessen Verhalten die Sicherheit, die Ordnung, die Ausstattung oder den Komfort anderer Besucher gefährden kann.',
        },
      ],
    },
    {
      id: 'odpovednost-za-skodu',
      title: '10. Haftung für Schäden und persönliche Gegenstände',
      body: [
        {
          type: 'p',
          text: '10.1. Der Kunde haftet für Schäden, die er dem Betreiber, einem anderen Kunden oder einem Dritten vorsätzlich oder fahrlässig zufügt.',
        },
        {
          type: 'p',
          text: '10.2. Die vorsätzliche Beschädigung der Ausstattung, der Computer, Konsolen, Peripheriegeräte, Möbel oder Räumlichkeiten des Centers ist verboten. Der verursachte Schaden ist zu ersetzen.',
        },
        {
          type: 'p',
          text: '10.3. Der Betreiber haftet nicht für verlorene oder unbeaufsichtigt zurückgelassene persönliche Gegenstände der Kunden.',
        },
        {
          type: 'p',
          text: '10.4. Der Betreiber haftet nicht für Ausfälle, Einschränkungen oder Fehler, die durch Internetanbieter, Softwarelieferanten, Spieleplattformen, das externe Reservierungssystem, höhere Gewalt oder andere Umstände außerhalb der unmittelbaren Kontrolle des Betreibers verursacht werden. Die Haftung des Betreibers gegenüber dem Verbraucher für die ordnungsgemäße Erbringung der bezahlten Dienstleistung nach Art. 11 bleibt davon unberührt.',
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
          text: '11.1. Stellt der Kunde ein Problem mit der erbrachten Dienstleistung, einen technischen Mangel oder ein anderes Hindernis für die ordnungsgemäße Nutzung der Dienstleistung fest, ist er verpflichtet, dies dem Personal noch während des Besuchs unverzüglich zu melden.',
        },
        {
          type: 'p',
          text: '11.2. Ist die Reklamation berechtigt, kann der Betreiber dem Kunden eine angemessene Ersatzlösung anbieten, insbesondere eine Zeitverlängerung, den Wechsel an einen anderen Platz, einen Ersatztermin oder eine andere Form der Entschädigung.',
        },
        {
          type: 'p',
          text: '11.3. Eine Reklamation kann persönlich in der Filiale oder per E-Mail an info@clutchzone.club geltend gemacht werden.',
        },
        {
          type: 'p',
          text: '11.4. Der Betreiber stellt dem Verbraucher eine schriftliche Bestätigung darüber aus, wann er die Reklamation geltend gemacht hat, was deren Inhalt ist und welche Art der Erledigung er verlangt.',
        },
        {
          type: 'p',
          text: '11.5. Der Betreiber entscheidet über die Reklamation sofort, in komplizierten Fällen innerhalb von drei Werktagen. In diese Frist wird die je nach Art der Dienstleistung angemessene Zeit für eine fachliche Beurteilung des Mangels nicht eingerechnet. Die Reklamation einschließlich der Beseitigung des Mangels erledigt der Betreiber spätestens innerhalb von 30 Tagen ab dem Tag ihrer Geltendmachung, sofern mit dem Verbraucher keine längere Frist vereinbart wird. Der fruchtlose Ablauf dieser Frist gilt als wesentliche Vertragsverletzung.',
        },
        {
          type: 'p',
          text: '11.6. Nach Erledigung der Reklamation stellt der Betreiber dem Verbraucher eine Bestätigung über Datum und Art der Erledigung der Reklamation aus, gegebenenfalls eine schriftliche Begründung ihrer Ablehnung.',
        },
      ],
    },
    {
      // The credit-purchase confirmation e-mail links here (/terms#odstoupeni).
      id: 'odstoupeni',
      title: '12. Rücktritt von einem im Fernabsatz geschlossenen Vertrag',
      body: [
        {
          type: 'p',
          text: '12.1. Dieser Artikel gilt nur für Verbraucher, die mit dem Betreiber einen Vertrag im Fernabsatz geschlossen haben, also insbesondere über die Website oder das Reservierungssystem.',
        },
        {
          type: 'p',
          text: '12.2. Die Reservierung eines Spielplatzes, eines Spielgeräts, einer Bootcamp-Zone oder die Teilnahme an einem Turnier zu einem bestimmten Datum und einer bestimmten Uhrzeit ist ein Vertrag über die Nutzung von Freizeit, die der Betreiber zu einem festgelegten Termin erbringt. Nach § 1837 Buchst. j) des tschechischen Bürgerlichen Gesetzbuchs hat der Verbraucher daher kein Recht, innerhalb von 14 Tagen von einem solchen Vertrag zurückzutreten. Die Stornobedingungen richten sich nach Art. 3.4 dieser AGB.',
        },
        {
          type: 'p',
          text: '12.3. Beim Kauf von Spielstunden, Guthaben, Paketen, Dauerkarten und Gutscheinen, die nicht an ein bestimmtes Datum und eine bestimmte Uhrzeit der Leistungserbringung gebunden sind, hat der Verbraucher das Recht, innerhalb von 14 Tagen ab dem Tag des Vertragsschlusses ohne Angabe von Gründen vom Vertrag zurückzutreten.',
        },
        {
          type: 'p',
          text: '12.4. Für den Rücktritt vom Vertrag nach Art. 12.3 kann der Verbraucher nutzen:',
        },
        {
          type: 'ul',
          items: [
            'a) die Rücktritts-Schaltfläche, die in der Kaufbestätigungs-E-Mail und auf der Website des Betreibers verfügbar ist,',
            'b) das Muster-Widerrufsformular, das Anlage Nr. 1 dieser AGB bildet, oder',
            'c) jede andere eindeutige Erklärung, die an die E-Mail-Adresse oder an die Sitzadresse des Betreibers gesendet wird.',
          ],
        },
        {
          type: 'p',
          text: 'Die Rücktrittsfrist ist gewahrt, wenn der Verbraucher den Rücktritt spätestens am letzten Tag der Frist absendet.',
        },
        {
          type: 'p',
          text: '12.5. Der Betreiber bestätigt dem Verbraucher den Eingang des Rücktritts unverzüglich in Textform.',
        },
        {
          type: 'p',
          text: '12.6. Tritt der Verbraucher vom Vertrag zurück, erstattet ihm der Betreiber unverzüglich, spätestens innerhalb von 14 Tagen nach dem Rücktritt, alle Geldmittel, die er von ihm aufgrund des Vertrags erhalten hat, und zwar auf demselben Weg, auf dem er sie erhalten hat, sofern nichts anderes vereinbart wird.',
        },
        {
          type: 'p',
          text: '12.7. Hat der Verbraucher ausdrücklich verlangt, dass mit der Erbringung der Dienstleistung vor Ablauf der Rücktrittsfrist begonnen wird, und wurde die Dienstleistung bis zum Zeitpunkt des Rücktritts teilweise in Anspruch genommen, zahlt der Verbraucher dem Betreiber den anteiligen Preis, der dem Umfang der bereits erbrachten Leistung entspricht. Wurde die Dienstleistung in vollem Umfang erbracht, erlischt das Rücktrittsrecht nach § 1837 Buchst. a) des Bürgerlichen Gesetzbuchs.',
        },
        {
          type: 'p',
          text: '12.8. Als in Anspruch genommen im Sinne von Art. 12.7 gilt beim Kauf von Guthaben derjenige Teil des Guthabens, den der Verbraucher bereits zur Bezahlung einer konkreten Dienstleistung verwendet hat.',
        },
      ],
    },
    {
      id: 'ochrana-osobnich-udaju',
      title: '13. Schutz personenbezogener Daten',
      body: [
        {
          type: 'p',
          text: '13.1. Informationen über die Verarbeitung personenbezogener Daten der Kunden sind im gesonderten Dokument „Schutz personenbezogener Daten“ enthalten, das auf der Website des Betreibers verfügbar ist.',
        },
        {
          type: 'p',
          text: '13.2. Informationen zu Cookies und zu den Einwilligungseinstellungen sind im gesonderten Dokument „Cookie-Einstellungen“ enthalten, das auf der Website des Betreibers unter https://clutchzone.club/cookies verfügbar ist.',
        },
      ],
    },
    {
      id: 'zaverecna-ustanoveni',
      title: '14. Schlussbestimmungen',
      body: [
        { type: 'p', text: '14.1. Diese AGB unterliegen dem Recht der Tschechischen Republik.' },
        {
          type: 'p',
          text: '14.2. Ist eine Bestimmung dieser AGB unwirksam oder undurchführbar, berührt dies die Wirksamkeit der übrigen Bestimmungen nicht.',
        },
        {
          type: 'p',
          text: '14.3. Der Betreiber ist berechtigt, diese AGB zu ändern. Die neue Fassung der AGB wird mit dem Tag ihrer Veröffentlichung auf der Website wirksam, sofern nichts anderes angegeben ist. Für bereits geschlossene Verträge gilt die am Tag des Vertragsschlusses wirksame Fassung der AGB.',
        },
        {
          type: 'p',
          text: '14.4. Die Aufsicht über die Einhaltung der Pflichten nach dem Gesetz Nr. 634/1992 Slg., über den Verbraucherschutz, übt die Tschechische Handelsinspektion aus.',
        },
        {
          type: 'p',
          text: '14.5. Für die außergerichtliche Beilegung von Verbraucherstreitigkeiten aus einem zwischen dem Betreiber und einem Verbraucher geschlossenen Vertrag ist die Tschechische Handelsinspektion zuständig, mit Sitz Štěpánská 796/44, 110 00 Prag 1, Internetadresse: https://www.coi.cz. Der Verbraucher kann dieses Verfahren nutzen, wenn sich der Streit mit dem Betreiber nicht direkt lösen lässt. Das Recht, sich an ein Gericht zu wenden, bleibt davon unberührt.',
        },
        {
          type: 'p',
          text: '14.6. Diese AGB sind auf der Website https://clutchzone.club verfügbar',
        },
        {
          type: 'p',
          text: '14.7. Diese AGB werden in tschechischer, englischer, deutscher und ukrainischer Sprachfassung veröffentlicht. Bei Widersprüchen zwischen den Sprachfassungen ist die tschechische Fassung maßgeblich.',
        },
        { type: 'p', text: '14.8. Diese AGB treten am 03.09.2026 in Kraft.' },
      ],
    },
    {
      id: 'vzorovy-formular',
      title: 'Anlage Nr. 1 — Muster-Widerrufsformular',
      body: [
        {
          type: 'p',
          text: '(Füllen Sie dieses Formular aus und senden Sie es nur dann zurück, wenn Sie vom Vertrag zurücktreten möchten.)',
        },
        { type: 'p', text: 'Empfänger:' },
        {
          type: 'ul',
          items: [
            'Martin Mašek, Václava Volfa 1337/37, 370 05 České Budějovice, Ident.-Nr.: 23095571',
            'E-Mail: info@clutchzone.club',
          ],
        },
        {
          type: 'p',
          text: 'Hiermit teile ich mit, dass ich vom Vertrag über die Erbringung folgender Dienstleistungen / über den Kauf folgender Ware zurücktrete:',
        },
        {
          type: 'ul',
          items: [
            '……………………………………………………………………………………………………',
            'Bestelldatum / Erhaltsdatum: ……………………………………………………………',
            'Bestellnummer: ………………………………………………………………………………',
            'Vor- und Nachname des Verbrauchers: …………………………………………………………',
            'Anschrift des Verbrauchers: ……………………………………………………………………',
            'E-Mail des Verbrauchers: ……………………………………………………………………',
            'Konto- / Kartennummer für die Rückerstattung: …………………………………………………',
            'Unterschrift des Verbrauchers (nur bei Übersendung in Papierform): ……………………',
            'Datum: …………………………………………………',
          ],
        },
      ],
    },
  ],
};
