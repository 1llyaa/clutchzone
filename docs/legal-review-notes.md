# Připomínky k právním dokumentům Clutch Zone

Dokumenty „Obchodní podmínky" a „Ochrana osobních údajů" jsou na webu zveřejněny **přesně v dodaném znění**. Nic v nich nebylo změněno ani doplněno.

Tento soupis shrnuje nesrovnalosti a chybějící náležitosti, které při nasazování dokumentů vyplynuly. Není to právní posudek — je to podklad pro právníka.

Stav k 30. 8. 2026.

---

## A. Nesrovnalosti přímo v dodaném textu

### A1. Nesprávný rejstřík — VOP čl. 1.1
Text uvádí: *„zapsanou v obchodním rejstříku vedeném Městským soudem v Českých Budějovicích"*.

Dva problémy:
- Do **obchodního rejstříku** se zapisují obchodní společnosti (s.r.o., a.s.). Podnikající fyzická osoba (OSVČ) je zapsána v **živnostenském rejstříku**.
- **Městský soud v Českých Budějovicích neexistuje.** Rejstříkovým soudem pro České Budějovice je Krajský soud v Českých Budějovicích. Městský soud je pouze v Praze.

Podle § 435 občanského zákoníku musí být údaj o zápisu na obchodních listinách a webu uveden správně.

**Doporučená formulace k posouzení:** *„Martin Mašek, fyzická osoba podnikající na základě živnostenského oprávnění, zapsaná v živnostenském rejstříku"* — přesné znění je nutné ověřit podle výpisu.

### A2. Označení „společností" u fyzické osoby — VOP čl. 1.1
Text uvádí *„mezi společností Martin Mašek."*. Martin Mašek je fyzická osoba, nikoli společnost.

### A3. Cizí název firmy v textu — VOP čl. 7 (nadpis) a čl. 9.1
Na dvou místech se objevuje **„MVP ESports"** místo „Clutch Zone":
- nadpis čl. 7: *„PRAVIDLA VYUŽÍVÁNÍ SLUŽEB A PROSTOR MVP ESPORTS"*
- čl. 9.1: *„...zakoupené v dané pobočce MVP ESports."*

Vypadá to jako pozůstatek ze šablony jiného provozovatele. Zvlášť u čl. 9.1 to má věcný dopad — omezuje konzumaci na pobočku jiné firmy.

### A4. Dvakrát stejné číslo článku — VOP čl. 3.4
Dva různé odstavce jsou označeny **3.4.1**:
- *„3.4.1 Včasné zrušení (více než 15 minut předem)"*
- *„3.4.1. Pozdní zrušení a nedostavení se (méně než 15 minut předem)"*

Druhý má být zřejmě 3.4.2. Znemožňuje to jednoznačný odkaz na storno pravidlo.

### A5. Neuzavřená závorka a překlep — VOP čl. 1.1
*„...v Českých Budějovicích, dále jen „provozovatel"), a zákazníkem..."* — závorka se zavírá, aniž by byla otevřena. Za „Martin Mašek." je navíc tečka uprostřed věty.

### A6. Gramatická chyba — VOP čl. 3.6
*„bude zákazníkovi **nabídnout** náhradní termín"* — má být „nabídnut".

### A7. Překlep — GDPR čl. 1
*„České BUdějovice"* — velké U uprostřed slova.

### A8. Neúplná adresa sídla — VOP čl. 1.1 a 2.1
Uvedeno pouze *„Václava Volfa 1337/37"* bez PSČ a obce. V GDPR dokumentu je adresa uvedena úplně („37005 České Budějovice"). Sjednotit.

---

## B. Rozpor mezi dokumenty a údaji na webu

Web (patička, JSON-LD, potvrzovací e-maily) používá jiné údaje než dodané dokumenty. **Je nutné rozhodnout, které jsou správné** — momentálně si web a právní dokumenty odporují.

