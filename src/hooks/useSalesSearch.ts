import { useState, useMemo } from 'preact/hooks';
import MiniSearch from 'minisearch';
import type { SaleItem, StoreId, GroceryCategory, SortOption } from '../types/sales';
import { normalizeCzech, isPromotionActive } from '../utils/czechNormalize';

export interface UseSalesSearchProps {
  initialItems: SaleItem[];
}

export function useSalesSearch({ initialItems }: UseSalesSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStores, setSelectedStores] = useState<StoreId[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<GroceryCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('discount_desc');
  const [hideExpired, setHideExpired] = useState(true);
  const [onlyClubCard, setOnlyClubCard] = useState<boolean | null>(null); // null = all, true = only club card, false = no card required

  // Initialize and populate MiniSearch index once
  const miniSearch = useMemo(() => {
    const ms = new MiniSearch<SaleItem>({
      fields: ['title', 'brand', 'category'],
      storeFields: ['id'],
      tokenize: (text) => normalizeCzech(text).split(/\W+/).filter(Boolean),
      searchOptions: {
        boost: { title: 3, brand: 2, category: 1 },
        prefix: true,
        fuzzy: 0.2,
        tokenize: (text) => normalizeCzech(text).split(/\W+/).filter(Boolean),
      },
    });

    ms.addAll(initialItems);
    return ms;
  }, [initialItems]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let results: SaleItem[] = initialItems;

    // 1. Full-text search with MiniSearch if query is non-empty
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length > 0) {
      const searchHits = miniSearch.search(trimmedQuery);
      const hitIds = new Set(searchHits.map((h) => h.id));
      // Keep search order for relevance, or filter
      const hitMap = new Map(searchHits.map((h) => [h.id, h.score]));
      results = results
        .filter((item) => hitIds.has(item.id))
        .sort((a, b) => (hitMap.get(b.id) || 0) - (hitMap.get(a.id) || 0));
    }

    // 2. Filter by expiration date
    if (hideExpired) {
      results = results.filter((item) => isPromotionActive(item.validTo));
    }

    // 3. Filter by store
    if (selectedStores.length > 0) {
      const storeSet = new Set(selectedStores);
      results = results.filter((item) => storeSet.has(item.store));
    }

    // 4. Filter by category
    if (selectedCategory !== 'all') {
      results = results.filter((item) => item.category === selectedCategory);
    }

    // 5. Filter by club card requirement if set
    if (onlyClubCard !== null) {
      results = results.filter((item) => (onlyClubCard ? item.clubCardRequired : !item.clubCardRequired));
    }

    // 6. Sort results (only if not relying solely on search relevance, or apply user selected sort)
    return [...results].sort((a, b) => {
      switch (sortBy) {
        case 'discount_desc':
          return (b.discountPercentage || 0) - (a.discountPercentage || 0);
        case 'price_asc':
          return a.salePrice - b.salePrice;
        case 'price_desc':
          return b.salePrice - a.salePrice;
        case 'unit_price_asc': {
          const aUnit = a.unitPrice?.price ?? Infinity;
          const bUnit = b.unitPrice?.price ?? Infinity;
          return aUnit - bUnit;
        }
        case 'expiring_soon':
          return a.validTo.localeCompare(b.validTo);
        default:
          return 0;
      }
    });
  }, [
    initialItems,
    searchQuery,
    selectedStores,
    selectedCategory,
    sortBy,
    hideExpired,
    onlyClubCard,
    miniSearch,
  ]);

  const toggleStore = (storeId: StoreId) => {
    setSelectedStores((prev) =>
      prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
    );
  };

  const clearStoreFilters = () => setSelectedStores([]);

  return {
    searchQuery,
    setSearchQuery,
    selectedStores,
    toggleStore,
    clearStoreFilters,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    hideExpired,
    setHideExpired,
    onlyClubCard,
    setOnlyClubCard,
    filteredItems,
    totalCount: initialItems.length,
    filteredCount: filteredItems.length,
  };
}
