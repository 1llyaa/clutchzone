// Všeobecné obchodní podmínky — CS is the authoritative, binding version and
// is reproduced here VERBATIM from the operator's supplied document.
//
// Do not "fix" this text. Wording, numbering, addresses and contact details are
// reproduced exactly as supplied. Anything believed to be wrong or missing
// belongs in the operator's separate legal review notes, kept outside this repo
// for them to forward to their lawyer — not silently corrected here.
//
// The single exception: 14.8 as supplied read "3.9. 2027", a year after
// publication. The operator confirmed on 4. 9. 2026 that this was a typo and
// asked for 03.09.2026. That is the only edit to the supplied wording.
import type { LegalDocument } from './types';

export const TERMS_CS: LegalDocument = {
  version: '2026-09-03',
  eyebrow: '// PRÁVNÍ INFORMACE',
  title: 'Všeobecné obchodní podmínky',
  sections: [
    {
      id: 'uvodni-ustanoveni',
      title: '1. Úvodní ustanovení',
      body: [
        {
          type: 'p',
          text: '1.1. Tyto všeobecné obchodní podmínky (dále jen „VOP“) upravují práva a povinnosti mezi panem Martinem Maškem, fyzickou osobou podnikající na základě živnostenského oprávnění, se sídlem Václava Volfa 1337/37, 370 05 České Budějovice, IČO: 23095571, zapsaným v živnostenském rejstříku vedeném Magistrátem města České Budějovice (dále jen „provozovatel“), a zákazníkem při rezervaci a využívání služeb herních center Clutch Zone.',
        },
        {
          type: 'p',
          text: '1.2. Tyto VOP se vztahují zejména na využívání herních počítačů, konzolí, bootcamp zón, účast na turnajích, využití zákaznického účtu, nákup herních hodin, balíčků, voucherů, občerstvení a dalších doplňkových služeb poskytovaných v pobočkách Clutch Zone (dále jen „služby“).',
        },
        {
          type: 'p',
          text: '1.3. Aktuální informace o pobočkách, cenách, otevírací době, akcích, rezervacích a dostupných službách jsou uvedeny na webových stránkách https://clutchzone.club nebo přímo v konkrétní pobočce.',
        },
        {
          type: 'p',
          text: '1.4. Použitím služeb Clutch Zone zákazník potvrzuje, že se seznámil s těmito VOP, pravidly návštěvy a ceníkem služeb.',
        },
        {
          type: 'p',
          text: '1.5. Ujednání uvedená u konkrétní nabídky, balíčku, turnaje, voucheru nebo promo akce mají přednost před obecnými ustanoveními těchto VOP.',
        },
        {
          type: 'p',
          text: '1.6. Spotřebitelem se pro účely těchto VOP rozumí každý člověk, který mimo rámec své podnikatelské činnosti nebo mimo rámec samostatného výkonu svého povolání uzavírá smlouvu s provozovatelem nebo s ním jinak jedná. Ustanovení těchto VOP, která se výslovně týkají spotřebitele, se na ostatní zákazníky nepoužijí.',
        },
      ],
    },
    {
      id: 'identifikace-provozovatele',
      title: '2. Identifikace provozovatele a poboček',
      body: [
        { type: 'p', text: '2.1. Provozovatel:' },
        {
          type: 'ul',
          items: [
            'Martin Mašek, fyzická osoba podnikající na základě živnostenského oprávnění',
            'Sídlo: Václava Volfa 1337/37, 370 05 České Budějovice',
            'IČO: 23095571',
            'Zapsán v živnostenském rejstříku vedeném Magistrátem města České Budějovice',
            'E-mail: info@clutchzone.club',
            'Web: https://clutchzone.club',
          ],
        },
        { type: 'p', text: '2.2. Pobočka České Budějovice:' },
        {
          type: 'ul',
          items: [
            'Clutch Zone',
            'Adresa: Krajinská 2381/17, České Budějovice',
            'Telefon: +420 733 104 289',
            'E-mail: info@clutchzone.club',
          ],
        },
      ],
    },
    {
      id: 'rezervace-a-storno',
      title: '3. Rezervace a storno podmínky',
      body: [
        {
          type: 'p',
          text: '3.1. Rezervace služeb probíhá především prostřednictvím webových stránek provozovatele, případně telefonicky, e-mailem nebo přímo na pobočce.',
        },
        {
          type: 'p',
          text: '3.2. Rezervační systém může být poskytován třetí stranou (zejména systémem ggLeap / ggCircuit). Provozovatel neodpovídá za krátkodobou nedostupnost nebo technické chyby externího systému, pokud je nezpůsobil.',
        },
        {
          type: 'p',
          text: '3.3. Rezervaci je možné uhradit předem přes online platební bránu na webových stránkách, nebo osobně na místě v herně před zahájením poskytování služby.',
        },
        { type: 'p', text: '3.4. Zrušení rezervace zákazníkem:' },
        {
          type: 'p',
          text: '3.4.1. Včasné zrušení (více než 15 minut předem): Zákazník může rezervaci bezplatně zrušit nejpozději 15 minut před jejím plánovaným začátkem, a to zejména prostřednictvím odkazu v potvrzovacím e-mailu. Uhrazená částka je v takovém případě zákazníkovi vrácena ve formě kreditu do jeho uživatelského účtu v rezervačním systému (případně zpět na platební kartu, pokud o to písemně požádá).',
        },
        {
          type: 'p',
          text: '3.4.2. Pozdní zrušení a nedostavení se (méně než 15 minut předem): Pokud zákazník zruší rezervaci méně než 15 minut před jejím začátkem nebo se v čase rezervace nedostaví, rezervace propadá a provozovatel je oprávněn ponechat si 100 % uhrazené částky jako storno poplatek za blokaci herního místa.',
        },
        {
          type: 'p',
          text: '3.5. Zpoždění zákazníka: Zákazník je povinen dostavit se na rezervovaný čas. Pokud zákazník ví, že se zpozdí, je povinen o tom provozovatele předem informovat (telefonicky či e-mailem). V takovém případě je po dohodě a s ohledem na aktuální obsazenost možné čas rezervace posunout. Pokud zákazník zpoždění neohlásí a nedostaví se do 15 minut od začátku rezervace, může být jeho stanoviště nabídnuto jiným zájemcům bez nároku na vrácení platby.',
        },
        {
          type: 'p',
          text: '3.6. Provozovatel si vyhrazuje právo rezervaci zrušit nebo změnit z technických, provozních nebo bezpečnostních důvodů. V takovém případě bude zákazníkovi nabídnut náhradní termín nebo vrácena platba v plné výši.',
        },
        {
          type: 'p',
          text: '3.7. Rezervace herního místa na konkrétní datum a čas je smlouvou o využití volného času poskytovaném v určeném termínu. Spotřebiteli u ní nevzniká právo odstoupit od smlouvy ve lhůtě 14 dnů; blíže viz čl. 12 těchto VOP.',
        },
      ],
    },
    {
      id: 'ceny-a-platebni-podminky',
      title: '4. Ceny a platební podmínky',
      body: [
        {
          type: 'p',
          text: '4.1. Ceny služeb jsou uvedeny v aktuálním ceníku na webových stránkách, v rezervačním systému nebo přímo v pobočce. Ceny jsou uvedeny v českých korunách a včetně DPH, je-li DPH podle právních předpisů účtována.',
        },
        {
          type: 'p',
          text: '4.2. Platba za služby probíhá zpravidla na pobočce v hotovosti, platební kartou nebo jiným způsobem povoleným provozovatelem, případně předem online prostřednictvím platební brány.',
        },
        {
          type: 'p',
          text: '4.3. Hraní na dluh není povoleno. Zákazník je povinen uhradit služby před jejich využitím nebo podle pokynů personálu.',
        },
        {
          type: 'p',
          text: '4.4. Provozovatel nepřijímá poškozené bankovky nebo bankovky, u kterých nelze ověřit jejich pravost.',
        },
        {
          type: 'p',
          text: '4.5. Slevy, bonusy, promo akce a jiné výhody nelze vzájemně kombinovat, pokud není u konkrétní nabídky uvedeno jinak.',
        },
        {
          type: 'p',
          text: '4.6. Provozovatel vystaví zákazníkovi daňový doklad nebo účtenku v souladu s platnými právními předpisy.',
        },
        {
          type: 'p',
          text: '4.7. Informuje-li provozovatel o slevě z ceny služby nebo zboží, uvede zároveň nejnižší cenu, za kterou danou službu nebo zboží nabízel v době 30 dnů před poskytnutím slevy. Byla-li služba nebo zboží uvedeno na trh v době kratší než 30 dnů, uvede provozovatel nejnižší cenu od okamžiku uvedení na trh.',
        },
      ],
    },
    {
      id: 'herni-hodiny-balicky',
      title: '5. Herní hodiny, balíčky, bonusy a dárkové poukazy',
      body: [
        {
          type: 'p',
          text: '5.1. Platnost zakoupených hodin, balíčků, permanentek, voucherů, bonusových hodin nebo promo hodin se řídí podmínkami konkrétní nabídky, tarifu nebo promo akce.',
        },
        {
          type: 'p',
          text: '5.2. Nevyužité hodiny po uplynutí doby platnosti propadají, pokud není u konkrétní nabídky uvedeno jinak. Tímto ustanovením není dotčeno právo spotřebitele odstoupit od smlouvy podle čl. 12 těchto VOP.',
        },
        {
          type: 'p',
          text: '5.3. Bonusové hodiny, promo hodiny a jiné zvýhodněné kredity poskytnuté bezúplatně nad rámec zaplacené ceny nejsou směnitelné za hotovost a nelze je vyplatit zpět, není-li výslovně uvedeno jinak.',
        },
        {
          type: 'p',
          text: '5.4. Převod hodin, balíčků nebo zákaznického účtu na jinou osobu je možný pouze se souhlasem provozovatele nebo podle podmínek konkrétní nabídky.',
        },
        {
          type: 'p',
          text: '5.5. Dárkové poukazy lze využít v rozsahu uvedeném na konkrétním poukazu nebo při jeho zakoupení. Není-li u konkrétního poukazu uvedeno jinak, je platnost dárkového poukazu 12 měsíců od data jeho vystavení.',
        },
        {
          type: 'p',
          text: '5.6. Po uplynutí platnosti dárkového poukazu nelze požadovat jeho prodloužení, výměnu za hotovost ani jiné plnění, pokud se provozovatel se zákazníkem nedohodne jinak. Právo spotřebitele odstoupit od smlouvy o koupi dárkového poukazu ve lhůtě podle čl. 12 tím není dotčeno.',
        },
      ],
    },
    {
      id: 'turnaje-a-akce',
      title: '6. Turnaje a akce',
      body: [
        {
          type: 'p',
          text: '6.1. Účast na turnajích je zpoplatněna, není-li u konkrétního turnaje uvedeno jinak.',
        },
        {
          type: 'p',
          text: '6.2. Podmínky účasti, výše startovného, pravidla turnaje, způsob registrace, možnosti zrušení účasti a případné vrácení startovného jsou vždy uvedeny u konkrétního turnaje při registraci.',
        },
        {
          type: 'p',
          text: '6.3. Pokud zákazník dokončí registraci na turnaj, souhlasí s pravidly a podmínkami konkrétního turnaje.',
        },
        {
          type: 'p',
          text: '6.4. Provozovatel si vyhrazuje právo turnaj zrušit, přesunout nebo změnit jeho formát z organizačních, technických nebo bezpečnostních důvodů. V takovém případě budou zákazníci informováni o dalším postupu.',
        },
        {
          type: 'p',
          text: '6.5. Turnaj konaný v určeném termínu je akcí volného času ve smyslu čl. 12.2 těchto VOP; právo odstoupit od smlouvy ve lhůtě 14 dnů se na přihlášku na turnaj neuplatní. Zruší-li turnaj provozovatel, vrací se startovné v plné výši.',
        },
      ],
    },
    {
      id: 'pravidla-vyuzivani',
      title: '7. Pravidla využívání služeb a prostor Clutch Zone',
      body: [
        {
          type: 'p',
          text: '7.1. Zákazník je povinen dodržovat pravidla návštěvy, pokyny personálu a pravidla slušného chování.',
        },
        {
          type: 'p',
          text: '7.2. Zákazník je povinen chovat se ohleduplně k ostatním návštěvníkům, personálu, vybavení a prostorám centra.',
        },
        {
          type: 'p',
          text: '7.3. Zákazník nesmí instalovat zakázané programy, cheaty, hacky, nelegální software nebo jiný neautorizovaný software.',
        },
        {
          type: 'p',
          text: '7.4. Zákazník nesmí odpojovat kabely, přesouvat periferní zařízení mezi pracovními místy, měnit technické nastavení zařízení nebo jinak zasahovat do vybavení bez souhlasu personálu.',
        },
        {
          type: 'p',
          text: '7.5. Na obrazovkách je zakázáno zobrazovat urážlivý, diskriminační, extremistický, pornografický nebo jinak nevhodný obsah.',
        },
        {
          type: 'p',
          text: '7.6. Technické problémy, závady nebo poškození vybavení je zákazník povinen neprodleně oznámit personálu.',
        },
        {
          type: 'p',
          text: '7.7. Personál je oprávněn ukončit relaci nebo vykázat návštěvníka, který porušuje pravidla. Opakované nebo závažné porušení pravidel může vést k dočasnému omezení nebo zákazu vstupu.',
        },
      ],
    },
    {
      id: 'deti-a-nezletili',
      title: '8. Děti a nezletilí návštěvníci',
      body: [
        {
          type: 'p',
          text: '8.1. Děti mladší 12 let mohou služby Clutch Zone využívat pouze v doprovodu osoby starší 18 let.',
        },
        {
          type: 'p',
          text: '8.2. Pro vybrané služby, akce, turnaje nebo hry může být stanoveno jiné věkové doporučení nebo omezení. Takové pravidlo je uvedeno u konkrétní nabídky, akce nebo turnaje.',
        },
        {
          type: 'p',
          text: '8.3. Za výběr her a vhodnost obsahu pro nezletilého zákazníka odpovídá jeho zákonný zástupce nebo doprovázející dospělá osoba.',
        },
      ],
    },
    {
      id: 'obcerstveni-a-alkohol',
      title: '9. Občerstvení a alkohol',
      body: [
        {
          type: 'p',
          text: '9.1. V prostorách centra je povoleno konzumovat pouze jídlo a nápoje zakoupené v dané pobočce Clutch Zone. Konzumace vlastního jídla a nápojů není povolena, pokud personál neurčí jinak.',
        },
        {
          type: 'p',
          text: '9.2. Alkoholické nápoje jsou prodávány a podávány pouze osobám starším 18 let. Personál je oprávněn požádat zákazníka o předložení dokladu totožnosti.',
        },
        {
          type: 'p',
          text: '9.3. V případě nepředložení dokladu totožnosti nebo pochybnosti o věku zákazníka může personál prodej alkoholu odmítnout.',
        },
        {
          type: 'p',
          text: '9.4. Alkoholické nápoje nebudou prodány ani podány osobě zjevně ovlivněné alkoholem nebo jinou návykovou látkou.',
        },
        {
          type: 'p',
          text: '9.5. Provozovatel si vyhrazuje právo odmítnout obsloužení zákazníka, jehož chování může ohrozit bezpečnost, pořádek, vybavení nebo komfort ostatních návštěvníků.',
        },
      ],
    },
    {
      id: 'odpovednost-za-skodu',
      title: '10. Odpovědnost za škodu a osobní věci',
      body: [
        {
          type: 'p',
          text: '10.1. Zákazník odpovídá za škodu, kterou způsobí provozovateli, jinému zákazníkovi nebo třetí osobě úmyslně nebo z nedbalosti.',
        },
        {
          type: 'p',
          text: '10.2. Úmyslné poškození vybavení, počítačů, konzolí, periferií, nábytku nebo prostor centra je zakázáno. Způsobená škoda musí být nahrazena.',
        },
        {
          type: 'p',
          text: '10.3. Provozovatel nenese odpovědnost za ztracené nebo bez dozoru ponechané osobní věci zákazníků.',
        },
        {
          type: 'p',
          text: '10.4. Provozovatel neodpovídá za výpadky, omezení nebo chyby způsobené poskytovateli internetu, dodavateli software, herními platformami, externím rezervačním systémem, vyšší mocí nebo jinými okolnostmi mimo přímou kontrolu provozovatele. Tím není dotčena odpovědnost provozovatele za řádné poskytnutí zaplacené služby vůči spotřebiteli podle čl. 11.',
        },
      ],
    },
    {
      // Footer "Reklamační řád" links to /terms#reklamace — keep this id.
      id: 'reklamace',
      title: '11. Reklamace služeb',
      body: [
        {
          type: 'p',
          text: '11.1. Pokud zákazník zjistí problém s poskytovanou službou, technickou závadu nebo jinou překážku bránící řádnému využití služby, je povinen ji neprodleně oznámit personálu během návštěvy.',
        },
        {
          type: 'p',
          text: '11.2. Pokud je reklamace oprávněná, provozovatel může zákazníkovi nabídnout přiměřené náhradní řešení, zejména prodloužení času, přesun na jiné místo, náhradní termín nebo jinou formu kompenzace.',
        },
        {
          type: 'p',
          text: '11.3. Reklamaci lze uplatnit osobně na pobočce nebo e-mailem na adresu info@clutchzone.club.',
        },
        {
          type: 'p',
          text: '11.4. Provozovatel vydá spotřebiteli písemné potvrzení o tom, kdy reklamaci uplatnil, co je jejím obsahem a jaký způsob vyřízení požaduje.',
        },
        {
          type: 'p',
          text: '11.5. Provozovatel rozhodne o reklamaci ihned, ve složitých případech do tří pracovních dnů. Do této lhůty se nezapočítává doba přiměřená podle druhu služby potřebná k odbornému posouzení vady. Reklamaci včetně odstranění vady provozovatel vyřídí nejpozději do 30 dnů ode dne jejího uplatnění, pokud se se spotřebitelem nedohodne na delší lhůtě. Marné uplynutí této lhůty se považuje za podstatné porušení smlouvy.',
        },
        {
          type: 'p',
          text: '11.6. Po vyřízení reklamace vydá provozovatel spotřebiteli potvrzení o datu a způsobu vyřízení reklamace, případně písemné odůvodnění jejího zamítnutí.',
        },
      ],
    },
    {
      // The credit-purchase confirmation e-mail links here (/terms#odstoupeni).
      id: 'odstoupeni',
      title: '12. Odstoupení od smlouvy uzavřené na dálku',
      body: [
        {
          type: 'p',
          text: '12.1. Tento článek se vztahuje pouze na spotřebitele, který uzavřel smlouvu s provozovatelem distančním způsobem, tedy zejména prostřednictvím webových stránek nebo rezervačního systému.',
        },
        {
          type: 'p',
          text: '12.2. Rezervace herního místa, herního zařízení, bootcamp zóny nebo účast na turnaji na konkrétní datum a čas je smlouvou o využití volného času, kterou provozovatel poskytuje v určeném termínu. Podle § 1837 písm. j) občanského zákoníku proto spotřebitel nemá právo od takové smlouvy odstoupit ve lhůtě 14 dnů. Storno podmínky se řídí čl. 3.4 těchto VOP.',
        },
        {
          type: 'p',
          text: '12.3. U nákupu herních hodin, kreditu, balíčků, permanentek a dárkových poukazů, které nejsou vázány na konkrétní datum a čas poskytnutí služby, má spotřebitel právo odstoupit od smlouvy bez udání důvodu ve lhůtě 14 dnů ode dne uzavření smlouvy.',
        },
        {
          type: 'p',
          text: '12.4. Pro odstoupení od smlouvy podle čl. 12.3 může spotřebitel využít:',
        },
        {
          type: 'ul',
          items: [
            'a) tlačítko pro odstoupení od smlouvy dostupné v potvrzovacím e-mailu o nákupu a na webových stránkách provozovatele,',
            'b) vzorový formulář pro odstoupení od smlouvy, který tvoří přílohu č. 1 těchto VOP, nebo',
            'c) jakékoli jiné jednoznačné prohlášení zaslané na e-mailovou adresu nebo na adresu sídla provozovatele.',
          ],
        },
        {
          type: 'p',
          text: 'Lhůta pro odstoupení je zachována, pokud spotřebitel odešle odstoupení nejpozději poslední den lhůty.',
        },
        {
          type: 'p',
          text: '12.5. Provozovatel potvrdí spotřebiteli přijetí odstoupení bez zbytečného odkladu v textové podobě.',
        },
        {
          type: 'p',
          text: '12.6. Odstoupí-li spotřebitel od smlouvy, vrátí mu provozovatel bez zbytečného odkladu, nejpozději do 14 dnů od odstoupení, všechny peněžní prostředky, které od něj na základě smlouvy přijal, a to stejným způsobem, jakým je přijal, nedohodnou-li se jinak.',
        },
        {
          type: 'p',
          text: '12.7. Požádal-li spotřebitel výslovně o zahájení poskytování služby před uplynutím lhůty pro odstoupení a byla-li služba do okamžiku odstoupení zčásti čerpána, uhradí spotřebitel provozovateli poměrnou část ceny odpovídající rozsahu již poskytnutého plnění. Byla-li služba poskytnuta v plném rozsahu, právo na odstoupení podle § 1837 písm. a) občanského zákoníku zaniká.',
        },
        {
          type: 'p',
          text: '12.8. Nákupem kreditu se pro účely čl. 12.7 rozumí čerpáním kredit, který již byl spotřebitelem využit k úhradě konkrétní služby.',
        },
      ],
    },
    {
      id: 'ochrana-osobnich-udaju',
      title: '13. Ochrana osobních údajů',
      body: [
        {
          type: 'p',
          text: '13.1. Informace o zpracování osobních údajů zákazníků jsou uvedeny v samostatném dokumentu „Ochrana osobních údajů“ dostupném na webových stránkách provozovatele.',
        },
        {
          type: 'p',
          text: '13.2. Informace o cookies a o nastavení souhlasu jsou uvedeny v samostatném dokumentu „Nastavení cookies“ dostupném na webových stránkách provozovatele na adrese https://clutchzone.club/cookies.',
        },
      ],
    },
    {
      id: 'zaverecna-ustanoveni',
      title: '14. Závěrečná ustanovení',
      body: [
        { type: 'p', text: '14.1. Tyto VOP se řídí právním řádem České republiky.' },
        {
          type: 'p',
          text: '14.2. Pokud je některé ustanovení těchto VOP neplatné nebo neúčinné, nemá to vliv na platnost a účinnost ostatních ustanovení.',
        },
        {
          type: 'p',
          text: '14.3. Provozovatel je oprávněn tyto VOP měnit. Nové znění VOP je účinné ode dne jeho zveřejnění na webových stránkách, pokud není uvedeno jinak. Pro již uzavřené smlouvy platí znění VOP účinné v den uzavření smlouvy.',
        },
        {
          type: 'p',
          text: '14.4. Dozor nad dodržováním povinností podle zákona č. 634/1992 Sb., o ochraně spotřebitele, vykonává Česká obchodní inspekce.',
        },
        {
          type: 'p',
          text: '14.5. K mimosoudnímu řešení spotřebitelských sporů ze smlouvy uzavřené mezi provozovatelem a spotřebitelem je příslušná Česká obchodní inspekce, se sídlem Štěpánská 796/44, 110 00 Praha 1, internetová adresa: https://www.coi.cz. Spotřebitel může tento postup využít v případě, že se s provozovatelem nepodaří vyřešit spor přímo. Právo obrátit se na soud tím není dotčeno.',
        },
        {
          type: 'p',
          text: '14.6. Tyto VOP jsou dostupné na webových stránkách https://clutchzone.club',
        },
        {
          type: 'p',
          text: '14.7. Tyto VOP jsou zveřejněny v české, anglické, německé a ukrajinské jazykové verzi. V případě rozporu mezi jazykovými verzemi je rozhodující česká verze.',
        },
        { type: 'p', text: '14.8. Tyto VOP nabývají účinnosti dne 03.09.2026.' },
      ],
    },
    {
      id: 'vzorovy-formular',
      title: 'Příloha č. 1 — Vzorový formulář pro odstoupení od smlouvy',
      body: [
        {
          type: 'p',
          text: '(Vyplňte tento formulář a odešlete jej zpět pouze v případě, že chcete odstoupit od smlouvy.)',
        },
        { type: 'p', text: 'Adresát:' },
        {
          type: 'ul',
          items: [
            'Martin Mašek, Václava Volfa 1337/37, 370 05 České Budějovice, IČO: 23095571',
            'E-mail: info@clutchzone.club',
          ],
        },
        {
          type: 'p',
          text: 'Oznamuji, že tímto odstupuji od smlouvy o poskytnutí těchto služeb / o koupi tohoto zboží:',
        },
        {
          type: 'ul',
          items: [
            '……………………………………………………………………………………………………',
            'Datum objednání / datum obdržení: ……………………………………………………………',
            'Číslo objednávky: ………………………………………………………………………………',
            'Jméno a příjmení spotřebitele: …………………………………………………………………',
            'Adresa spotřebitele: ……………………………………………………………………………',
            'E-mail spotřebitele: ……………………………………………………………………………',
            'Číslo účtu / karty pro vrácení platby: …………………………………………………………',
            'Podpis spotřebitele (pouze pokud je formulář zasílán v listinné podobě): ……………………',
            'Datum: …………………………………………………',
          ],
        },
      ],
    },
  ],
};