| Údaj | V dodaných dokumentech | Na webu (`src/lib/business.ts`) |
|---|---|---|
| E-mail | info@clutchzone**.club** | info@clutchzone**.cz** |
| Adresa provozovny | Krajinská **2381/17** | Krajinská **244/17** |
| Sídlo | Václava Volfa 1337/37 | V. Volfa 1337/37, 370 05 České Budějovice 2 |

Číslo popisné provozovny se liší zásadně (2381/17 vs. 244/17) — nejde o formátování.

---

## C. Chybějící povinné náležitosti

### C1. Mimosoudní řešení spotřebitelských sporů (ADR) — chybí
Podle § 14 zákona o ochraně spotřebitele musí prodávající spotřebitele **jasně a srozumitelně informovat** o subjektu mimosoudního řešení sporů, včetně jeho internetové adresy.

Pro tuto činnost je příslušná **Česká obchodní inspekce**, Štěpánská 796/44, 110 00 Praha 1, **www.coi.cz**.

Tato informace v dodaných VOP není vůbec obsažena. Patří typicky do závěrečných ustanovení.

> Poznámka: evropská platforma ODR (ec.europa.eu/consumers/odr) byla k 20. 7. 2025 ukončena — odkaz na ni už do podmínek nepatří.

### C2. Poučení o odstoupení od smlouvy do 14 dnů — chybí
VOP vůbec neřeší zákonné právo spotřebitele odstoupit od smlouvy uzavřené na dálku (§ 1829 obč. zák.). To je u e-shopu/online prodeje povinná informace. Je potřeba rozlišit dvě situace:

**a) Rezervace herního místa na konkrétní datum a čas**
Pravděpodobně spadá pod výjimku § 1837 písm. j) obč. zák. (služby volného času poskytované v určeném termínu) — pak právo na odstoupení do 14 dnů nevzniká. **Tuto výjimku je vhodné ve VOP výslovně uvést**, jinak není zřejmé, proč se 14denní lhůta neuplatní. Zároveň to je právní opora pro storno pravidlo v čl. 3.4.

**b) Nákup herních hodin, kreditu, balíčků a dárkových poukazů**
Tyto nejsou vázány na konkrétní termín, takže **výjimka podle § 1837 písm. j) se na ně nevztahuje** a 14denní právo na odstoupení platí. VOP to nikde neřeší — čl. 5 pouze stanoví propadnutí a nevratnost, což může být vůči spotřebiteli v rozporu se zákonem.

Navíc: od **19. 6. 2026** platí povinnost mít pro smlouvy uzavřené online **funkční tlačítko pro odstoupení** (nestačí formulář v PDF). Tato lhůta již uplynula.

*Technická poznámka: web už tlačítko pro odstoupení u nákupu kreditu má implementované (odkaz v potvrzovacím e-mailu), včetně vrácení peněz přes platební bránu. Chybí k tomu odpovídající text ve VOP.*

### C3. Vzorový formulář pro odstoupení — chybí
K bodu C2 se váže povinnost poskytnout spotřebiteli vzorový formulář pro odstoupení od smlouvy (příloha nařízení vlády č. 363/2013 Sb.).

