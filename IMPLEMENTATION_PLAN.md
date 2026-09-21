# 🛒 Czech Grocery Sales Search (Akce a Slevy) – Implementation Plan

An implementation plan for a fast, user-friendly, client-side web application to search and compare grocery sales across Czech supermarket chains (Albert, Billa, Lidl, Kaufland, Penny, Tesco, Rohlík, Košík, etc.).

---

## 1. Executive Summary & Vision

- **Objective**: Build a lightning-fast, modern web application allowing Czech shoppers to search, filter, and compare grocery discounts from major Czech retailers.
- **Initial Focus**: Groceries (potraviny) with unit prices (Kč/kg, Kč/l), discount percentages, store loyalty card requirements (Lidl Plus, Albert Club, etc.), and expiration dates.
- **Core User Experience**: Instant search-as-you-type (<50ms), works seamlessly on mobile devices, offline capable, and zero intrusive ads.
- **Frontend-First Architecture**: High-speed client-side search engine with pre-processed static datasets generated via daily scheduled background pipelines (eliminating server hosting costs and backend latency).

---

## 2. Frontend-Only Feasibility & Architecture Analysis

### The Reality of Czech Supermarket APIs
A purely client-side browser application attempting to directly call Czech supermarket APIs encounters fundamental web platform restrictions:
1. **CORS (Cross-Origin Resource Sharing)**: Supermarket APIs (Albert, Billa, Lidl, Penny, Kaufland) do not send `Access-Control-Allow-Origin: *` headers. Direct browser `fetch()` requests fail immediately.
2. **Bot Protection & Cloudflare/DataDome**: Retailers and delivery platforms (Rohlík, Košík) employ bot protection that blocks unauthorized browser-origin headers.
3. **Authentication & Ephemeral Tokens**: Mobile app endpoints often require device-specific HMAC signatures or session tokens.
4. **Rate Limits & Mobile Data Overhead**: Having hundreds of mobile users query 8 different supermarket APIs simultaneously drains user battery, cellular data, and triggers 429 rate limits.

### The Winning Architecture: Jamstack + In-Browser Full-Text Engine
To deliver the user's vision of **running entirely on the frontend** without hosting expensive backend servers:

```
┌────────────────────────────────────────────────────────┐
│ Daily Scheduled Pipeline (GitHub Actions / Cron)       │
│ • Pulls normalized data via Aggregator API & Rohlik    │
│ • Validates schema & strips expired promotions         │
│ • Exports compact static `sales.latest.json` (~65 KB)  │
│ • Deploys as static asset to CDN / GitHub Pages        │
└───────────────────────────┬────────────────────────────┘
                            │ (HTTP GET with ETag / Cache-Control)
                            ▼
┌────────────────────────────────────────────────────────┐
│ User's Browser (100% Client-Side SPA)                  │
│ • Browser native HTTP cache (Zero DB overhead)         │
│ • In-Memory MiniSearch index (builds in ~10ms)         │
│ • Czech Diacritic Normalization (č->c, ř->r, etc.)     │
│ • Dynamic date filter (auto-hides validTo < today)     │
│ • LocalStorage: "Nákupní lístek" (Shopping List) only  │
└────────────────────────────────────────────────────────┘
```

**Why this meets the requirements:**
- **Zero hosting costs**: Entirely hosted on GitHub Pages, Cloudflare Pages, or Vercel Free tier.
- **Dataset is tiny (~65 KB gzipped)**: Across all 8 Czech supermarket chains, there are only ~2,000–2,500 active weekly sales at any time. This is smaller than a single hero image!
- **Instant Search (<5ms)**: Data lives directly in a native JS memory array; queries make zero network or database roundtrips.
- **100% Frontend for the end-user**: No backend servers or databases to maintain.
- **Works Offline**: Shoppers inside supermarkets with poor signal can still search cached sales.

---

## 3. Recommended Technology Stack

