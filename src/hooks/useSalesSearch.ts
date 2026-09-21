import { useState, useMemo } from 'preact/hooks';
import MiniSearch from 'minisearch';
import type { SaleItem, StoreId, GroceryCategory, SortOption } from '../types/sales';
import { normalizeCzech, isPromotionActive } from '../utils/czechNormalize';
import { STORES } from '../data/mockSales';

export interface UseSalesSearchProps {
  initialItems: SaleItem[];
}

export function useSalesSearch({ initialItems }: UseSalesSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStores, setSelectedStores] = useState<StoreId[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<GroceryCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('discount_desc');
  const [hasCustomSort, setHasCustomSort] = useState(false);
  const [hideExpired, setHideExpired] = useState(true);
  const [onlyClubCard, setOnlyClubCard] = useState<boolean | null>(null); // null = all, true = only club card, false = no card required

  // Initialize and populate MiniSearch index once per dataset update
  const miniSearch = useMemo(() => {
    const ms = new MiniSearch<SaleItem & { storeName: string }>({
      fields: ['title', 'brand', 'category', 'store', 'storeName'],
      storeFields: ['id'],
      extractField: (document, fieldName) => {
        if (fieldName === 'storeName') {
          return STORES[document.store]?.name || document.store;
        }
        return (document as any)[fieldName];
      },
      tokenize: (text) => normalizeCzech(String(text)).split(/\W+/).filter(Boolean),
      searchOptions: {
        boost: { title: 3, brand: 2, storeName: 1.5, store: 1.5, category: 1 },
        prefix: true,
        fuzzy: 0.2,
        tokenize: (text) => normalizeCzech(String(text)).split(/\W+/).filter(Boolean),
      },
    });

    ms.addAll(initialItems as any);
    return ms;
  }, [initialItems]);

  // Handle explicit user sort change
  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setHasCustomSort(true);
  };

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let results: SaleItem[] = initialItems;
    const trimmedQuery = searchQuery.trim();
    let hitMap: Map<string, number> | null = null;

    // 1. Full-text search with MiniSearch if query is non-empty
    if (trimmedQuery.length > 0) {
      const searchHits = miniSearch.search(trimmedQuery);
      const hitIds = new Set(searchHits.map((h) => h.id));
      hitMap = new Map(searchHits.map((h) => [h.id, h.score]));
      results = results.filter((item) => hitIds.has(item.id));
    }

    // 2. High-performance single-pass metadata filtering
    const storeSet = selectedStores.length > 0 ? new Set(selectedStores) : null;
    results = results.filter((item) => {
      if (hideExpired && !isPromotionActive(item.validTo)) return false;
      if (storeSet && !storeSet.has(item.store)) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (onlyClubCard !== null) {
        if (onlyClubCard && !item.clubCardRequired) return false;
        if (!onlyClubCard && item.clubCardRequired) return false;
      }
      return true;
    });

    // 3. Determine active sorting strategy
    // If user is searching and hasn't explicitly overridden sorting, use relevance
    const effectiveSort: SortOption =
      trimmedQuery.length > 0 && !hasCustomSort ? 'relevance' : sortBy;

    // 4. Sort results
    return [...results].sort((a, b) => {
      switch (effectiveSort) {
        case 'relevance':
          if (hitMap) {
            const scoreDiff = (hitMap.get(b.id) || 0) - (hitMap.get(a.id) || 0);
            if (scoreDiff !== 0) return scoreDiff;
          }
          return (b.discountPercentage || 0) - (a.discountPercentage || 0);
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
    hasCustomSort,
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
    setSortBy: handleSortChange,
    hideExpired,
    setHideExpired,
    onlyClubCard,
    setOnlyClubCard,
    filteredItems,
    totalCount: initialItems.length,
    filteredCount: filteredItems.length,
  };
}
