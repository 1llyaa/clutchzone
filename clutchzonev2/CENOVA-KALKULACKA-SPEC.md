# Cenová kalkulačka + datově řízený ceník + přepracovaný rezervační flow

**Projekt:** Clutch Zone (Next.js 15 App Router, Tailwind v4, next-intl, Supabase, Stripe)
**Verze:** 2.0 — podklad pro implementaci v Claude Code
**Změna proti v1:** celý ceník se stěhuje do databáze a stává se editovatelným v adminu. Kalkulačka i engine přestávají mít cokoli natvrdo.
**Stav:** schváleno v briefu, otevřené body jsou označené `⚠️ K POTVRZENÍ`

---

## 1. Proč to děláme

Dnešní stav: ceník je statická tabulka čísel, rezervace je 6krokový modal, který cenu odhalí až ve 3. kroku, a v adminu jdou měnit **jen částky** — ne přidat cenovku, ne posunout Happy Hours, ne změnit otevírací dobu. Každá sezónní akce dnes znamená zásah do kódu.

Tři cíle:

1. **Prodejní kalkulačka pod hero.** Uživatel naklikne kdy a jak dlouho chce hrát a okamžitě vidí nejvýhodnější variantu, úsporu v korunách a tlačítko do rezervace.
2. **Srozumitelné oddělení dvou produktů**, které dnes web míchá do jedné kategorie „balíčky".
3. **Datově řízený ceník.** Hodinové cenovky, časové pasy i otevírací doba žijí v databázi a spravují se v adminu. Engine, kalkulačka, veřejný ceník i serverová validace čtou ze stejného zdroje.

Bod 3 není nice-to-have: jakmile má být Happy Hours editovatelné, nemůže mít engine natvrdo zadané druhy nabídek ani pevný počet typů dne. Kdyby se to dodělávalo později, přepisuje se jádro.

---

## 2. Produktový model

Tohle je nejdůležitější sekce dokumentu. Dnešní web má názvosloví obrácené a texty si protiřečí.

### 2.1 HODINY (kredit)

Řádky tabulky `hour_tiers`. Hodnoty níže jsou **současný stav dat**, ne pravidla v kódu.

| | PC | PS5 |
|---|---|---|
| Cenovky | 1h / 3h / 5h / 7h / 10h | 1h / 3h / 5h |
| Ceny | 75 / 215 / 345 / 475 / 660 | 120 / 330 / 560 |
| Kč/h | 75 / 71,7 / 69 / 67,9 / **66** | 120 / 110 / 112 |

- Nevyužité hodiny **zůstávají jako kredit na účtu hráče** v ggLeap.
- Platnost **3 měsíce od nákupu**.
- Kredit pro PC a PS5 je **oddělený**, hodiny mezi typy nejsou zaměnitelné.
- Kredit je **nepřenosný** na jinou osobu.
- Zákazník při rezervaci nebo nákupu kreditu zadává **Clutchzone account** — svou přezdívku v ggLeap (uživatelsky přívětivý název pro to, co je interně ggLeap nickname). Podle něj obsluha hodiny ručně dohledá a připíše — viz kap. 4.1, 6, 7.2.
- Kredit připisuje **obsluha ručně** — žádné API napojení na ggLeap se nedělá.

> **Poznámka k PS5:** 5h (112 Kč/h) je dražší za hodinu než 3h (110 Kč/h), takže množstevní sleva tam nefunguje monotónně a kalkulačka to zviditelní. Necháváme být — ceny jsou v DB, po opravě v adminu se všechno přepočítá včetně toho, které složení je nejlevnější.

### 2.2 ČASOVÉ PASY

Řádky tabulky `time_passes`. Současný stav dat:

| Pas | Režim | Cena | Okno | Dny | Kč/h při plném využití |
|---|---|---|---|---|---|
| Happy Hours | paušál | 165 Kč | 14:00–17:00 | ÚT–PÁ | 55 |
| Evening Pass | paušál | 285 Kč | 19:00–24:00 | ÚT–ČT, NE | 57 |
| Weekend Pass | paušál | 340 Kč | 22:00–04:00 | PÁ, SO | 56,7 |

- **Nic nezůstává** — čas je nutné využít v daném okně.
- **Pas se bere vcelku, nedělí se a nekombinuje s hodinami.** Kdo přijde později, platí stejný paušál za kratší dobu. Kdo chce hrát i po skončení okna, pas nedostane a platí hodiny.
- Pas se nikdy nekombinuje ani s jiným pasem. Jedna nabídka = maximálně jeden pas, nebo hodiny.
- Pasy dnes existují jen pro PC, ale `station_type` je editovatelný a admin může vytvořit i pas pro PS5.
- Režim `za hodinu` v modelu zůstává, i když ho dnes žádný pas nepoužívá — odblokuje budoucí akci typu „úterní sazba 60 Kč/h" bez migrace.

> **Důsledek, který stojí za pozornost:** kdo chce hrát 5 hodin od 14:00, Happy Hours nedostane, protože přesahuje 17:00. Zaplatí 345 Kč jako kredit. Je to záměr — pas je jednoduchý produkt a tlačí lidi do okna.

### 2.3 Klíčový trade-off, který musí být vidět na každé kartě

> Levnější varianta má často horší podmínky. Happy Hours = 165 Kč za okno 14:00–17:00 a nic nezůstane. 3h jako kredit = 215 Kč a zůstávají 3 měsíce.

Bez explicitního označení u každé nabídky to bude vypadat jako podraz. **Každá karta v kalkulačce nese jeden ze dvou tagů:**
- 🔒 `HODINY ZŮSTÁVAJÍ · PLATNOST 3 MĚSÍCE`
- ⏱ `PLATÍ JEN V TOMTO ČASE`

### 2.4 Typy dne se nezadávají, ale odvozují

Kalkulačka nemá pevné pilulky. Typy dne vznikají výpočtem z `opening_hours` a `time_passes`:

```
pro každý den v týdnu (Po…Ne):
    když is_closed → přeskoč
    signature = `${open_time}-${close_time}` + seřazená ID aktivních pasů platných v ten den
seskup dny se shodnou signature
popisek = sloučení po sobě jdoucích dnů do rozsahů (ÚT–ČT), ostatní čárkou (ÚT–ČT, NE)
```

Nad současnými daty z toho vypadnou čtyři skupiny:

| Typ dne | Otevřeno | Happy Hours | Evening Pass | Weekend Pass |
|---|---|---|---|---|
| **ÚT–ČT** | 14:00–24:00 | ✅ | ✅ | ❌ |
| **PÁ** | 14:00–04:00 | ✅ | ❌ | ✅ |
| **SO** | 14:00–04:00 | ❌ | ❌ | ✅ |
| **NE** | 14:00–24:00 | ❌ | ✅ | ❌ |
| PO | zavřeno | — | — | — |

Pátek nejde sloučit se čtvrtkem ani se sobotou — má jinou zavírací dobu než čtvrtek a jinou sadu pasů než sobota.

Když majitel rozšíří Happy Hours na sobotu, skupiny se přepočítají samy. **Když počet skupin přesáhne 5, admin dostane varování** — víc pilulek než pět dělá z kalkulačky rozcestník a je to signál, že se ceník zbytečně roztříštil.

---

## 3. Cenový engine

Jedna čistá funkce, kterou používá kalkulačka na HP, krok v rezervačním modalu i server při validaci. **Jeden zdroj pravdy, tři konzumenti.** Nula konstant v kódu — vše přichází z DB.

### 3.1 Vstup

```ts
interface CalcInput {
  stationType: 'pc' | 'ps5';
  dayTypeKey: string;     // odvozený klíč skupiny dnů, ne enum
  startHour: number;      // 14–23, po půlnoci 24–27
  durationHours: number;  // kolik chce reálně hrát
  stationsCount: number;  // 1–5
}

interface PricingConfig {   // načteno z DB, předané do enginu
  hourTiers: HourTier[];
  timePasses: TimePass[];
  openingHours: OpeningHours[];
  creditExpiryMonths: number;
}
```

### 3.2 Kombinační pravidlo pro hodiny

Cena za `n` hodin = **nejlevnější kombinace aktivních cenovek**. Coin-change přes malá čísla, počítá se v mikrosekundách. Funguje nad libovolnou sadou cenovek — když admin přidá 2h nebo 15h, engine to zohlední bez zásahu do kódu.

Přebytek je vždy kredit, takže engine smí koupit víc, než uživatel potřebuje: `cheapestCombo(n)` hledá nejlevnější součet **≥ n**.

Ověřené výsledky nad **současnými** daty — použij jako fixtures v unit testech, ne jako pravidla:

**PC**
| Hodin | Složení | Cena | 1h × N | Úspora |
|---|---|---|---|---|
| 1 | 1h | 75 | 75 | 0 |
| 2 | 1h + 1h | 150 | 150 | 0 |
| 3 | 3h | 215 | 225 | 10 |
| 4 | 3h + 1h | 290 | 300 | 10 |
| 5 | 5h | 345 | 375 | 30 |
| 6 | 5h + 1h | 420 | 450 | 30 |
| 7 | 7h | 475 | 525 | 50 |
| 8 | 7h + 1h | 550 | 600 | 50 |
| 9 | 7h + 1h + 1h | 625 | 675 | 50 |
| 10 | 10h | 660 | 750 | **90** |

**PS5**
| Hodin | Složení | Cena | Úspora |
|---|---|---|---|
| 1 | 1h | 120 | 0 |
| 2 | 1h + 1h | 240 | 0 |
| 3 | 3h | 330 | 30 |
| 4 | 3h + 1h | 450 | 30 |
| 5 | 5h | 560 | 40 |
| 6 | 3h + 3h | 660 | 60 |

> U PS5 na 6h vychází 3h+3h (660) levněji než 5h+1h (680). Engine to najde sám — proto se složení nesmí hardcodovat.

**Pasy nad současnými daty (PC):**

| Vstup | Nejlevnější | Pozn. |
|---|---|---|
| ÚT, 14:00, 3h | Happy Hours 165 Kč | úspora 60 Kč vs. 3h kredit |
| ÚT, 14:00, 2h | hodiny 150 Kč | HH za 165 Kč se zobrazí jako alternativa s +1h |
| ÚT, 16:00, 1h | hodiny 75 Kč | HH odfiltrovány jako dominované |
| ÚT, 14:00, 5h | hodiny 345 Kč | HH nepokryjí celou délku, nenabídnou se |
| ÚT, 19:00, 5h | Evening Pass 285 Kč | úspora 90 Kč vs. 5× 1h |
| PÁ, 22:00, 5h | Weekend Pass 340 Kč | dá 6h, tedy o hodinu víc → LEPŠÍ VOLBA |

### 3.3 Generování nabídek

Engine vrátí `Offer[]`. Kandidáti:

**1. `hours` — čisté hodiny (kredit)**
Vždy dostupné. `cheapestCombo(durationHours)`.

**2. `hours_upsell` — hodiny o cenovku výš**
Nejbližší vyšší cenovka, když je delta malá. Pravidlo: nabídnout, pokud `deltaKč / deltaHodin < cena nejmenší cenovky`. Nad současnými daty vychází 9h → 10h za +35 Kč. **Nikdy nenabízet víc než jednu cenovku nahoru**, jinak engine plodí absurdity.

**3. `pass` — časový pas**
Pro každý aktivní pas, kde platí:
- `station_type` odpovídá (nebo je `any`)
- den z odvozené skupiny je v `days_of_week`
- `startHour` spadá do okna pasu

Pokrytí a cena:
```
okno       = [window_start, window_end)   // s ošetřením crosses_midnight
konec      = min(window_end, close_time, start + max_hours)   // max_hours volitelné
pokrytí    = konec − start
cena       = price_mode === 'flat' ? amount : pokrytí × amount
```