| Layer | Recommended Choice | Alternatives | Rationale |
| :--- | :--- | :--- | :--- |
| **Framework** | **Vite + Preact + TypeScript** | React, Svelte, Vanilla JS | Ultra-lightweight (~3 KB runtime vs ~45 KB React), instant initial parse & render on budget phones inside stores with weak signal. Uses the same clean JSX and hooks (`useState`, `useMemo`). |
| **Styling & UI** | **Tailwind CSS** | Plain CSS / CSS Modules | Zero-runtime utility classes, mobile-first design, clean custom components without heavyweight component runtime libraries. |
| **Icons** | **lucide-preact** | Heroicons | Tiny, crisp SVG icons for grocery categories, stores, and search controls. |
| **Client Search** | **MiniSearch** | Orama, Fuse.js | Tiny bundle (<7 KB), builds in-memory index in ~10ms, supports prefix matching, fuzzy typo-tolerance, and custom Czech tokenizers. |
| **Data Caching & State** | **HTTP Cache + In-Memory State** | LocalStorage, IndexedDB | With ~2,500 active weekly discounts, the total payload is ~65 KB gzipped. Standard browser HTTP cache (`Cache-Control: max-age=3600`) + in-memory array is 10x faster and eliminates database connection lifecycle bugs. LocalStorage is reserved solely for user shopping list and store filters. |
| **Data Scraping / Sync** | **Node.js (TypeScript) Aggregator Pipeline** | Python (Scrapy) | Ingests from flyer aggregator endpoints + Rohlik/Kosik JSON feeds. Can run on free GitHub Actions without getting blocked. |
| **Hosting & CI/CD** | **Cloudflare Pages** or **Vercel** | GitHub Pages | Unlimited bandwidth, global edge CDN, automatic preview deployments. |

---

## 4. Standard Data Schema

All data pulled from various Czech stores is normalized into a unified, lightweight schema:

```typescript
export interface SaleItem {
  id: string;                      // Unique hash: e.g. "albert-123456"
  store: StoreId;                  // 'albert' | 'billa' | 'lidl' | 'kaufland' | 'penny' | 'tesco' | 'rohlik' | 'kosik'
  title: string;                   // e.g. "Madeta Jihočeské máslo 250g"
  brand?: string;                  // e.g. "Madeta"
  category: GroceryCategory;       // 'dairy', 'meat', 'bakery', 'beverages', 'fruits_vegetables', etc.
  originalPrice?: number;          // e.g. 64.90
  salePrice: number;               // e.g. 39.90
  discountPercentage?: number;     // e.g. 38 (calculated or explicit)
  unitPrice?: {
    price: number;                 // e.g. 159.60
    unit: 'kg' | 'l' | 'ks' | '100g';
    formatted: string;             // e.g. "159,60 Kč / kg"
  };
  validFrom: string;               // ISO date: "2026-09-20"
  validTo: string;                 // ISO date: "2026-09-26"
  clubCardRequired: boolean;       // true if discount requires Lidl Plus, Albert Club, etc.
  clubCardName?: string;           // "Lidl Plus", "Můj Albert", "Kaufland Card", "Clubcard"
  imageUrl?: string;               // Optimized CDN thumbnail
  detailUrl?: string;              // Direct link to item/leaflet
}

export type StoreId = 
  | 'albert' 
  | 'billa' 
  | 'lidl' 
  | 'kaufland' 
  | 'penny' 
  | 'tesco' 
  | 'rohlik' 
  | 'kosik';

export type GroceryCategory =
  | 'dairy_eggs'       // Mléčné výrobky a vejce
  | 'meat_fish'        // Maso, uzeniny a ryby
  | 'bakery'           // Pečivo a pekárenské zboží
  | 'fruits_vegetables'// Ovoce a zelenina
  | 'beverages'        // Nealko i alko nápoje
  | 'sweets_snacks'    // Sladkosti a slané
  | 'pantry'           // Trvanlivé potraviny, oleje, těstoviny
  | 'frozen'           // Mražené potraviny
  | 'drugstore_home'   // Drogerie a domácnost
  | 'other';
```

