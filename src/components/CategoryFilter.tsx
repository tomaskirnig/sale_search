import type { GroceryCategory } from '../types/sales';
import { CATEGORIES } from '../data/mockSales';

interface CategoryFilterProps {
  selectedCategory: GroceryCategory | 'all';
  onSelectCategory: (category: GroceryCategory | 'all') => void;
}

export function CategoryFilter({
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
      <button
        type="button"
        onClick={() => onSelectCategory('all')}
        class={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
          selectedCategory === 'all'
            ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
        }`}
      >
        <span>🛒</span>
        <span>Všechny kategorie</span>
      </button>

      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategory === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            class={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
              isSelected
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
