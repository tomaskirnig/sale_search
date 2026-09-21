import { z } from 'zod';
import type { SaleItem } from '../../src/types/sales';

export const SaleItemSchema = z.object({
  id: z.string().min(1),
  store: z.enum([
    'albert',
    'billa',
    'lidl',
    'kaufland',
    'penny',
    'tesco',
    'rohlik',
    'kosik',
  ]),
  title: z.string().min(1),
  brand: z.string().optional(),
  category: z.enum([
    'dairy_eggs',
    'meat_fish',
    'bakery',
    'fruits_vegetables',
    'beverages',
    'sweets_snacks',
    'pantry',
    'frozen',
    'drugstore_home',
    'other',
  ]),
  originalPrice: z.number().positive().optional(),
  salePrice: z.number().positive(),
  discountPercentage: z.number().min(0).max(100).optional(),
  unitPrice: z
    .object({
      price: z.number().positive(),
      unit: z.enum(['kg', 'l', 'ks', '100g']),
      formatted: z.string(),
    })
    .optional(),
  validFrom: z.string(),
  validTo: z.string(),
  clubCardRequired: z.boolean().default(false),
  clubCardName: z.string().optional(),
  imageUrl: z.string().optional(),
  detailUrl: z.string().optional(),
});

/**
 * Validates an array of raw items, discarding malformed ones and computing missing discount percentages.
 */
export function validateAndNormalize(rawItems: unknown[]): SaleItem[] {
  const validItems: SaleItem[] = [];
  const seenIds = new Set<string>();

  for (const raw of rawItems) {
    const result = SaleItemSchema.safeParse(raw);
    if (!result.success) {
      // Silently skip or debug invalid items
      continue;
    }

    const item = result.data as SaleItem;

    // Deduplicate by ID
    if (seenIds.has(item.id)) {
      continue;
    }
    seenIds.add(item.id);

    // If discount percentage is missing but originalPrice is provided, compute it
    if (!item.discountPercentage && item.originalPrice && item.originalPrice > item.salePrice) {
      item.discountPercentage = Math.round(
        ((item.originalPrice - item.salePrice) / item.originalPrice) * 100
      );
    }

    validItems.push(item);
  }

  return validItems;
}
