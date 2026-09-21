import * as cheerio from 'cheerio';
import type { SaleItem, StoreId, GroceryCategory } from '../../src/types/sales';

interface KupiCategoryConfig {
  url: string;
  category: GroceryCategory;
}

const CATEGORIES_TO_SCRAPE: KupiCategoryConfig[] = [
  { url: 'https://www.kupi.cz/slevy/mlecne-vyrobky-a-vejce', category: 'dairy_eggs' },
  { url: 'https://www.kupi.cz/slevy/maso-drubez-a-ryby', category: 'meat_fish' },
  { url: 'https://www.kupi.cz/slevy/pecivo', category: 'bakery' },
  { url: 'https://www.kupi.cz/slevy/ovoce-a-zelenina', category: 'fruits_vegetables' },
  { url: 'https://www.kupi.cz/slevy/nealko-napoje', category: 'beverages' },
  { url: 'https://www.kupi.cz/slevy/sladkosti-a-slane-snacky', category: 'sweets_snacks' },
  { url: 'https://www.kupi.cz/slevy/mrazene-a-instantni-potraviny', category: 'frozen' },
  { url: 'https://www.kupi.cz/slevy/drogerie', category: 'drugstore_home' },
];

const STORE_MAP: Record<string, StoreId> = {
  albert: 'albert',
  billa: 'billa',
  lidl: 'lidl',
  kaufland: 'kaufland',
  penny: 'penny',
  tesco: 'tesco',
  rohlik: 'rohlik',
  kosik: 'kosik',
};

function normalizeStoreName(raw: string): StoreId | null {
  const lower = raw.toLowerCase().trim();
  for (const [key, storeId] of Object.entries(STORE_MAP)) {
    if (lower.includes(key)) {
      return storeId;
    }
  }
  return null;
}

function parseCzkPrice(str: string): number | null {
  if (!str) return null;
  // e.g. "9,90 Kč" or "9.90&nbsp;Kč"
  const clean = str.replace(/[^\d,\.]/g, '').replace(',', '.');
  const val = parseFloat(clean);
  return isNaN(val) ? null : val;
}

function parseDiscountPercentage(str: string): number | undefined {
  if (!str) return undefined;
  const match = str.match(/(\d+)\s*%/);
  return match ? parseInt(match[1], 10) : undefined;
}

export async function fetchKupiSales(): Promise<Partial<SaleItem>[]> {
  const results: Partial<SaleItem>[] = [];

  for (const { url, category } of CATEGORIES_TO_SCRAPE) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'cs-CZ,cs;q=0.9,en;q=0.8',
        },
      });

      if (!response.ok) {
        console.warn(`[KupiAdapter] Failed to fetch ${url} (HTTP ${response.status})`);
        continue;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract products listed on the page
      // Kupi embeds JSON-LD ItemList with names & urls
      const jsonLdText = $('script[type="application/ld+json"]').text();
      const ldMap = new Map<string, string>();
      if (jsonLdText) {
        try {
          const parsed = JSON.parse(jsonLdText);
          if (parsed.itemListElement && Array.isArray(parsed.itemListElement)) {
            for (const item of parsed.itemListElement) {
              if (item.url && item.name) {
                const slug = item.url.split('/').pop();
                if (slug) ldMap.set(slug, item.name);
              }
            }
          }
        } catch {
          // ignore ld-json parse issues
        }
      }

      // Parse discount rows
      $('.discount_row').each((_, el) => {
        try {
          const discountId = $(el).attr('data-discount') || Math.random().toString(36).substring(7);
          const rawShop = $(el).find('.discounts_shop_name').text().trim();
          const store = normalizeStoreName(rawShop);
          if (!store) return; // ignore non-supermarket stores (e.g. dm drogerie, bauhaus)

          const rawPrice = $(el).find('.discount_price_value').text().trim();
          const salePrice = parseCzkPrice(rawPrice);
          if (!salePrice) return;

          const rawDiscount = $(el).find('.discount_percentage').text().trim();
          const discountPercentage = parseDiscountPercentage(rawDiscount);

          const rawUnitPrice = $(el).find('.price_per_unit').text().trim().replace(/&nbsp;/g, ' ');
          const rawProductSlug = $(el).find('a[data-product]').attr('data-product') || '';
          
          // Title from JSON-LD or fallback to slug
          let title = ldMap.get(rawProductSlug);
          if (!title && rawProductSlug) {
            title = rawProductSlug
              .split('-')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ');
          }
          if (!title) return;

          // Club card check (e.g. "Penny karta", "Lidl Plus", "Kaufland Card", "Clubcard")
          const rowText = $(el).text().toLowerCase();
          const isClubCard =
            rowText.includes('plus') ||
            rowText.includes('karta') ||
            rowText.includes('card') ||
            rowText.includes('klub');

          let clubCardName: string | undefined;
          if (isClubCard) {
            if (store === 'lidl') clubCardName = 'Lidl Plus';
            else if (store === 'albert') clubCardName = 'Můj Albert';
            else if (store === 'kaufland') clubCardName = 'Kaufland Card';
            else if (store === 'tesco') clubCardName = 'Clubcard';
            else if (store === 'penny') clubCardName = 'Penny Karta';
            else if (store === 'billa') clubCardName = 'Billa Club';
          }

          // Dates: current week
          const now = new Date();
          const validFrom = now.toISOString().split('T')[0];
          const nextWeek = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
          const validTo = nextWeek.toISOString().split('T')[0];

          // Calculate originalPrice if discountPercentage is known
          let originalPrice: number | undefined;
          if (discountPercentage && discountPercentage > 0 && discountPercentage < 90) {
            originalPrice = Math.round((salePrice / (1 - discountPercentage / 100)) * 10) / 10;
          }

          // Generate CDN image thumbnail URL from product slug
          const imageUrl = rawProductSlug
            ? `https://img.kupi.cz/kupi/thumbs/${rawProductSlug}_170_340.jpg`
            : undefined;

          results.push({
            id: `${store}-${discountId}`,
            store,
            title,
            category,
            salePrice,
            originalPrice,
            discountPercentage,
            unitPrice: rawUnitPrice
              ? {
                  price: parseCzkPrice(rawUnitPrice) || salePrice,
                  unit: rawUnitPrice.includes('kg') ? 'kg' : rawUnitPrice.includes('l') ? 'l' : '100g',
                  formatted: rawUnitPrice,
                }
              : undefined,
            validFrom,
            validTo,
            clubCardRequired: isClubCard,
            clubCardName,
            imageUrl,
          });
        } catch {
          // skip row parse error
        }
      });
    } catch (err) {
      console.warn(`[KupiAdapter] Error scraping ${url}:`, err);
    }
  }

  return results;
}