Pas se nabídne jen tehdy, když **pokryje celou požadovanou délku**. Když uživatel chce hrát déle, než okno pasu sahá, pas se do výsledků vůbec nedostane a zbývají hodiny.

Všechny ceny se nakonec **násobí `stationsCount`** (lineárně, i u pasů).

Jedna nabídka = maximálně jeden pas, nebo hodiny. Nikdy obojí, nikdy dva pasy.

### 3.4 Výstup

```ts
interface Offer {
  id: string;                    // stabilní, posílá se na server k revalidaci
  kind: 'hours' | 'hours_upsell' | 'pass';
  passId: string | null;         // odkaz na time_passes, ne slug natvrdo
  label: string;                 // z DB (name_cs / name_en), ne z i18n souborů
  totalAmount: number;           // za všechny stanice
  amountPerStation: number;
  hoursCovered: number;
  bonusHours: number;            // hoursCovered − durationHours, když > 0
  breakdown: { label: string; qty: number; unitAmount: number }[];
  isCredit: boolean;
  creditRemainderHours: number;
  effectiveHourly: number;       // zaokrouhleno na celé Kč, jen k zobrazení
  savingsVsHourly: number;       // vůči durationHours × nejmenší cenovka; může být ≤ 0
  fitsClosingTime: boolean;
}
```

> `label` u pasů přichází z databáze, ne z `messages/*.json`. Nově vytvořený pas nemá i18n klíč a nikdy ho mít nebude.

### 3.5 Řazení a doporučení

1. Filtruj nabídky pokrývající `durationHours`.
2. Seřaď vzestupně podle `totalAmount`.
3. **`DOPORUČUJEME`** = nejlevnější nabídka.
4. **Filtr dominance:** zahoď každou nabídku, která je **zároveň dražší a nedává víc hodin** než doporučená. Bez tohohle kroku by se u paušálních pasů zobrazoval čistý šum — kdo přijde v 16:00 na jednu hodinu, viděl by Happy Hours za 165 Kč vedle jedné hodiny za 75 Kč se stejným pokrytím.
5. **`LEPŠÍ VOLBA`** = zobrazí se navíc, když existuje varianta **levnější nebo stejně drahá, která zároveň dává víc hodin** (typicky Weekend Pass: 5h od 22:00 v pátek stojí 345 Kč jako kredit, ale pas dá 6h za 340 Kč). Jediný případ, kdy se mění délka — a jen na kliknutí uživatele.
6. Nabídka, která je **dražší, ale dává víc hodin**, projde filtrem a zobrazí se jako alternativa s rámováním upsellu: `Za +15 Kč máš o hodinu víc` (2h od 14:00 = 150 Kč v hodinách, Happy Hours dá 3h za 165 Kč).
7. Zobrazuj max **3 karty** + rozbalovací „Zobrazit všechny varianty". Hick's law: každá další viditelná varianta prodlužuje rozhodnutí.

### 3.6 Zásada: nikdy neměň uživatelův vstup

Automaticky se předvybírá jen **cenová konstrukce**. Počet hodin, čas a den zůstávají, jak je uživatel zadal. „Lepší volba" je karta s tlačítkem `POUŽÍT` a po aplikaci `VRÁTIT ZPĚT`. Tiché přepsání objednávky u placené transakce ničí důvěru rychleji, než ji jakákoli úspora vybuduje.

### 3.7 Přesah přes zavírací dobu

Uživatel může chtít víc hodin, než se do dne vejde. **Neblokovat** — protože hodiny jsou kredit:

> Do zavírací doby se vejde 5h. Zbylých 5h ti zůstane jako kredit na příští návštěvu.

Tím mizí dnešní skrytý problém, že 10h se v úterý (14–24) dá koupit jen při startu přesně ve 14:00.

**Rezervovaná délka** je naopak tvrdě omezená `close − start`. Kalkulačka pracuje se dvěma čísly: *kolik hodin kupuju* a *kolik jich dnes prohraju*.

---

## 4. Flow 1 — kalkulačka → rezervace

```
[HP, sekce pod hero, id="kalkulacka"]
  ├── typ → den → čas → délka → stanice
  ├── výsledek: DOPORUČUJEME / LEPŠÍ VOLBA / alternativy
  ├── [REZERVOVAT]  ─────────────► modal, předvyplněný
  └── [KOUPIT JEN HODINY]  ──────► /cs/kredit
```

Modal má **3 kroky místo dnešních 6**:

**Krok 1 — SOUHRN A DATUM**
- Nahoře rozklikávací souhrn: `GAMING PC · PÁTEK · 19:00 · 5 HODIN · 2 STANICE · EVENING PASS · 570 KČ`
- Datepicker přednastavený na **nejbližší datum odpovídající typu dne** z kalkulačky, plus 3–4 nejbližší termíny jako rychlé volby
- Až tady proběhne **kontrola dostupnosti** — kalkulačka datum nezná a nesmí dostupnost předstírat
- Datum s jiným typem dne → **přepočet ceny s viditelným upozorněním**, nikdy tiše

**Krok 2 — KONTAKT** Jméno, e-mail, telefon, Discord (volitelný), **Clutchzone account** (přezdívka v ggLeap). Povinné vždy, bez ohledu na `offerKind` — u `hours`/`hours_upsell` se na účet připisují hodiny, ale i čistě časový pas (`offerKind` = `pass`) při platbě kartou generuje mince (`pay_now_coins_amount`), a ty se připisují na tentýž ggLeap účet. Pole tedy potřebuje vyplnit každá online placená objednávka, ne jen ty s hodinovým kreditem.

Pod polem zaškrtávátko „Nemám zatím Clutchzone účet" — nový hráč ho logicky ještě mít nemůže. Zaškrtnutím se pole vypne a zobrazí se poznámka, že účet založí obsluha na místě a hodiny/mince připíše dodatečně podle referenčního kódu. Server pole nevynucuje natvrdo (jen UI vede k vyplnění) — bez účtu jde rezervaci pořád dohledat přes referenci a kontakt.

