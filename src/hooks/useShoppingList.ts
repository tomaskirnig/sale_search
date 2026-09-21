import { useState, useEffect } from 'preact/hooks';
import type { SaleItem, ShoppingListItem, StoreId } from '../types/sales';

const STORAGE_KEY = 'ceske_akce_nakupni_seznam';

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingListItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save shopping list to localStorage', e);
    }
  }, [items]);

  const addItem = (item: SaleItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.item.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.item.id === itemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as ShoppingListItem[]
    );
  };

  const clearList = () => setItems([]);

  const toggleCheck = (itemId: string) => {
    setItems((prev) =>
      prev.map((i) => (i.item.id === itemId ? { ...i, checked: !i.checked } : i))
    );
  };

  const setShoppingList = (newItems: ShoppingListItem[]) => {
    setItems(newItems);
  };

  const isInList = (itemId: string) => items.some((i) => i.item.id === itemId);

  const getItemQuantity = (itemId: string) =>
    items.find((i) => i.item.id === itemId)?.quantity || 0;

  // Grouped by store
  const itemsByStore = items.reduce<Record<StoreId, ShoppingListItem[]>>((acc, curr) => {
    const store = curr.item.store;
    if (!acc[store]) acc[store] = [];
    acc[store].push(curr);
    return acc;
  }, {} as Record<StoreId, ShoppingListItem[]>);

  // Total price and savings
  const totalPrice = items.reduce(
    (sum, i) => sum + i.item.salePrice * i.quantity,
    0
  );

  const totalSavings = items.reduce((sum, i) => {
    if (i.item.originalPrice) {
      return sum + (i.item.originalPrice - i.item.salePrice) * i.quantity;
    }
    return sum;
  }, 0);

  const totalItemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return {
    items,
    itemsByStore,
    totalPrice,
    totalSavings,
    totalItemCount,
    addItem,
    removeItem,
    updateQuantity,
    clearList,
    toggleCheck,
    setShoppingList,
    isInList,
    getItemQuantity,
  };
}
