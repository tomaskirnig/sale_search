# 📡 IMPLEMENTATION PLAN 2: Spolehlivé a legální načítání živých dat o slevách

Tento dokument představuje detailní technický a právní plán pro přechod z prototypu na automatizovaný sběr a aktualizaci **živých dat** o potravinových slevách v České republice.

---

## 1. Goal Description (Cíl plánu)

Nahradit stávající statická mock data v aplikaci automatizovaným systémem, který:
1. **Získá aktuální slevy** ze supermarketů (Albert, Billa, Lidl, Kaufland, Penny, Tesco, Rohlík, Košík).
2. **Je 100% v souladu se zákony ČR a EU** (Autorský zákon, práva pořizovatele databáze, GDPR, směrnice Omnibus).
3. **Je dlouhodobě spolehlivý** (odolný vůči změnám HTML, blokování IP adres a výpadkům).
4. **Zachovává frontendovou architekturu** (frontend si stahuje kompaktní statický JSON `sales.latest.json` bez nutnosti provozovat placený backendový server).

---

## 2. Právní analýza: Jak data získat 100% legálně

Při sběru dat o cenách v ČR je nutné rozlišovat tři právní roviny:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRÁVNÍ STATUS DAT                             │
├────────────────────────────────┬────────────────────────────────────────┤
│ TYP INFORMACE                  │ PRÁVNÍ REŽIM V ČR A EU                 │
├────────────────────────────────┼────────────────────────────────────────┤
│ Názvy zboží, ceny, slevy, data │ ✅ ČISTÁ FAKTA (Volné k užití)         │
│ platnosti, měrné ceny          │ Podle § 2 a § 3 AutZ nejsou chráněny   │
│                                │ autorským právem. Ceny jsou ze zákona  │
│                                │ veřejné informace.                     │
├────────────────────────────────┼────────────────────────────────────────┤
│ Grafické PDF letáky, layout    │ ⚠️ AUTORSKÉ DÍLO                       │
│ marketingových materiálů       │ Nesmí se kopírovat celá grafika.       │
│                                │ Extrahovat pouze textová fakta.        │
├────────────────────────────────┼────────────────────────────────────────┤
│ Produktové fotografie          │ ⚠️ AUTORSKÉ DÍLO FOTOGRAFA             │
│                                │ Řešení: Hotlinking (nehostovat na svém │
│                                │ disku) s referrer-policy, případně     │
│                                │ licence Open Food Facts / ikony.       │
├────────────────────────────────┼────────────────────────────────────────┤
│ Databáze Kupi.cz / AkcniCeny   │ ❌ PRÁVO POŘIZOVATELE DATABÁZE (§ 88a) │
│ (kompletní scraping agregátoru)│ Nelegální vytěžovat jejich investici   │
│                                │ bez B2B smlouvy se Seznamem/CNC.       │
├────────────────────────────────┼────────────────────────────────────────┤
│ Primární weby řetězců          │ ✅ VEŘEJNÉ NABÍDKY PRO SPOTŘEBITELE    │
│ (albert.cz, lidl.cz...)        │ Sběr veřejných cenových nabídek pro    │
│                                │ účely srovnání je v EU povolen.        │
└────────────────────────────────┴────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Závěr právní analýzy:**
> - **NESMÍ SE:** Masivně scrapovat agregátory (Kupi.cz / Seznam.cz), protože mají chráněnou databázi podle § 88a Autorského zákona a aktivně chrání svá práva pořizovatele.
> - **SMÍ SE:** Získávat data **přímo z primárních zdrojů** (oficiální weby řetězců a jejich veřejné letáky) nebo přes **oficiální affiliate XML feedy** (Rohlík, Košík). Ceny zboží jsou veřejný údaj.

---

## 3. Srovnání možností získávání dat

| Varianta | Legálnost | Spolehlivost | Pokrytí | Náročnost |
| :--- | :--- | :--- | :--- | :--- |
| **A. Oficiální Affiliate program (CJ / VIVnetworks)** | 100% oficiální smluvní vztah | Maximální (denní certifikovaný XML feed) | Rohlík.cz, Košík.cz | Nízká (pouze registrace a parsování XML) |
| **B. Řízený scraping primárních řetězců přes Apify** | V mezích zákona (veřejné ceny ze zdrojových webů) | Vysoká (řeší rotaci proxy a Cloudflare) | Lidl, Kaufland, Albert, Penny, Tesco | Střední (využití hotových Apify Actorů) |
| **C. Vlastní scraper na GitHub Actions** | V mezích zákona | Nízká (Azure IP blokovány Cloudflarem) | Záleží na antibot ochraně | Vysoká údržba |
| **D. B2B licence od Seznamu (Kupi)** | 100% oficiální smlouva | Maximální | Všechny řetězce | Vyžaduje komerční B2B dohodu |

---

## 4. Doporučená 2-stupňová strategie (The Hybrid Approach)

Pro maximální spolehlivost a nulové právní riziko nasadíme kombinaci:

### Stupeň 1: Online prodejci přes oficiální XML / JSON (Rohlík & Košík)
- Rohlík.cz i Košík.cz provozují affiliate programy v síti **CJ (VIVnetworks)**, kde bezplatně poskytují partnerům **denně aktualizovaný XML/JSON produktový feed**.
- Získáme tím tisíce položek se 100% přesnými cenami, fotkami, nutričními údaji a EAN kódy.
- Navíc tato varianta umožňuje projekt v budoucnu monetizovat provizemi z nákupů.

