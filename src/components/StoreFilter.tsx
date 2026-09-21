import type { StoreId } from '../types/sales';
import { STORES } from '../data/mockSales';
import { hapticFeedback } from '../utils/haptics';

interface StoreFilterProps {
  selectedStores: StoreId[];
  onToggleStore: (storeId: StoreId) => void;
  onClearStores: () => void;
}

export function StoreFilter({
  selectedStores,
  onToggleStore,
  onClearStores,
}: StoreFilterProps) {
  const storeList = Object.values(STORES);

  return (
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
      <button
        type="button"
        onClick={() => {
          hapticFeedback('light');
          onClearStores();
        }}
        class={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer active:scale-95 ${
          selectedStores.length === 0
            ? 'bg-slate-900 text-white shadow-xs'
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
        }`}
      >
        Všechny obchody
      </button>

      {storeList.map((store) => {
        const isSelected = selectedStores.includes(store.id);
        return (
          <button
            key={store.id}
            type="button"
            onClick={() => {
              hapticFeedback('light');
              onToggleStore(store.id);
            }}
            class={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border active:scale-95 ${
              isSelected
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span
              class="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: store.color }}
            />
            <span>{store.name}</span>
          </button>
        );
      })}
    </div>
  );
}