### C4. Reklamační řád / lhůta pro vyřízení — neúplné
Čl. 11 VOP reklamace zmiňuje, ale neuvádí:
- **zákonnou 30denní lhůtu** pro vyřízení reklamace (§ 19 odst. 3 zákona o ochraně spotřebitele),
- povinnost vydat spotřebiteli **potvrzení o uplatnění reklamace** a o způsobu jejího vyřízení,
- konkrétní e-mail (čl. 11.3 odkazuje jen na „kontakt příslušné pobočky").

> Na webu je odkaz „Reklamační řád" v patičce nasměrován přímo na čl. 11 obchodních podmínek. Samostatný dokument neexistuje.

### C5. Dokument „Nastavení cookies" — odkazován, ale neexistuje
VOP čl. 12.2 i GDPR čl. 9 odkazují na samostatný dokument **„Nastavení cookies"**. Takový dokument nebyl dodán.

Na webu je stránka `/cookies` s ovládáním souhlasu, ale **bez právního textu** — zobrazuje se na ní pouze jednořádkový odstavec z GDPR čl. 9, který sám odkazuje na neexistující dokument (kruhový odkaz).

**Je potřeba dodat text dokumentu „Nastavení cookies".** Měl by popsat, co se ukládá, za jakým účelem, na jak dlouho a jak souhlas odvolat.

### C6. Popis cookies neodpovídá skutečnosti — GDPR čl. 2 a 4
Dokument uvádí zpracování *„IP adresa, typ zařízení, prohlížeč, cookies"* a *„analytických a reklamních nástrojů"*.

Skutečný stav webu je jiný a **výrazně méně invazivní**:
- žádné Google Analytics ani jiný nástroj třetí strany,
- žádné reklamní nástroje, žádné předávání reklamním sítím,
- žádné sledování napříč weby,
- měří se pouze vlastní události o průchodu objednávkou (práce s kalkulačkou, kroky rezervace, dokončení objednávky),
- identifikátor relace je náhodný, uložený pouze v paměti prohlížeče po dobu jedné návštěvy, nespojený s totožností,
- měření se spustí **až po udělení souhlasu** (opt-in), při odmítnutí se neodesílá nic.

Text by měl odpovídat realitě — jinak se provozovatel hlásí ke zpracování, které nedělá.

### C7. Doba uchování analytických údajů — neurčitá
GDPR čl. 6 uvádí u cookies pouze *„podle nastavení jednotlivých cookies a souhlasů"*. Pro záznamy o návštěvnosti je vhodné stanovit konkrétní lhůtu (např. 24 měsíců).

### C8. Kamerový systém — ověřit
GDPR čl. 2 zmiňuje kamerový systém podmínečně („Pokud je v pobočce používán"). Pokud kamery skutečně jsou, je potřeba doplnit správce, účel, dobu uchování a označení prostor. Pokud nejsou, odstavec vypustit.

### C9. Informace o cenách při slevách — chybí
Pokud web zobrazuje slevy nebo přeškrtnuté ceny, platí § 12a zákona o ochraně spotřebitele: jako cena před slevou musí být uvedena **nejnižší cena za posledních 30 dnů**. Ve VOP (čl. 4) o tom není zmínka.

---

## D. Co bylo nasazeno technicky

Pro úplnost — na webu je funkční:

- **Samoobslužné zrušení rezervace** odkazem z potvrzovacího e-mailu, v souladu s čl. 3.4 (15 minut). Při včasném zrušení se eviduje kredit k připsání; při pozdním zrušení nebo nedostavení se rezervace propadá.
- **Odstoupení od nákupu kreditu do 14 dnů** odkazem z potvrzovacího e-mailu, s automatickým vrácením peněz na platební kartu. **Chybí k tomu text ve VOP — viz C2.**
- **Cookies lišta se souhlasem (opt-in)** — rovnocenná tlačítka „Přijmout vše" / „Odmítnout", měření se bez souhlasu nespustí, souhlas lze kdykoli odvolat na `/cookies`. **Chybí k tomu právní text — viz C5.**
- Dokumenty jsou dostupné ve čtyřech jazycích (CS, EN, DE, UA). **Závazná je česká verze**; ostatní jsou pracovní překlady a měly by projít kontrolou.

---

## E. Poznámka k překladům

Anglická, německá a ukrajinská verze jsou strojové překlady dodaného českého textu, dosud bez korektury rodilým mluvčím ani právní kontroly. Věcné odchylky popsané výše (zejména A1, A3) jsou v překladech **zachovány**, protože překlad nemá text opravovat.

Doporučení: na každou jazykovou verzi doplnit větu, že závazné je české znění.
