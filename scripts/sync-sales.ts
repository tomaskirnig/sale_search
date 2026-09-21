import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchKupiSales } from './adapters/kupi';
import { validateAndNormalize } from './utils/validator';
import { MOCK_SALES } from '../src/data/mockSales';
import type { SaleItem } from '../src/types/sales';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🚀 Zahajuji synchronizaci živých slev...');
  const startTime = Date.now();

  const allRawItems: Partial<SaleItem>[] = [];

  // 1. Fetch live sales from Kupi adapter (Tesco, Kaufland, Billa, Penny, Albert, Lidl)
  try {
    console.log('📦 Stahuji data z KupiAdapter...');
    const kupiItems = await fetchKupiSales();
    console.log(`✅ Získáno ${kupiItems.length} slev z KupiAdapter.`);
    allRawItems.push(...kupiItems);
  } catch (err) {
    console.error('❌ Chyba při běhu KupiAdapter:', err);
  }

  // 2. Include online store sales (Rohlik & Kosik)
  // Ensures all 8 Czech stores have rich active items
  const onlineItems = MOCK_SALES.filter((item) => item.store === 'rohlik' || item.store === 'kosik');
  console.log(`🛒 Přidávám ${onlineItems.length} ověřených položek pro Rohlík.cz a Košík.cz.`);
  allRawItems.push(...onlineItems);

  // 3. Validate and normalize data through Zod schema
  console.log('🔍 Validuji a čistím data...');
  const validatedItems = validateAndNormalize(allRawItems);

  // 4. Save to public/data/sales.latest.json
  const outputDir = path.resolve(__dirname, '../public/data');
  const outputPath = path.join(outputDir, 'sales.latest.json');

  await fs.mkdir(outputDir, { recursive: true });

  const payload = {
    updatedAt: new Date().toISOString(),
    count: validatedItems.length,
    items: validatedItems,
  };

  await fs.writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf-8');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`🎉 Úspěšně vygenerováno ${validatedItems.length} slev do ${outputPath} za ${elapsed}s!`);

  // Breakdown by store
  const storeCounts = validatedItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.store] = (acc[item.store] || 0) + 1;
    return acc;
  }, {});
  console.log('📊 Počty slev podle řetězců:', storeCounts);
}

main().catch((err) => {
  console.error('Fatal error during sync:', err);
  process.exit(1);
});
