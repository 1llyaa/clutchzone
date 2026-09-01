// Ochrana osobních údajů — CS is the authoritative version and is reproduced
// here VERBATIM from the operator's supplied document.
//
// Do not "fix" this text. Anything believed to be wrong or missing belongs in
// docs/legal-review-notes.md for the operator's lawyer — not silently
// corrected here.
import type { LegalDocument } from './types';

export const PRIVACY_CS: LegalDocument = {
  version: '2026-08-30',
  eyebrow: '// PRÁVNÍ INFORMACE',
  title: 'Ochrana osobních údajů',
  sections: [
    {
      id: 'spravce',
      title: '1. Správce osobních údajů',
      body: [
        { type: 'p', text: 'Správcem osobních údajů je:' },
        {
          type: 'ul',
          items: [
            'Martin Mašek',
            'Sídlo: Václava Volfa 1337/37, 37005 České Budějovice',
            'IČO: 23095571',
            'Web: https://clutchzone.club',
          ],
        },
        { type: 'p', text: 'Kontakty poboček:' },
        {
          type: 'ul',
          items: [
            'Clutch Zone',
            'Krajinská 2381/17, 37001, České BUdějovice',
            'Telefon: +420 733 104 289',
            'E-mail: info@clutchzone.club',
          ],
        },
        {
          type: 'p',
          text: 'Tento dokument vysvětluje, jak Clutch Zone zpracovává osobní údaje zákazníků, návštěvníků webových stránek, účastníků turnajů a osob, které s námi komunikují.',
        },
      ],
    },
    {
      id: 'jake-udaje',
      title: '2. Jaké osobní údaje zpracováváme',
      body: [
        { type: 'p', text: 'Můžeme zpracovávat zejména tyto osobní údaje:' },
        {
          type: 'ul',
          items: [
            'identifikační údaje: jméno, příjmení, případně přezdívka nebo název týmu;',
            'kontaktní údaje: e-mail, telefon;',
            'údaje o rezervaci: pobočka, datum, čas, typ služby, zvolená herní zóna nebo místo;',
            'údaje o zákaznickém účtu: identifikátor účtu, historie využití služeb, zakoupené hodiny, balíčky, bonusy a vouchery;',
            'údaje o platbách a nákupech: informace nutné pro evidenci plateb, účtenek, faktur a účetních dokladů;',
            'údaje k turnajům a akcím: registrace, tým, výsledky, herní přezdívka, komunikace k turnaji;',
            'údaje z komunikace: obsah zpráv, dotazů, reklamací nebo požadavků zákazníka;',
            'marketingové údaje: souhlas se zasíláním obchodních sdělení, preference komunikace, reakce na kampaně;',
            'technické údaje z webu: IP adresa, typ zařízení, prohlížeč, cookies a obdobné technologie podle nastavení cookies.',
          ],
        },
        {
          type: 'p',
          text: 'Pokud je v pobočce používán kamerový systém, je příslušný prostor označen samostatnou informací. Kamerové záznamy mohou být zpracovávány zejména z důvodu ochrany osob, majetku a bezpečnosti provozu.',
        },
      ],
    },
    {
      id: 'proc-zpracovavame',
      title: '3. Proč osobní údaje zpracováváme',
      body: [
        { type: 'p', text: 'Osobní údaje zpracováváme zejména pro tyto účely:' },
        {
          type: 'ul',
          items: [
            'vytvoření a správa rezervace;',
            'poskytování služeb Clutch Zone;',
            'správa zákaznického účtu, herních hodin, balíčků, bonusů a voucherů;',
            'registrace a organizace turnajů a akcí;',
            'komunikace se zákazníkem;',
            'vyřizování dotazů, stížností a reklamací;',
            'plnění účetních, daňových a jiných právních povinností;',
            'ochrana práv, majetku a bezpečnosti provozovatele, zákazníků a personálu;',
            'zlepšování služeb a provozu poboček;',
            'zasílání obchodních sdělení a marketingová komunikace, pokud k tomu máme právní důvod nebo souhlas;',
            'analýza návštěvnosti webu a marketingové měření podle nastavení cookies.',
          ],
        },
      ],
    },
    {
      id: 'pravni-zaklady',
      title: '4. Právní základy zpracování',
      body: [
        { type: 'p', text: 'Osobní údaje zpracováváme na základě těchto právních důvodů:' },
        {
          type: 'ul',
          items: [
            'plnění smlouvy nebo provedení opatření před uzavřením smlouvy;',
            'plnění právních povinností, zejména v oblasti účetnictví a daní;',
            'oprávněný zájem provozovatele, zejména ochrana majetku, bezpečnost provozu, vyřizování reklamací a zlepšování služeb;',
            'souhlas zákazníka, zejména u některých marketingových aktivit a vybraných cookies.',
          ],
        },
        {
          type: 'p',
          text: 'Pokud je zpracování založeno na souhlasu, může zákazník svůj souhlas kdykoliv odvolat. Odvolání souhlasu nemá vliv na zákonnost zpracování před jeho odvoláním.',
        },
      ],
    },
    {
      id: 'prijemci',
      title: '5. Komu můžeme údaje předávat',
      body: [
        {
          type: 'p',
          text: 'Osobní údaje mohou být zpřístupněny pouze v nezbytném rozsahu těmto kategoriím příjemců:',
        },
        {
          type: 'ul',
          items: [
            'poskytovatelům rezervačního nebo zákaznického systému, například ggLeap / ggCircuit nebo obdobným službám;',
            'poskytovatelům IT, hostingu, správy webu a technické podpory;',
            'poskytovatelům platebních, pokladních a účetních systémů;',
            'účetním, daňovým a právním poradcům;',
            'poskytovatelům e-mailingových, SMS nebo marketingových nástrojů;',
            'poskytovatelům analytických a reklamních nástrojů, pokud jsou používány a pokud k tomu existuje právní důvod;',
            'orgánům veřejné moci, pokud to vyžadují právní předpisy.',
          ],
        },
        { type: 'p', text: 'Osobní údaje neprodáváme třetím osobám.' },
      ],
    },
    {
      id: 'doba-uchovani',
      title: '6. Doba uchování osobních údajů',
      body: [
        {
          type: 'p',
          text: 'Osobní údaje uchováváme pouze po dobu nezbytnou pro účel, pro který byly získány, nebo po dobu stanovenou právními předpisy.',
        },
        { type: 'p', text: 'Obecně platí:' },
        {
          type: 'ul',
          items: [
            'údaje související s rezervacemi a zákaznickým účtem uchováváme po dobu trvání zákaznického vztahu a následně po dobu nezbytnou k ochraně práv provozovatele;',
            'účetní a daňové doklady uchováváme po dobu stanovenou právními předpisy;',
            'údaje z komunikace uchováváme po dobu potřebnou k vyřízení požadavku a následně po dobu nezbytnou k ochraně práv provozovatele;',
            'marketingové údaje zpracováváme do odvolání souhlasu nebo do doby, kdy již nejsou potřebné;',
            'cookies jsou uchovávány podle nastavení jednotlivých cookies a souhlasů.',
          ],
        },
      ],
    },
    {
      id: 'prava',
      title: '7. Práva subjektu údajů',
      body: [
        {
          type: 'p',
          text: 'Zákazník má v souvislosti se zpracováním osobních údajů tato práva:',
        },
        {
          type: 'ul',
          items: [
            'právo na přístup k osobním údajům;',
            'právo na opravu nepřesných nebo neúplných údajů;',
            'právo na výmaz osobních údajů, pokud jsou splněny zákonné podmínky;',
            'právo na omezení zpracování;',
            'právo vznést námitku proti zpracování založenému na oprávněném zájmu;',
            'právo na přenositelnost údajů, pokud je zpracování založeno na souhlasu nebo smlouvě a probíhá automatizovaně;',
            'právo odvolat souhlas;',
            'právo podat stížnost u Úřadu pro ochranu osobních údajů.',
          ],
        },
        {
          type: 'ul',
          items: [
            'Úřad pro ochranu osobních údajů',
            'Pplk. Sochora 27, 170 00 Praha 7',
            'Web: https://uoou.gov.cz',
          ],
        },
      ],
    },
    {
      id: 'obchodni-sdeleni',
      title: '8. Obchodní sdělení',
      body: [
        {
          type: 'p',
          text: 'Obchodní sdělení zasíláme pouze v souladu s platnými právními předpisy. Zákazník se může z odběru obchodních sdělení kdykoliv odhlásit prostřednictvím odkazu v e-mailu nebo kontaktováním příslušné pobočky.',
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
          text: 'Informace o používání cookies jsou uvedeny v samostatném dokumentu „Nastavení cookies“.',
        },
      ],
    },
    {
      id: 'zmeny',
      title: '10. Změny tohoto dokumentu',
      body: [
        {
          type: 'p',
          text: 'Tento dokument můžeme průběžně aktualizovat. Aktuální znění je vždy dostupné na webových stránkách https://clutchzone.club',
        },
      ],
    },
  ],
};