---

## 5. Czech Language & Search Engine Nuances

Searching Czech product names requires specific linguistic accommodations:
1. **Diacritics Stripping (Odstranění diakritiky)**:
   - Users frequently type `rohlik`, `maslo`, or `mleko` without accents.
   - The search indexer and query parser must normalize strings:
     ```typescript
     export function normalizeCzech(str: string): string {
       return str
         .normalize('NFD')
         .replace(/[\u0300-\u036f]/g, '')
         .toLowerCase()
         .trim();
     }
     ```
2. **Czech Noun Inflection & Plural Handling**:
   - Czech has heavy noun declensions (e.g. `řízek` vs `řízky`, `vejce` vs `vajec`, `máslo` vs `másla`).
   - Prefix matching (`prefix: true`) coupled with fuzzy distance (`fuzzy: 0.2`) ensures that queries match inflected endings without needing a heavy 500KB lemmatizer library.
3. **Prefix Matching & Typo Tolerance**:
   - As the user types `mas...`, match `máslo`, `mascarpone`, `masné výrobky`.
4. **Weighting / Boosting**:
   - Boost title matches over description or category:
     ```typescript
     const miniSearch = new MiniSearch({
       fields: ['title', 'brand', 'category'],
       storeFields: ['id'],
       searchOptions: {
         boost: { title: 3, brand: 2, category: 1 },
         prefix: true,
         fuzzy: 0.2,
         processTerm: (term) => normalizeCzech(term),
       },
     });
     ```

---

## 6. Key UI/UX Features for Czech Shoppers

1. **Top Bar with Instant Search**:
   - Prominent search input with auto-complete and search history chips.
   - Quick action: "Vymazat" (Clear) and voice search (Speech Recognition API where available).
2. **Store Filter Badges**:
   - Toggle buttons with supermarket brand colors & logos (Albert blue/yellow, Lidl blue/yellow/red, Billa yellow, Kaufland red, Penny red, Rohlik green).
   - "Vybrat vše" / "Pouze vybrané" toggle.
3. **Category Chips**:
   - Scrollable horizontal chip bar: 🥛 Mléčné, 🥩 Maso, 🥖 Pečivo, 🍎 Ovoce, ☕ Nápoje, etc.
4. **Sort & Filter Drawer / Bar**:
   - **Dynamic Date Guard**: Automatically hide expired sales (`validTo >= today`) by default, with a toggle to "Zobrazit i končící/prošlé".
   - Nejvyšší sleva (%)
   - Nejnižší cena (Kč)
   - Cena za měrnou jednotku (Kč/kg, Kč/l)
   - Končící nejdříve (Expirující akce)
   - Filtr: Pouze bez věrnostní karty (Hide discounts that require app cards).
5. **Product Card with Hotlink Protection**:
   - **Hotlink-safe image loading**: Retailer CDNs block cross-origin referrers; all product images MUST use `referrerPolicy="no-referrer"` with an inline SVG placeholder fallback on `onError`.
   - Clear pricing: Prominent current discount price in bold CZK, crossed-out original price, discount badge (e.g. `-42%`).
   - Unit price in muted text: `24,90 Kč / 100g`.
   - Store badge & date validity badge (`Platí do středy 24. 9.`).
   - Loyalty card requirement badge (`Pouze s Lidl Plus`).
   - Quick "+ Nákupní seznam" button.
6. **"Nákupní seznam" (Shopping List / Calculator)**:
   - Floating action button with item count and estimated total price.
   - Grouping items by supermarket so users know what to buy where.
   - Shareable list via URL hash or Web Share API (WhatsApp, SMS).

---

## 7. Data Sources & Pragmatic Ingestion Strategy

> [!WARNING]
> Attempting to write 8 separate scrapers against Albert, Billa, Lidl, Kaufland, Penny, and Tesco directly from GitHub Actions will fail due to Cloudflare/DataDome IP blocks on Azure runner IPs. Retailers also change DOM structures constantly.

