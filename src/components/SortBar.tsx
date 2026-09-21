import type { SortOption } from '../types/sales';
import { ArrowUpDown, CalendarClock, CreditCard } from 'lucide-preact';

interface SortBarProps {
  filteredCount: number;
  totalCount: number;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  hideExpired: boolean;
  onToggleHideExpired: () => void;
  onlyClubCard: boolean | null;
  onClubCardChange: (val: boolean | null) => void;
}

export function SortBar({
  filteredCount,
  totalCount,
  sortBy,
  onSortChange,
  hideExpired,
  onToggleHideExpired,
  onlyClubCard,
  onClubCardChange,
}: SortBarProps) {
  return (
    <div class="flex flex-wrap items-center justify-between gap-3 pt-1 pb-3 text-xs border-b border-slate-200">
      {/* Result count */}
      <div class="text-slate-600 font-medium">
        Zobrazeno <span class="font-bold text-slate-900">{filteredCount}</span> z{' '}
        <span class="text-slate-500">{totalCount}</span> slev
      </div>

      {/* Controls */}
      <div class="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Date expiration toggle */}
        <button
          type="button"
          onClick={onToggleHideExpired}
          class={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
            hideExpired
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
          title="Filtrovat pouze probíhající akce"
        >
          <CalendarClock class="w-3.5 h-3.5" />
          <span>{hideExpired ? 'Pouze platné akce' : 'I prošlé akce'}</span>
        </button>

        {/* Club card toggle */}
        <div class="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => onClubCardChange(null)}
            class={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              onlyClubCard === null ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Všechny
          </button>
          <button
            type="button"
            onClick={() => onClubCardChange(false)}
            class={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              onlyClubCard === false ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Slevy pro všechny zákazníky bez nutnosti aplikace/karty"
          >
            Bez karty
          </button>
          <button
            type="button"
            onClick={() => onClubCardChange(true)}
            class={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              onlyClubCard === true ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Slevy vyžadující věrnostní aplikaci či kartu"
          >
            <CreditCard class="w-3 h-3" />
            <span>Klubové</span>
          </button>
        </div>

        {/* Sort Select */}
        <div class="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
          <ArrowUpDown class="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange((e.target as HTMLSelectElement).value as SortOption)}
            class="bg-transparent text-slate-800 text-xs font-semibold focus:outline-hidden cursor-pointer"
          >
            <option value="relevance">Nejlepší shoda</option>
            <option value="discount_desc">Nejvyšší sleva (%)</option>
            <option value="price_asc">Nejnižší cena (Kč)</option>
            <option value="price_desc">Nejvyšší cena (Kč)</option>
            <option value="unit_price_asc">Cena za jednotku (Kč/kg)</option>
            <option value="expiring_soon">Končící nejdříve</option>
          </select>
        </div>
      </div>
    </div>
  );
}
