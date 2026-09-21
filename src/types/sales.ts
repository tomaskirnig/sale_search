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
  | 'dairy_eggs'        // Mléčné výrobky a vejce
  | 'meat_fish'         // Maso, uzeniny a ryby
  | 'bakery'            // Pečivo a pekárenské zboží
  | 'fruits_vegetables' // Ovoce a zelenina
  | 'beverages'         // Nealko i alko nápoje
  | 'sweets_snacks'     // Sladkosti a slané
  | 'pantry'            // Trvanlivé potraviny, oleje, těstoviny
  | 'frozen'            // Mražené potraviny
  | 'drugstore_home'    // Drogerie a domácnost
  | 'other';

export interface SaleItem {
  id: string;                      // Unique hash: e.g. "albert-123456"
  store: StoreId;                  // 'albert' | 'billa' | 'lidl' | 'kaufland' | 'penny' | 'tesco' | 'rohlik' | 'kosik'
  title: string;                   // e.g. "Madeta Jihočeské máslo 250g"
  brand?: string;                  // e.g. "Madeta"
  category: GroceryCategory;       // Category enum
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
  imageUrl?: string;               // Thumbnail
  detailUrl?: string;              // Direct link to item/leaflet
}

export interface StoreInfo {
  id: StoreId;
  name: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  accentBg: string;
}

export interface CategoryInfo {
  id: GroceryCategory;
  name: string;
  icon: string;
}

export type SortOption =
  | 'relevance'     // Nejlepší shoda (při vyhledávání)
  | 'discount_desc' // Nejvyšší sleva
  | 'price_asc'     // Nejnižší cena
  | 'price_desc'    // Nejvyšší cena
  | 'unit_price_asc'// Cena za měrnou jednotku
  | 'expiring_soon';// Končící nejdříve

export interface ShoppingListItem {
  item: SaleItem;
  quantity: number;
  checked?: boolean;
}
