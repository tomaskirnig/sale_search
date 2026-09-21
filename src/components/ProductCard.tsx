import { useState } from 'preact/hooks';
import type { SaleItem } from '../types/sales';
import { STORES } from '../data/mockSales';
import { formatCzechDate, formatCzk } from '../utils/czechNormalize';
import { Plus, Check, ShoppingBag, CreditCard, Clock } from 'lucide-preact';

interface ProductCardProps {
  item: SaleItem;
  quantityInList: number;
  onAddToList: (item: SaleItem) => void;
}

export function ProductCard({
  item,
  quantityInList,
  onAddToList,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const storeInfo = STORES[item.store];

  return (
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col group relative">
      {/* Top Media Area with Badges */}
      <div class="relative w-full pt-[72%] bg-slate-50 overflow-hidden">
        {!imageError && item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            loading="lazy"
            class="absolute inset-0 w-full h-full object-contain p-2.5 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 text-center">
            <ShoppingBag class="w-10 h-10 stroke-1 text-slate-300 mb-1" />
            <span class="text-[11px] font-medium text-slate-400">Obrázek nedostupný</span>
          </div>
        )}

        {/* Store Badge */}
        <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur shadow-xs text-xs font-bold text-slate-800">
          <span
            class="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: storeInfo?.color || '#64748b' }}
          />
          <span>{storeInfo?.name || item.store}</span>
        </div>

        {/* Discount Badge */}
        {item.discountPercentage && item.discountPercentage > 0 && (
          <div class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-red-600 text-white font-extrabold text-xs tracking-tight shadow-sm">
            -{item.discountPercentage}%
          </div>
        )}

        {/* Club Card Badge (if required) */}
        {item.clubCardRequired && (
          <div class="absolute bottom-2 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/90 text-slate-950 font-bold text-[10px] tracking-tight backdrop-blur shadow-2xs">
            <CreditCard class="w-3 h-3" />
            <span>{item.clubCardName || 'Klubová karta'}</span>
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div class="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand */}
          {item.brand && (
            <p class="text-[11px] font-semibold tracking-wide text-slate-400 uppercase truncate">
              {item.brand}
            </p>
          )}

          {/* Title */}
          <h3 class="text-sm font-bold text-slate-900 leading-snug line-clamp-2 mt-0.5 group-hover:text-amber-600 transition-colors">
            {item.title}
          </h3>
        </div>

        {/* Pricing, Unit Price & Validity */}
        <div class="mt-3 pt-2.5 border-t border-slate-100">
          <div class="flex items-baseline justify-between gap-1">
            <div class="flex items-baseline gap-1.5">
              <span class="text-lg font-black text-slate-900 tracking-tight">
                {formatCzk(item.salePrice)}
              </span>
              {item.originalPrice && (
                <span class="text-xs text-slate-400 line-through">
                  {formatCzk(item.originalPrice)}
                </span>
              )}
            </div>

            {/* Unit Price */}
            {item.unitPrice && (
              <span class="text-[11px] font-medium text-slate-500 shrink-0">
                {item.unitPrice.formatted}
              </span>
            )}
          </div>

          {/* Footer action bar */}
          <div class="mt-2.5 flex items-center justify-between gap-2">
            {/* Validity date badge */}
            <div class="flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <Clock class="w-3 h-3 text-slate-400" />
              <span>{formatCzechDate(item.validTo)}</span>
            </div>

            {/* Add to shopping list button */}
            <button
              type="button"
              onClick={() => onAddToList(item)}
              class={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                quantityInList > 0
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
              }`}
              title="Přidat do nákupního seznamu"
            >
              {quantityInList > 0 ? (
                <>
                  <Check class="w-3.5 h-3.5 text-amber-700 stroke-[2.5]" />
                  <span>v košíku ({quantityInList})</span>
                </>
              ) : (
                <>
                  <Plus class="w-3.5 h-3.5 text-slate-600 stroke-[2.5]" />
                  <span>Přidat</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