### Recommended 2-Pronged Strategy:
1. **Primary: Aggregator Endpoints (Kupi.cz / AkcniCeny.cz)**:
   - Aggregators maintain continuous ingestion and leaflet OCR/parsing for *all* Czech supermarkets.
   - Calling an aggregator's public search/feed endpoints from a lightweight Node.js script provides instant coverage for Albert, Billa, Lidl, Kaufland, Penny, and Tesco with 1 unified parser instead of 6 brittle ones.
2. **Secondary: Direct JSON Supermarket APIs (Rohlík.cz / Košík.cz)**:
   - Online supermarkets have clean, machine-readable JSON endpoints (e.g. Rohlík sales catalog) with reliable images, categories, and unit prices.
3. **Fallback: Static Weekly JSON Dumps**:
   - If an aggregator endpoint changes, the daily pipeline falls back to the previous day's data without breaking the live web application.

---

## 8. Step-by-Step Implementation Roadmap

### Phase 1: Project Initialization & UI Prototype (Days 1–2)
- [ ] Initialize repository with Preact + TypeScript + Vite (`npx -y create-vite@latest . --template preact-ts`, preserving existing `.git` and docs).
- [ ] Install Tailwind CSS, `lucide-preact`, `clsx`, and `minisearch`.
- [ ] Set up clean, accessible Tailwind UI components (`Input`, `Button`, `Badge`, `Card`, `Drawer`, `Select`).
- [ ] Create mock dataset (`src/data/mockSales.ts`) with ~40 realistic Czech grocery items covering all 8 stores with valid future dates.
- [ ] Build responsive UI layout:
  - Header with title, search input, and shopping cart counter.
  - Store filter selector with official supermarket colors.
  - Product grid with discount badges, unit prices, hotlink-safe images, and store indicators.
  - Shopping list slide-over drawer with store grouping.

### Phase 2: Client Search Engine & Filtering (Days 3–4)
- [ ] Integrate `minisearch` with `prefix: true` and `fuzzy: 0.2`.
- [ ] Implement Czech diacritics removal and string normalizer (`normalizeCzech`).
- [ ] Implement dynamic date guard (automatically hide promotions where `validTo < today`).
- [ ] Implement multi-facet filtering (active stores, categories, loyalty-card-only).
- [ ] Implement sorting (highest discount, lowest price, unit price, ending soon).
- [ ] Implement `localStorage` persistence for:
  - Selected store preferences.
  - User's shopping list items.

### Phase 3: Data Ingestion Pipeline (Days 5–7)
- [ ] Set up a `/scripts` directory with TypeScript + Node.js.
- [ ] Implement **AggregatorAdapter**:
  - Pulls current promotions from public aggregator feeds (covering Albert, Billa, Lidl, Kaufland, Penny, Tesco in one unified format).
- [ ] Implement **RohlikAdapter**:
  - Pulls sales from Rohlík's public JSON catalog.
- [ ] Implement schema validator (using `zod`) to ensure data cleanliness (valid dates, positive prices, valid URLs).
- [ ] Implement unit price standardizer (convert "kg", "g", "100g", "l", "ml" into uniform Kč/kg and Kč/l).
- [ ] Output compact JSON file to `public/data/sales.latest.json` (~65 KB gzipped).

### Phase 4: Automation & Deployment (Days 8–9)
- [ ] Configure GitHub Actions workflow (`.github/workflows/daily-sync.yml`):
  - Triggers every morning at 04:00 UTC (before grocery stores open).
  - Executes scraper script, validates output, pushes updated `sales.latest.json`.
- [ ] Implement client-side data loader:
  - Fetch `sales.latest.json` using standard browser HTTP caching (ETag / Cache-Control).
  - Feed into in-memory array and build MiniSearch index in ~10ms.
  - Display "Naposledy aktualizováno: [Čas]" in the footer.