**Krok 3 — PLATBA A POTVRZENÍ**
- `ZAPLATIT NYNÍ` (Stripe) — cena závazná, +mince
- `ZAPLATIT V KLUBU` — cena taky závazná
- `MÁM KREDIT` — neplatí se nic, obsluha odečte na místě
- **Souhlas s obchodními podmínkami** — povinné zaškrtávátko nad potvrzovacím tlačítkem, detaily v kapitole 4.1

**Krok 4 — HOTOVO** Referenční kód, přiřazené stanice, e-mail.

### 4.1 Souhlas s obchodními podmínkami

Povinný krok před dokončením rezervace i před nákupem kreditu. Ceny jsou nově závazné a u kreditu vzniká předplacené plnění s expirací — bez doloženého souhlasu je to špatně vymahatelné na obou stranách.

**Podoba**

Nad potvrzovacím tlačítkem, ne pod ním. Zaškrtávátko **nikdy předzaškrtnuté** — předvyplněný souhlas je v ČR i EU neplatný a zároveň to je klasický dark pattern.

```
☐  Souhlasím s obchodními podmínkami a beru na vědomí
   zásady ochrany osobních údajů.
```

- „obchodními podmínkami" a „zásady ochrany osobních údajů" jsou odkazy, otevírají se **v novém panelu nebo nové záložce**, nikdy nesmí zahodit rozepsanou rezervaci
- **Jen jedno zaškrtávátko.** Zásady ochrany osobních údajů jsou informační povinnost, ne souhlas — zpracování údajů probíhá kvůli plnění smlouvy. Druhé zaškrtávátko by bylo právně matoucí a zbytečně by prodlužovalo formulář.
- U nákupu kreditu má souhrn navíc jednu **explicitní větu nad zaškrtávátkem**, ne schovanou v podmínkách:
  `Hodiny mají platnost 3 měsíce od nákupu. Nevyužité hodiny po uplynutí propadají.`

**Chování**

- Potvrzovací tlačítko **zůstává aktivní**. Zakázané tlačítko bez vysvětlení je nepřístupné a uživatel netuší, co dělá špatně.
- Klik bez zaškrtnutí → zaškrtávátko a text zoranžoví, pod ním se objeví `Bez souhlasu s podmínkami nemůžeme rezervaci dokončit.`, focus skočí na zaškrtávátko
- Dotyková plocha minimálně 44 × 44 px včetně textu popisku

**Uložení**

```sql
alter table bookings       add column terms_accepted_at timestamptz;
alter table bookings       add column terms_version text;
alter table credit_orders  add column terms_accepted_at timestamptz not null;
alter table credit_orders  add column terms_version text not null;
```

Podmínky se **verzují**. `terms_version` je datum poslední revize (např. `2026-08-14`) a zapisuje se do `site_settings.terms_version`. Bez toho za rok nedohledáte, s jakým zněním zákazník souhlasil — a u expirujícího kreditu je to přesně ten spor, který může nastat.

Server **odmítne** vytvořit rezervaci i objednávku kreditu bez `termsAccepted: true` v těle požadavku. Validace v UI nestačí.

### Vstupní body

| Odkud | Chování |
|---|---|
| Navbar `REZERVOVAT` (na HP) | smooth scroll na `#kalkulacka` |
| Navbar `REZERVOVAT` (podstránky) | `/cs#kalkulacka` |
| Hero `REZERVOVAT MÍSTO` | scroll na `#kalkulacka` |
| CtaBand `REZERVOVAT MÍSTO` | scroll na `#kalkulacka` |
| Tlačítko v kalkulačce | otevře předvyplněný modal |
| `/cs/rezervace?type=pc&day=fri&start=19&h=5&st=2` | otevře modal rovnou — pro sdílení a reklamu |

Sjednocení je záměr: **jedna akce = jeden zážitek**. Dnes vedou čtyři tlačítka do stejného modalu, ale uživatel v něm začíná od nuly.

---

## 5. Flow 2 — přímá rezervace

Kdo přijde na `/cs/rezervace` bez parametrů, dostane v modalu **kompaktní verzi téže kalkulačky jako krok 0**. Není to druhá komponenta, je to stejný React komponent ve `variant="compact"`. Dnešní krok „Délka a cena" tím mizí.

---

## 6. Flow 3 — nákup kreditu

Samostatná stránka `/cs/kredit`, odkazovaná ze sekundárního tlačítka v kalkulačce a z hlavního menu.

1. Přepínač PC / PS5
2. Karty cenovek se steppery množství — **lze objednat víc balíků najednou** (2× 10h PC)
3. Průběžný součet + úspora + efektivní Kč/h
4. **Datum konce platnosti viditelně ještě před platbou:** `Platnost do 14. 11. 2026`
5. Kontaktní údaje + **Clutchzone account** (přezdívka v ggLeap) — povinné, kredit se dá připsat jedině na konkrétní účet
6. **Souhlas s obchodními podmínkami** (kap. 4.1) + explicitní věta o expiraci nad zaškrtávátkem
7. **Pouze Stripe.** Nezaplacená objednávka kreditu je jen odpad v systému; kdo chce platit na místě, koupí si kredit na recepci.
8. Potvrzení + e-mail s referenčním kódem a datem expirace

> ⚠️ **K POTVRZENÍ** Jde v jedné objednávce míchat PC a PS5 kredit? Zůstatky jsou stejně oddělené, takže technicky nic nebrání. Spec předpokládá **ano** (jeden košík, dvě položky).

**Mince** se za online nákup kreditu připisují stejně jako u rezervace, hodnota zůstává v `site_settings.pay_now_coins_amount`.

---

## 7. Admin

### 7.1 Přepracovaná sekce `CENÍK` (`/admin/pricing`)

Dnes umí měnit jen částky u existujících řádků. Nově tři záložky:

**Záložka HODINOVÉ CENOVKY**
Tabulka per typ stanice. Sloupce: `HODIN · CENA · KČ/H · ÚSPORA VS 1H · AKTIVNÍ · AKCE`.
- Přidat řádek, editovat, deaktivovat
- Sloupce `KČ/H` a `ÚSPORA` se dopočítávají živě při psaní — majitel hned vidí, jestli nová cenovka dává smysl
- **Varování, když množstevní sleva není monotónní** (větší balík má vyšší Kč/h než menší). Přesně tenhle stav je dnes u PS5 5h a v kalkulačce bude vidět.

**Záložka ČASOVÉ PASY**
Seznam pasů. Editor jednoho pasu obsahuje:

| Pole | Vstup |
|---|---|
| Název CS / EN | text, **oba povinné** |
| Popis CS / EN | text, oba povinné |
| Typ stanice | PC / PS5 / obojí |
| Režim ceny | ZA HODINU / PAUŠÁL |
| Částka | číslo |
| Dny | 7 přepínatelných pilulek PO–NE |
| Časové okno | od–do + přepínač „přesahuje půlnoc" |
| Max. hodin | jen u paušálu, volitelné (prázdné = do konce okna) |
| Aktivní | přepínač |

Pod formulářem **živý náhled věty**, kterou uvidí zákazník:
`Platí ÚT, ST, ČT, PÁ · 14:00–17:00 · 165 Kč za celé okno`

**Záložka OTEVÍRACÍ DOBA**
Sedm řádků PO–NE: `ZAVŘENO · OTEVÍRÁ · ZAVÍRÁ · PŘESAHUJE PŮLNOC`. Nahrazuje dnešní hodnoty napevno v `pricing.ts`, `messages/cs.json` a `messages/en.json` — patička se nově plní odsud.

**Panel DOPAD ZMĚNY** (nad všemi záložkami, aktualizuje se před uložením)
Ukazuje odvozené typy dne, které z dat vzniknou:
```
KALKULAČKA BUDE MÍT 4 SKUPINY DNÍ:   ÚT–ČT · PÁ · SO · NE
```
Bez tohoto panelu majitel netuší, že posunutím Happy Hours na sobotu přidal do kalkulačky pilulku. Když skupin vyjde víc než 5, panel zčervená s doporučením ceník zjednodušit.

**Mazání neexistuje, jen deaktivace.** Historické rezervace na pasy a cenovky odkazují a ceník musí zůstat dohledatelný.

### 7.2 Nová sekce `KREDITY` (`/admin/credits`)

Bez ní se to na recepci neuhlídá, protože kredit připisuje člověk ručně. Fronta zaplacených objednávek:

| Sloupec | Poznámka |
|---|---|
| Reference | |
| Zákazník / e-mail / telefon | |
| Clutchzone account | přezdívka v ggLeap — podle ní obsluha dohledá účet a připíše hodiny |
| Typ + hodiny | `PC · 20h (2× 10h)` |
| Částka | |
| Zaplaceno | datum |
| Platnost do | |
| Stav | `NEPŘIPSÁNO` / `PŘIPSÁNO` |
| Lhůta na odstoupení | `zbývá X dní` / `vypršela` |
| Kdo připsal, kdy | audit |
| Souhlas s podmínkami | datum + verze |

- Badge s počtem nepřipsaných v sidebaru — jinak to obsluha přehlédne
- Filtr default = jen nepřipsané
- Přepnutí na `PŘIPSÁNO` zapisuje `fulfilled_by` a `fulfilled_at`

### 7.3 Sekce `REZERVACE`