### Stupeň 2: Kamenné řetězce přes řízené primární extraktory (Apify / Serverless)
- Pro Lidl, Kaufland, Albert, Billa, Penny a Tesco využijeme buď:
  1. **Veřejná REST API samotných řetězců**, která používají jejich vlastní webové aplikace (např. Lidl Flyer JSON API `endpoints.lidl-flyer.com`, webový katalog Albertu).
  2. **Bezplatnou vrstvu české platformy Apify** (nabízí $5 kreditu měsíčně zdarma, což stačí na 1x denní spuštění lehkého cheerio/puppeteer extraktoru s rezidenčními proxy, takže nikdy nedostaneme 403 Forbidden).

---

## 5. User Review Required (Rozhodnutí pro uživatele)

> [!CAUTION]
> **Klíčové rozhodnutí o infrastruktuře sběru dat:**
> 1. **Varianta 1 (Doporučená - Hybrid):**
>    - Přímé veřejné endpointy řetězců (Lidl JSON katalog, Albert akce, Rohlík API) spouštěné skriptem `npm run sync`.
>    - Pokud řetězec zavede přísný Cloudflare, přesměrujeme daný konkrétní modul na Apify (zdarma do 5 USD/měsíc).
> 2. **Varianta 2 (Čistě Affiliate):**
>    - Začít pouze se 100% oficiálními partnery (Rohlík.cz + Košík.cz) a kamenné řetězce přidávat postupně.

---

## 6. Open Questions (Otevřené otázky)

1. **Fotografie produktů:** Chcete zobrazovat originální fotografie řetězců přes hotlinking (`referrerPolicy="no-referrer"`), nebo preferujete napojení na mezinárodní open-source databázi **Open Food Facts** pro 100% jistotu ohledně autorských práv fotografií?
2. **Četnost aktualizací:** Postačuje aktualizace 1x denně v noci (04:00), nebo je potřeba častější refresh (např. 2x denně ráno a odpoledne)?

---

## 7. Proposed Changes (Návrh technické realizace)

### Komponenta A: Datová pipeline (`scripts/`)

#### `[NEW]` `scripts/sync-sales.ts`
Hlavní orchestrátor, který spustí jednotlivé adaptéry, validuje data přes Zod, odstraní duplicity a vyexportuje finální `public/data/sales.latest.json`.

```typescript
// scripts/sync-sales.ts
import { fetchRohlikSales } from './adapters/rohlik';
import { fetchLidlSales } from './adapters/lidl';
import { fetchAlbertSales } from './adapters/albert';
import { validateAndNormalize } from './utils/validator';
import fs from 'node:fs/promises';

async function main() {
  console.log('🚀 Zahajuji synchronizaci slev...');
  const items = [];
  
  try { items.push(...await fetchRohlikSales()); } catch (e) { console.error('Rohlik error:', e); }
  try { items.push(...await fetchLidlSales()); } catch (e) { console.error('Lidl error:', e); }
  try { items.push(...await fetchAlbertSales()); } catch (e) { console.error('Albert error:', e); }

  const normalized = validateAndNormalize(items);
  await fs.writeFile('public/data/sales.latest.json', JSON.stringify({
    updatedAt: new Date().toISOString(),
    count: normalized.length,
    items: normalized,
  }, null, 2));
  console.log(`✅ Úspěšně uloženo ${normalized.length} slev.`);
}
main();
```

#### `[NEW]` `scripts/adapters/rohlik.ts`
Adaptér pro Rohlík.cz využívající buď veřejný katalogový endpoint, nebo XML feed.

#### `[NEW]` `scripts/adapters/lidl.ts`
Adaptér pro Lidl využívající veřejné JSON rozhraní jejich letákového portálu.

#### `[NEW]` `scripts/adapters/albert.ts`
Adaptér pro Albert stahující a parsující strukturovaná data z `albert.cz/akcni-nabidka`.

---

### Komponenta B: Klientské načítání (`src/`)

#### `[MODIFY]` `src/hooks/useSalesData.ts`
Napojení na `public/data/sales.latest.json` s plynulým přechodem a zobrazením stavu načítání.

#### `[MODIFY]` `src/app.tsx`
Použití živých dat z hooku `useSalesData` namísto statického importu `MOCK_SALES`.

---

### Komponenta C: Automatizace (`.github/`)

#### `[NEW]` `.github/workflows/daily-sync.yml`
GitHub Actions workflow spouštěné každé ráno v 04:00 UTC pomocí cronu:
1. Nainstaluje závislosti.
2. Spustí `npm run sync`.
3. Vytvoří commit s novým `sales.latest.json` (nebo ho nahraje na Cloudflare Pages / GitHub Pages).

---

## 8. Verification Plan (Plán ověření)

### Automatizované testy
1. **Spuštění synchronizace:**
   ```bash
   npm run sync
   ```
   Ověření, že skript skončí s kódem `0` a vygeneruje validní soubor `public/data/sales.latest.json`.
2. **Validace JSON schématu:**
   Automatická kontrola přes Zod schématu `SaleItem` (všechny ceny kladné, data ve formátu ISO, platné ID obchodů).
3. **Frontend Build:**
   ```bash
   npm run build
   ```
   Ověření, že klientská aplikace s živými daty projde kompilací bez chyb.

### Manuální ověření
1. Spustit `npm run dev` a otevřít prohlížeč.
2. Vyhledat konkrétní slevu (např. "máslo", "pivo", "mléko") a ověřit, že odpovídá reálné aktuální nabídce v daném obchodě.
3. Vyzkoušet offline režim (DevTools -> Offline) a ověřit, že aplikace funguje i bez připojení k internetu.