- [ ] Add PWA (Progressive Web App) manifest via `vite-plugin-pwa` so users can install it on their phone home screen.
- [ ] Deploy frontend to Cloudflare Pages or Vercel.

---

## 9. Risk Matrix & Mitigations

| Risk | Impact | Likelihood | Mitigation |
| :--- | :--- | :--- | :--- |
| **Retailer blocks scraper IP on GitHub Actions** | High | Low (with Aggregator) | Ingest from public aggregator endpoints and open JSON feeds instead of scraping 8 individual supermarket websites. |
| **Supermarket CDN blocks image hotlinking** | High | High | Add `referrerPolicy="no-referrer"` to all `<img>` tags, and provide an inline SVG placeholder on image `onError`. |
| **Outdated sales shown after flyer cycle ends** | Medium | High | Client-side dynamic date filter (`validTo >= today`) automatically hides expired items even if daily sync is delayed. |
| **Czech noun inflection breaks search** | Medium | High | Enable `prefix: true` and `fuzzy: 0.2` in MiniSearch alongside diacritics stripping (`normalizeCzech`). |
| **Different unit price formats** | Medium | High | Rigorous regex parsing for weights/volumes (e.g. `250 g`, `1,5 l`, `10 ks`) to calculate clean comparable unit prices. |

---

## 10. AI Implementation Prompt

To immediately begin implementing this project with an AI coding assistant, copy and run the prompt below:

```text
You are tasked with implementing Phase 1 of the "Czech Grocery Sales Search" (Akce a Slevy) project based on IMPLEMENTATION_PLAN.md.

Please perform the following steps:
1. Initialize a modern, ultra-lightweight web application in the existing repository using Vite with Preact and TypeScript.
   - Be careful not to delete or overwrite `.git`, `README.md`, or `IMPLEMENTATION_PLAN.md`.
2. Install Tailwind CSS, lucide-preact, clsx, and minisearch. Configure Tailwind CSS with `@tailwindcss/vite` or standard PostCSS.
3. Create the data types in `src/types/sales.ts` conforming to the `SaleItem` specification in IMPLEMENTATION_PLAN.md.
4. Create a comprehensive, realistic mock dataset in Czech in `src/data/mockSales.ts` with at least 35-40 popular grocery items across Czech supermarkets (Albert, Billa, Lidl, Kaufland, Penny, Tesco, Rohlík, Košík).
   - Include items like Madeta Jihočeské Máslo, Pilsner Urquell 0.5l, Eidam 30% cihla, Bílý rohlík 43g, Banány, Kuřecí prsní řízky 500g, Kofola Originál 2l, etc.
   - Provide realistic prices, discount percentages, unit prices (Kč/kg, Kč/l, Kč/ks), store IDs, loyalty card flags, and valid validity dates (`validFrom`, `validTo`).
5. Create a Czech diacritic-insensitive search and normalization utility in `src/utils/czechNormalize.ts`.
6. Implement the UI components:
   - Header with instant search bar, active date expiration filter (`validTo >= today`), and shopping list drawer trigger with item badge.
   - Supermarket filter chips with store branding colors (Albert, Billa, Lidl, Kaufland, Penny, Tesco, Rohlík, Košík).
   - Category selector pills (Mléčné, Maso, Pečivo, Ovoce & Zelenina, Nápoje, etc.).
   - Sort dropdown (Nejvyšší sleva, Nejnižší cena, Cena za měrnou jednotku, Končící nejdříve).
   - Responsive product cards displaying discount percentage badge, original vs. sale price, unit price (Kč/kg, Kč/l), loyalty card requirement badge, hotlink-safe image (`referrerPolicy="no-referrer"` with SVG fallback), and an "add to shopping list" button.
   - Shopping list side drawer showing selected items grouped by store, with item quantity management and total price calculation.
7. Integrate `minisearch` on the client side with prefix search and fuzzy matching enabled.
8. Ensure the UI is mobile-first, responsive, fast, and runs without errors. Run `npm run build` to verify everything compiles cleanly.
```