Doplnit sloupce `POČET STANIC`, `VARIANTA` (název pasu nebo „Hodiny") a `CLUTCHZONE ACCOUNT` — vyplněné u každé online placené rezervace bez ohledu na `offerKind` (i pas generuje mince na stejný účet), prázdné jen když zákazník zaškrtl „nemám zatím účet".

---

## 8. Datový model

### Nové tabulky

```sql
-- HODINOVÉ CENOVKY (kredit) — nahrazuje pc_duration_prices a ps5_duration_prices
create table hour_tiers (
  id uuid primary key default gen_random_uuid(),
  station_type text not null,            -- pc | ps5
  hours int not null,
  amount int not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (station_type, hours)
);

-- ČASOVÉ PASY — nahrazuje pricing_tiers a veškerou logiku pasů v kódu
create table time_passes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_cs text not null,
  name_en text not null,
  description_cs text not null,
  description_en text not null,
  station_type text not null,            -- pc | ps5 | any
  price_mode text not null,              -- per_hour | flat
  amount int not null,
  days_of_week int[] not null,           -- 0 = neděle … 6 = sobota
  window_start time not null,
  window_end time not null,
  crosses_midnight boolean not null default false,
  max_hours int,                         -- jen pro flat; null = do konce okna
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- OTEVÍRACÍ DOBA — jediný zdroj pravdy pro engine i patičku
create table opening_hours (
  day_of_week int primary key,           -- 0 = neděle … 6 = sobota
  is_closed boolean not null default false,
  open_time time,
  close_time time,
  crosses_midnight boolean not null default false
);

-- OBJEDNÁVKY KREDITU
create table credit_orders (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  clutchzone_account text not null,  -- ggLeap přezdívka, kam se hodiny připíšou
  total_amount int not null,
  stripe_checkout_session_id text,
  payment_status text not null default 'pending',   -- pending | paid | failed
  expires_at date not null,
  terms_accepted_at timestamptz not null,
  terms_version text not null,
  fulfilled_at timestamptz,
  fulfilled_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table credit_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references credit_orders(id) on delete cascade,
  station_type text not null,
  hours int not null,
  unit_amount int not null,              -- cena v době nákupu, ne odkaz na ceník
  quantity int not null default 1
);
```

> `unit_amount` se **kopíruje, neodkazuje.** Když majitel za měsíc zdraží, historické objednávky musí zůstat na původní ceně.

### Úpravy `bookings`

```sql
alter table bookings add column booking_group_id uuid;
alter table bookings add column stations_count int default 1;
alter table bookings add column time_pass_id uuid references time_passes(id);
alter table bookings add column offer_kind text;        -- hours | hours_upsell | pass
alter table bookings add column clutchzone_account text; -- ggLeap přezdívka, kam obsluha připíše kredit (jen offer_kind hours/hours_upsell)
alter table bookings add column pays_with_credit boolean default false;
alter table bookings add column terms_accepted_at timestamptz;
alter table bookings add column terms_version text;
```

Rezervace na N stanic = **N řádků se stejným `booking_group_id`**. Jeden řádek s `stations_count` by rozbil existující kontrolu obsazenosti, která pracuje per `station_id`.

Odkaz `time_pass_id` slouží k dohledání, ne k výpočtu — částka je u rezervace uložená napevno a **změna ceníku nikdy neovlivní existující rezervace**. U závazných cen je to i právní požadavek.

### `site_settings`

```
credit_expiry_months = 3
terms_version        = 2026-08-14
```

### Migrace ze současného stavu

1. `pc_duration_prices` + `ps5_duration_prices` → `hour_tiers`
2. `pricing_tiers` → `time_passes` s doplněním dnů, oken a režimu podle dnešní logiky v `src/lib/utils/pricing.ts`. **Happy Hours se přitom mění z hodinové sazby 55 Kč/h na paušál 165 Kč za okno 14:00–17:00** — není to jen přepis, je to změna produktu a musí se promítnout i do veřejného ceníku a do textů.
3. Otevírací doba z `pricing.ts` a z obou `messages/*.json` → `opening_hours`
4. Staré tabulky ponechat jen do ověření, pak zahodit — **ne je nechat žít vedle nových**

---

## 9. API

### `GET /api/pricing`
Vrací kompletní `PricingConfig`: `hourTiers`, `timePasses`, `openingHours`, `creditExpiryMonths` a **odvozené typy dne** včetně vygenerovaných popisků. Klient si nic nedopočítává z domněnek.

### `POST /api/bookings` — rozšíření
Přijímá navíc `stationsCount`, `offerKind`, `offerId`, `expectedAmount`, `termsAccepted`, `clutchzoneAccount`.

`clutchzoneAccount` je nepovinné i pro `offerKind` `hours`/`hours_upsell` — UI ho vynucuje, pokud hráč nezaškrtne „Nemám zatím Clutchzone účet" (kap. 4), ale server rezervaci nezamítá jen kvůli chybějícímu poli. Bez účtu zůstává rezervace dohledatelná přes referenci + kontakt, obsluha ho dopáruje při první návštěvě.

Bez `termsAccepted === true` vrátí `400` a rezervaci nevytvoří. Zapíše `terms_accepted_at = now()` a `terms_version` ze `site_settings`.

Povinná server-side revalidace:
1. Server postaví `Offer[]` **stejným enginem** nad **daty z DB**
2. Najde nabídku podle `offerId`
3. Porovná s `expectedAmount`
4. Neshoda → `409` + aktuální cena, rezervace se **nevytvoří**

Bez toho si kdokoli přes devtools nastaví cenu na 1 Kč. U závazných cen je to neomluvitelné.

Alokace stanic: najít `stationsCount` volných stanic daného typu v okně, vložit v jedné transakci. Když jich není dost → `409` s počtem volných.

### `POST /api/credits`
Vytvoří `credit_orders` + `credit_order_items`, spočítá `expires_at = now() + credit_expiry_months`, zapíše souhlas s podmínkami, vrátí Stripe checkout URL. Bez `termsAccepted === true` nebo bez neprázdného `clutchzoneAccount` vrátí `400`.

### `POST /api/stripe/webhook` — rozšíření
Rozlišit `metadata.kind = 'booking' | 'credit'`. U kreditu nastavit `payment_status = 'paid'` a odeslat potvrzení.

### `POST /api/admin/credits/[id]/fulfill`
Owner i staff. Zapíše `fulfilled_at`, `fulfilled_by`.

### Admin CRUD
`/api/admin/hour-tiers`, `/api/admin/time-passes`, `/api/admin/opening-hours` — po každém zápisu `revalidateTag('pricing')`.

---

## 10. Struktura souborů

```
src/lib/pricing/
  engine.ts            # čisté funkce, nula závislostí na Reactu i Supabase
  dayTypes.ts          # odvození skupin dnů + generování popisků
  engine.test.ts       # unit testy nad fixtures z kapitoly 3.2
  dayTypes.test.ts
  types.ts
  config-server.ts     # načtení PricingConfig z DB, cache tag 'pricing'

src/components/pricing/
  PriceCalculator.tsx        # variant: 'full' | 'compact'
  CalculatorInputs.tsx
  OfferCard.tsx              # sdílená karta pro HP i modal
  BetterChoiceCard.tsx
  SavingsBadge.tsx
  FullPriceTable.tsx         # sbalitelný kompletní ceník, generovaný z DB

src/components/reservation/
  ReservationModal.tsx       # přepis: 6 kroků → 3–4
  steps/StepSummaryDate.tsx
  steps/StepContact.tsx
  steps/StepPayment.tsx
  steps/StepDone.tsx

src/app/[locale]/kredit/page.tsx
src/app/[locale]/rezervace/page.tsx
src/app/[locale]/cenik/page.tsx
src/app/[locale]/admin/(protected)/pricing/    # přepis na 3 záložky
src/app/[locale]/admin/(protected)/credits/
src/app/api/credits/route.ts
src/app/api/admin/hour-tiers/route.ts
src/app/api/admin/time-passes/route.ts
src/app/api/admin/opening-hours/route.ts
```

**Ke smazání nebo přepsání:**
- `src/lib/utils/pricing.ts` — logika do enginu, konstanty `PC_PRICES` / `PS5_PRICES` a napevno zadaná otevírací doba a okna pasů **odstranit bez fallbacku**, ať nevznikne druhý zdroj pravdy, který tiše zestárne
- `src/components/sections/Pricing.tsx` — nahradit kalkulačkou + sbalitelným ceníkem
- `steps/StepType.tsx`, `StepDateTime.tsx`, `StepDuration.tsx` — nahrazuje kalkulačka
- `messages/*.json` — klíče `footer.hours*` a názvy pasů pryč, plní se z DB

---

## 11. Kde se to celé může pokazit

Seřazeno podle toho, co mě děsí nejvíc.

### 11.1 Právo a spotřebitel

**Expirace kreditu po 3 měsících je právně napadnutelná.** Předplacený nevyužitý čas propadající ve prospěch provozovatele je u spotřebitelských smluv v ČR citlivý. Minimální ochrana:
- Datum expirace **viditelné před platbou**, ne až v podmínkách
- Datum v potvrzovacím e-mailu
- Samostatný odstavec v obchodních podmínkách
- V repu je poznámka, že `terms/page.tsx` je nekontrolovaný draft. **Nechte to projít advokátem dřív, než to pustíte do provozu.**

> Zkrácení ze 6 na 3 měsíce zvyšuje právní i konverzní riziko. U 10h kreditu za 660 Kč to znamená odehrát v průměru přes 3 hodiny měsíčně, jinak část propadne — a je to zrovna balík, na který celá kalkulačka tlačí nejvíc. Zvažte delší platnost u velkých balíků; `credit_expiry_months` je v `site_settings`, rozlišení podle cenovky jde doplnit později bez migrace dat.

**Storno se překlápí na kredit** — odporuje to dnešnímu §4 podmínek (bezplatné zrušení 24h předem). Podmínky se musí přepsat současně s nasazením, ne potom. A je nutné rozhodnout, jestli u překlopeného kreditu běží expirace od původního nákupu, nebo od storna. **`⚠️ K POTVRZENÍ`**

**U nákupu kreditu vzniká 14denní právo na odstoupení, u rezervace ne.** Rezervace stanice na konkrétní termín spadá pod výjimku pro volnočasové služby poskytované v určeném termínu. Kredit ale na žádný termín vázaný není, takže se na něj výjimka nevztahuje a zákazník má u online nákupu **14 dní na odstoupení bez udání důvodu**. Praktické dopady:
- v obchodních podmínkách musí být samostatný odstavec o odstoupení od nákupu kreditu
- v administraci `KREDITY` je potřeba vidět, jestli je objednávka **mladší 14 dnů**, a umět ji stornovat s vrácením peněz přes Stripe
- když zákazník mezitím část kreditu vyčerpá, vrací se jen nevyčerpaná část
- **`⚠️ K POTVRZENÍ`** Jak se vrací peníze — plnou částkou přes Stripe, nebo poměrnou částí? A kdo to v adminu odbaví?

**Souhlas s podmínkami musí být doložitelný.** Zaškrtávátko samo o sobě nestačí — ukládá se `terms_accepted_at` a `terms_version` (kap. 4.1) a znění podmínek se verzuje. Bez toho u sporu o propadlý kredit neprokážete, s čím zákazník souhlasil.

**Ceny přestávají být orientační.** Potvrzovací e-mail v `src/lib/email.ts` dnes obsahuje větu, že cena je orientační a platí se na místě. **Musí pryč**, jinak si protiřečíte v jediném dokumentu, který zákazník dostane písemně.

### 11.2 Editovatelný ceník = nová třída rizik

Tohle v původní verzi neexistovalo. Majitel teď může jedním uložením rozbít kalkulačku i výnos:

| Riziko | Opatření |
|---|---|
| Nový pas levnější než všechno ostatní → engine ho nabízí vždy | panel DOPAD ZMĚNY + živý náhled Kč/h |
| Paušál nastavený tak, že je vždy dražší než hodiny | nikdy se nezobrazí kvůli filtru dominance; admin dostane varování, že pas je fakticky mrtvý |
| Změna Happy Hours přidá skupinu dnů → z 4 pilulek je 6 | panel DOPAD ZMĚNY, varování nad 5 skupin |
| Nemonotónní slevy (větší balík dražší za hodinu) | varování v tabulce cenovek |
| Dva překrývající se pasy | engine vybere levnější, admin dostane jen upozornění |
| Pas s dny, kdy je zavřeno | ignoruje se v enginu, admin varování |
| Okno pasu mimo otevírací dobu | engine ořízne podle `close_time`, admin varování |
| Smazání pasu, na který odkazují rezervace | mazání neexistuje, jen `is_active = false` |
| Deaktivace všech cenovek jednoho typu | validace: aspoň jedna aktivní cenovka na typ stanice, jinak neuloží |
| Chybějící EN název u nového pasu | obě jazykové verze povinné na úrovni schématu i formuláře |

Zvlášť upozorňuji na **měkké riziko**: čím víc pasů majitel vytvoří, tím hůř kalkulačka funguje. Šest pasů znamená šest variant v každém výsledku a rozhodovací paralýzu. Panel DOPAD ZMĚNY je proti tomu jediná obrana — dejte mu skutečnou váhu, ne drobný text pod formulářem.

### 11.3 Ruční připisování kreditu

Nejzranitelnější místo provozu. Zákazník zaplatí v pátek, přijde v sobotu, obsluha o tom neví, na účtu nic není.
- Admin fronta s badge (7.2) — **není nice-to-have, je to nutnost**
- E-mail obsluze při každém zaplaceném nákupu kreditu
- Referenční kód v potvrzení, aby šlo dohledat u pultu
- V e-mailu jasně: *„Hodiny ti připíšeme na účet při první návštěvě — ukaž tenhle kód na recepci."* Nesmí to znít, jako by kredit už na účtu byl.

### 11.4 Komprehenze: kredit vs. pas

Největší UX riziko celého projektu. Uživatel uvidí, že Happy Hours jsou levnější, koupí je a bude čekat, že mu zůstanou.
- Tag na **každé** kartě (2.3)
- V souhrnu před platbou jedna explicitní věta
- V potvrzovacím e-mailu odlišené bloky
- **Netestujte to jen na sobě.** Ukažte kalkulačku pěti lidem, kteří ceník neznají, a zeptejte se, co jim zůstane.

### 11.5 Paušální pasy

- **Pozdní příchod nesnižuje cenu.** Kdo přijde v 16:00, platí za Happy Hours stejných 165 Kč jako ten, kdo přišel ve 14:00. V potvrzení i v podmínkách to musí být napsané předem, jinak to na místě skončí dohadováním.
- **Kdo chce hrát přes konec okna, pas nedostane vůbec.** 5h od 14:00 stojí 345 Kč místo dřívějších 315 Kč. Je to záměr, ale je to jediná skupina, která si po změně připlatí — počítejte s dotazy.
- **Filtr dominance je povinný**, ne kosmetika. Bez něj se u krátkých návštěv v okně pasu zobrazí paušál dvakrát dražší než hodiny se stejným pokrytím a kalkulačka bude působit rozbitě.
- Rozpis zůstává položkový kvůli obsluze: `Happy Hours 14:00–17:00 · 165 Kč · 2 stanice`

### 11.6 Technika

| Riziko | Opatření |
|---|---|
| Podvržení ceny z klienta | povinná server-side revalidace (kap. 9) |
| Změna cen v adminu během session | `409` + nová cena, UI ukáže „cena se změnila" |
| Race condition na stanicích u N > 1 | alokace v jedné transakci, `409` s počtem volných |
| Kalkulačka slibuje dostupnost, kterou nezná | v kalkulačce **nikde** netvrdit dostupnost |
| Dva zdroje cen (kód vs. DB) | konstanty smazat, žádný fallback |
| Engine navrhne absurdní upsell | max jedna cenovka nahoru, tvrdý strop |
| Čas po půlnoci (24–27) | zachovat konvenci z `pricing.ts`, netvořit druhou |
| Zaokrouhlování | vše v celých Kč, `effectiveHourly` jen k zobrazení |
| Stará cache po změně ceníku | `revalidateTag('pricing')` po každém admin zápisu |

### 11.7 Konverzní pasti

- **Default nesmí být Happy Hours.** Pas platí ÚT–PÁ 14:00–17:00, pro většinu návštěvníků nedosažitelně. Kotva, která po zadání reálného času skočí nahoru, působí jako návnada. Default = **nejbližší otevřený den, 18:00, 3h, 1 stanice**, a Happy Hours jako badge: `Přijď ÚT–PÁ do 17:00 a máš to za 165 místo 215`.
- **Úspora 0 Kč u 1h a 2h.** Místo prázdného badge patří upsell: `Za +65 Kč máš 3 hodiny místo 2`.
- **Pět vstupů je na mobilu hodně.** Sticky lišta s cenou dole, jeden vstup na obrazovku, ne mřížka.

---

## 12. Co měřit

| Událost | Proč |
|---|---|
| `calculator_interacted` | kolik lidí se sekce vůbec dotkne |
| `calculator_offer_shown` (kind, passId, amount) | které varianty se nabízejí |
| `better_choice_applied` / `_reverted` | jestli doporučení pomáhá, nebo štve |
| `calculator_to_reservation` | hlavní konverzní metrika |
| `reservation_completed` (kind, stations, amount) | průměrná objednávka podle varianty |
| `credit_purchase_completed` | jestli druhý flow vůbec žije |
| drop-off po krocích modalu | kde to padá |

Cílová metrika je **průměrná hodnota objednávky**, ne počet rezervací. Smysl kalkulačky je posunout lidi z 1h na 3h a z 5h na 10h.

---

## 13. Doporučené pořadí prací

1. Migrace: `hour_tiers`, `time_passes`, `opening_hours` + převod současných dat
2. `engine.ts` a `dayTypes.ts` + unit testy nad fixtures z 3.2 — **bez UI**, dokud testy neprojdou
3. `GET /api/pricing` + cache tag `pricing`
4. Admin `CENÍK` — tři záložky, validace, panel DOPAD ZMĚNY
5. `PriceCalculator` ve variantě `full` na HP + sbalitelný ceník generovaný z DB
6. Server-side revalidace v `/api/bookings` + alokace N stanic
7. Přepis rezervačního modalu na 3 kroky, `variant="compact"` jako krok 0
8. Sjednocení vstupních bodů + `/cs/rezervace` s parametry
9. Flow nákupu kreditu + Stripe + e-maily
10. Admin `KREDITY` + badge
11. Souhlas s podmínkami: zaškrtávátka, verzování, serverová validace, storno kreditu v adminu
12. Přepis textů: `messages/*.json`, patička z DB, obchodní podmínky, potvrzovací e-maily
13. Analytika

Body 1–6 dávají použitelný produkt. Body 9–11 jsou samostatný, oddělitelný release — ale bod 11 se z něj **nesmí vypustit**, souhlas s podmínkami není volitelný doplněk.

**Pořadí 1 → 2 → 4 je nutné dodržet.** Postavit kalkulačku nad starými tabulkami a datový model dodělávat potom znamená psát engine dvakrát.

---

## 14. Otevřené otázky

1. **Míchání PC a PS5 kreditu v jedné objednávce** — povolit? Spec předpokládá ano.
2. **Expirace u kreditu vzniklého ze storna** — běží od původního nákupu, nebo od storna?
3. **Vracení peněz při odstoupení od nákupu kreditu do 14 dnů** — plnou částkou, nebo poměrnou částí po odečtení vyčerpaných hodin? A kdo to odbaví?
4. Přesné znění nových odstavců obchodních podmínek — kdo je píše a kdy je zkontroluje advokát? Nově je potřeba pokrýt: závaznost cen, expiraci kreditu, překlopení storna na kredit a odstoupení od nákupu kreditu.
