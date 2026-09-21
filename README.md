# 🛒 Akce a Slevy – Vyhledávač akcí v českých obchodech

Moderní, bleskově rychlá webová aplikace běžící **100% v prohlížeči** pro vyhledávání, filtrování a porovnávání slev na potraviny napříč hlavními českými supermarkety.

👉 Podrobný návrh architektury a plán vývoje naleznete v **[IMPLEMENTATION_PLAN.md](file:///home/tomas/Projects/sale_search/IMPLEMENTATION_PLAN.md)**.

---

## ✨ Hlavní funkce

- ⚡ **Okamžité vyhledávání (<5 ms)**: Full-textové vyhledávání probíhá přímo v paměti prohlížeče pomocí [MiniSearch](https://github.com/lucaong/minisearch) bez síťové latence.
- 🇨🇿 **Podpora české diakritiky a tvarosloví**: Vyhledávání ignoruje háčky a čárky (`rohlik` najde `Bílý rohlík 43g`) a díky prefixovému a fuzzy matchingu si poradí i se skloňováním (`řízek` najde `vepřové řízky`).
- 🏪 **8 hlavních řetězců**: Albert, Billa, Lidl, Kaufland, Penny, Tesco, Rohlík.cz a Košík.cz s jejich typickými barvami pro rychlou orientaci.
- 🏷️ **Chytré filtry**:
  - Filtrování podle supermarketů a kategorií (mléčné, maso, pečivo, nápoje apod.).
  - Řazení podle nejvyšší slevy (%), nejnižší ceny, ceny za jednotku nebo končících akcí.
  - Filtr klubových karet (skrytí slev, které vyžadují aplikaci *Lidl Plus*, *Můj Albert*, *Kaufland Card* atd.).
  - Automatické hlídání platnosti akcí (automaticky skrývá prošlé akce).
- ⚖️ **Měrné jednotky**: Zobrazení a přepočet reálné ceny za měrnou jednotku (`Kč/kg`, `Kč/l`, `Kč/ks`).
- 📝 **Interaktivní nákupní lístek**:
  - Ukládání položek do `localStorage` (přetrvá i po obnovení stránky).
  - Přehledné seskupení položek podle jednotlivých obchodů pro pohodlný nákup.
  - Počítadlo kusů, celkové odhadované ceny a celkové ušetřené částky.
  - Tlačítko pro rychlé zkopírování naformátovaného seznamu do schránky (např. pro odeslání přes WhatsApp/SMS).
- 🪶 **Extrémně lehký bundle**: Použití **Preactu** a **Tailwind CSS v4** drží celou aplikaci na **~31 kB gzipped** (včetně ikon a 37 vzorových slev), což zaručuje okamžité načtení i na slabém signálu uvnitř prodejny.

---

## 🛠️ Použité technologie

| Nástroj / Knihovna | Účel |
| :--- | :--- |
| **[Preact](https://preactjs.com/)** | Ultra-lehká alternativa k Reactu (~3 kB runtime footprint) se stejnou syntaxí JSX a hooks. |
| **[Vite](https://vite.dev/)** | Moderní, rychlý vývojářský server a bundler. |
| **[TypeScript](https://www.typescriptlang.org/)** | Přísná typová bezpečnost pro datové modely a komponenty. |
| **[Tailwind CSS v4](https://tailwindcss.com/)** | Zero-runtime užitkový styling s optimalizovaným CSS výstupem. |
| **[MiniSearch](https://github.com/lucaong/minisearch)** | Klientský full-textový vyhledávač s prefixovým vyhledáváním a fuzzy tolerancí překlepů. |
| **[lucide-preact](https://lucide.dev/)** | Lehké a čisté vektorové SVG ikony. |

---

## 📁 Struktura projektu

```text
sale_search/
├── src/
│   ├── components/
│   │   ├── Header.tsx              # Vyhledávací pole, logo a spouštěč nákupního lístku
│   │   ├── StoreFilter.tsx         # Přepínače řetězců s barvami značek
│   │   ├── CategoryFilter.tsx      # Horizontální volič kategorií s ikonami
│   │   ├── SortBar.tsx             # Počítadlo výsledků, filtry karet/dat a řazení
│   │   ├── ProductCard.tsx         # Karta produktu s měrnou cenou, slevou a fotkou
│   │   └── ShoppingListDrawer.tsx  # Vysouvací nákupní lístek s rozdělením podle obchodů
│   ├── data/
│   │   └── mockSales.ts            # Vzorová data (37 položek napříč 8 řetězci)
│   ├── hooks/
│   │   ├── useSalesSearch.ts       # MiniSearch indexace, vyhledávání, filtry a řazení
│   │   └── useShoppingList.ts      # Správa a perzistence nákupního lístku (localStorage)
│   ├── types/
│   │   └── sales.ts                # Typové definice (SaleItem, StoreId, GroceryCategory...)
│   ├── utils/
│   │   └── czechNormalize.ts       # Odstranění diakritiky, kontrola platnosti dat a formátování měny
│   ├── app.tsx                     # Hlavní layout aplikace
│   ├── index.css                   # Tailwind CSS import
│   └── main.tsx                    # Vstupní bod Preactu
├── IMPLEMENTATION_PLAN.md          # Kompletní plán vývoje a architektury
├── package.json
└── vite.config.ts
```

---

## 🚀 Spuštění a sestavení

### 1. Instalace závislostí
```bash
npm install
```

### 2. Spuštění lokálního vývojového serveru
```bash
npm run dev
```
Aplikace se spustí na adrese `http://localhost:5173`.

### 3. Produkční sestavení
```bash
npm run build
```
Vytvoří optimalizovaný balíček v adresáři `dist/`.

### 4. Náhled produkčního sestavení
```bash
npm run preview
```

### 5. Synchronizace živých dat o slevách
```bash
npm run sync
```
Stáhne a zvaliduje aktuální slevy z řetězců a uloží je do `public/data/sales.latest.json`.

---

## 🗺️ Plány a architektura
- 👉 **[IMPLEMENTATION_PLAN.md](file:///home/tomas/Projects/sale_search/IMPLEMENTATION_PLAN.md)** – Původní implementační plán a návrh celého projektu.
- 👉 **[IMPLEMENTATION_PLAN_2.md](file:///home/tomas/Projects/sale_search/IMPLEMENTATION_PLAN_2.md)** – Detailní plán a právní rozbor pro získávání živých dat.