import { useState, useEffect } from 'preact/hooks';
import type { ShoppingListItem, StoreId } from '../types/sales';
import { STORES } from '../data/mockSales';
import { formatCzk } from '../utils/czechNormalize';
import { hapticFeedback } from '../utils/haptics';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Copy,
  Check,
  ShoppingBag,
  Share2,
} from 'lucide-preact';

interface ShoppingListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  itemsByStore: Record<StoreId, ShoppingListItem[]>;
  totalPrice: number;
  totalSavings: number;
  totalItemCount: number;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearList: () => void;
  onToggleCheck: (itemId: string) => void;
}

export function ShoppingListDrawer({
  isOpen,
  onClose,
  itemsByStore,
  totalPrice,
  totalSavings,
  totalItemCount,
  onUpdateQuantity,
  onRemoveItem,
  onClearList,
  onToggleCheck,
}: ShoppingListDrawerProps) {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const storesWithItems = Object.entries(itemsByStore).filter(
    ([, items]) => items.length > 0
  ) as [StoreId, ShoppingListItem[]][];

  const buildShoppingListText = () => {
    let text = `🛒 MŮJ NÁKUPNÍ SEZNAM (Celkem: ${formatCzk(totalPrice)})\n\n`;

    storesWithItems.forEach(([storeId, list]) => {
      const store = STORES[storeId];
      text += `📍 ${store?.name || storeId.toUpperCase()}:\n`;
      list.forEach(({ item, quantity, checked }) => {
        const mark = checked ? '✓ ' : '• ';
        text += `  ${mark}${quantity}x ${item.title} – ${formatCzk(item.salePrice * quantity)}\n`;
      });
      text += '\n';
    });
    return text;
  };

  // Share via Web Share API or copy fallback
  const handleShare = async () => {
    hapticFeedback('medium');
    const text = buildShoppingListText();

    if (canShare) {
      try {
        await navigator.share({
          title: 'Můj nákupní lístek – AkcePotraviny',
          text,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return; // User closed sheet
      }
    }

    handleCopy();
  };

  // Copy shopping list formatted as text
  const handleCopy = () => {
    hapticFeedback('light');
    const text = buildShoppingListText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      class={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
        isOpen ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop with fade transition */}
      <div
        class={`fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div class="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10 pointer-events-none">
        {/* Slide-over panel with smooth translate-x transition */}
        <div
          class={`w-screen max-w-md bg-white shadow-2xl flex flex-col pointer-events-auto transform transition-transform duration-300 ease-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div class="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-2xs">
                <ShoppingBag class="w-4 h-4" />
              </div>
              <div>
                <h2 class="font-extrabold text-base text-slate-900">
                  Nákupní lístek
                </h2>
                <p class="text-xs text-slate-500">
                  {totalItemCount} {totalItemCount === 1 ? 'položka' : totalItemCount < 5 ? 'položky' : 'položek'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              class="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Zavřít lístek"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
            {storesWithItems.length === 0 ? (
              <div class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <ShoppingBag class="w-14 h-14 stroke-1 text-slate-300 mb-3" />
                <h3 class="text-base font-bold text-slate-700">Seznam je prázdný</h3>
                <p class="text-xs text-slate-400 mt-1 max-w-xs">
                  Kliknutím na tlačítko "Přidat" u jakékoliv slevy si položku uložíte do tohoto nákupního lístku.
                </p>
              </div>
            ) : (
              storesWithItems.map(([storeId, list]) => {
                const store = STORES[storeId];
                const storeSubtotal = list.reduce(
                  (sum, i) => sum + i.item.salePrice * i.quantity,
                  0
                );

                return (
                  <div
                    key={storeId}
                    class="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 overflow-hidden shadow-2xs"
                  >
                    {/* Store Title Bar */}
                    <div class="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
                      <div class="flex items-center gap-2">
                        <span
                          class="w-3 h-3 rounded-full"
                          style={{ backgroundColor: store?.color || '#333' }}
                        />
                        <span class="font-bold text-sm text-slate-900">
                          {store?.name || storeId}
                        </span>
                      </div>
                      <span class="text-xs font-extrabold text-slate-700">
                        {formatCzk(storeSubtotal)}
                      </span>
                    </div>

                    {/* Store items list */}
                    <div class="space-y-2.5">
                      {list.map(({ item, quantity, checked }) => (
                        <div
                          key={item.id}
                          class={`flex items-center justify-between gap-2.5 p-2.5 rounded-lg border transition-all ${
                            checked
                              ? 'bg-slate-50/70 border-slate-200 opacity-60'
                              : 'bg-white border-slate-200/80 shadow-2xs'
                          }`}
                        >
                          {/* Checkbox for checking off in shop */}
                          <button
                            type="button"
                            onClick={() => {
                              hapticFeedback('light');
                              onToggleCheck(item.id);
                            }}
                            class={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                              checked
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 hover:border-slate-400 bg-white'
                            }`}
                            title={checked ? 'Označit jako nekoupené' : 'Označit jako koupené'}
                          >
                            {checked && <Check class="w-3.5 h-3.5 stroke-[3]" />}
                          </button>

                          {/* Item info */}
                          <div
                            class="flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              hapticFeedback('light');
                              onToggleCheck(item.id);
                            }}
                          >
                            <h4
                              class={`text-xs font-bold truncate transition-colors ${
                                checked ? 'text-slate-400 line-through' : 'text-slate-900'
                              }`}
                            >
                              {item.title}
                            </h4>
                            <div class="flex items-center gap-2 mt-0.5">
                              <span class="text-xs font-extrabold text-amber-700">
                                {formatCzk(item.salePrice * quantity)}
                              </span>
                              {quantity > 1 && (
                                <span class="text-[10px] text-slate-400">
                                  ({formatCzk(item.salePrice)} / ks)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quantity control */}
                          <div class="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                hapticFeedback('light');
                                onUpdateQuantity(item.id, -1);
                              }}
                              class="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer transition-colors active:scale-95"
                              title="Snížit počet"
                            >
                              <Minus class="w-3 h-3" />
                            </button>
                            <span class="text-xs font-bold text-slate-800 w-4 text-center">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                hapticFeedback('light');
                                onUpdateQuantity(item.id, 1);
                              }}
                              class="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer transition-colors active:scale-95"
                              title="Zvýšit počet"
                            >
                              <Plus class="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                hapticFeedback('medium');
                                onRemoveItem(item.id);
                              }}
                              class="w-6 h-6 rounded-md text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer transition-colors ml-0.5 active:scale-95"
                              title="Odebrat z lístku"
                            >
                              <Trash2 class="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer Summary */}
          {storesWithItems.length > 0 && (
            <div class="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3">
              <div class="space-y-1">
                {totalSavings > 0 && (
                  <div class="flex justify-between text-xs text-emerald-700 font-semibold">
                    <span>Ušetříte celkem:</span>
                    <span>-{formatCzk(totalSavings)}</span>
                  </div>
                )}
                <div class="flex justify-between text-sm sm:text-base font-black text-slate-900">
                  <span>Celková cena:</span>
                  <span class="text-amber-600">{formatCzk(totalPrice)}</span>
                </div>
              </div>

              {/* Actions */}
              <div class="flex gap-2">
                {canShare ? (
                  <button
                    type="button"
                    onClick={handleShare}
                    class="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer active:scale-95 shadow-xs"
                  >
                    <Share2 class="w-4 h-4 text-amber-400" />
                    <span>Sdílet lístek</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCopy}
                    class="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer active:scale-95 shadow-xs"
                  >
                    {copied ? (
                      <>
                        <Check class="w-4 h-4 text-emerald-400" />
                        <span>Zkopírováno!</span>
                      </>
                    ) : (
                      <>
                        <Copy class="w-4 h-4 text-slate-300" />
                        <span>Zkopírovat seznam</span>
                      </>
                    )}
                  </button>
                )}

                {canShare && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    class="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer active:scale-95 shadow-2xs"
                    title="Kopírovat do schránky"
                  >
                    {copied ? <Check class="w-4 h-4 text-emerald-600" /> : <Copy class="w-4 h-4 text-slate-500" />}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClearList}
                  class="py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors cursor-pointer active:scale-95"
                  title="Smazat celý seznam"
                >
                  Vymazat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
