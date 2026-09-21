import { useState, useEffect, useRef } from 'preact/hooks';
import { ShoppingBag, Search, X, Tag } from 'lucide-preact';
import { hapticFeedback } from '../utils/haptics';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenShoppingList: () => void;
  shoppingListCount: number;
}

export function Header({
  searchQuery,
  onSearchChange,
  onOpenShoppingList,
  shoppingListCount,
}: HeaderProps) {
  const [isBouncing, setIsBouncing] = useState(false);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const prevCountRef = useRef(shoppingListCount);

  // Bounce animation when items are added to list
  useEffect(() => {
    if (shoppingListCount > prevCountRef.current) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 400);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = shoppingListCount;
  }, [shoppingListCount]);

  // Global '/' keyboard shortcut to focus search on desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        desktopInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCartClick = () => {
    hapticFeedback('medium');
    onOpenShoppingList();
  };

  return (
    <header class="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
        {/* ========================================================= */}
        {/* MOBILE VIEW (< 640px):                                    */}
        {/* Left: 2 rows (Row 1 Logo, Row 2 Search)                   */}
        {/* Right: Cart Button spanning across BOTH rows!             */}
        {/* ========================================================= */}
        <div class="flex sm:hidden items-stretch gap-2">
          {/* Left Column: Row 1 Logo, Row 2 Search Bar */}
          <div class="flex-1 flex flex-col justify-between gap-1.5 min-w-0">
            {/* Row 1: Brand & Logo */}
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-white shadow-2xs shrink-0">
                <Tag class="w-4 h-4" />
              </div>
              <div class="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5 truncate">
                <span>Akce<span class="text-amber-600">Potraviny</span></span>
                <span class="text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                  ČR
                </span>
              </div>
            </div>

            {/* Row 2: Search Input Bar */}
            <div class="relative w-full">
              <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onInput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
                placeholder="Hledat máslo, pivo, vejce..."
                class="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-100 border border-transparent focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs text-slate-900 placeholder:text-slate-400 transition-all outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  class="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Vymazat hledání"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Cart Button spanning across BOTH rows */}
          <div class="shrink-0 flex items-stretch">
            <button
              type="button"
              onClick={handleCartClick}
              class={`w-[66px] self-stretch flex flex-col items-center justify-center gap-1 p-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95 border border-slate-800 ${
                isBouncing ? 'ring-2 ring-amber-400 scale-105' : ''
              }`}
              title="Otevřít nákupní lístek"
            >
              <div class="relative">
                <ShoppingBag class={`w-5 h-5 text-amber-400 transition-transform ${isBouncing ? 'scale-125' : ''}`} />
                {shoppingListCount > 0 && (
                  <span class={`absolute -top-1.5 -right-2.5 inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-black bg-amber-500 text-slate-950 rounded-full min-w-4 shadow-2xs transition-transform ${isBouncing ? 'scale-125' : ''}`}>
                    {shoppingListCount}
                  </span>
                )}
              </div>
              <span class="text-[11px] font-bold text-slate-100 leading-none">
                Lístek
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* DESKTOP / TABLET VIEW (>= 640px): Standard single line    */}
        {/* ========================================================= */}
        <div class="hidden sm:flex sm:items-center justify-between gap-6">
          {/* Logo & Brand */}
          <div class="flex items-center gap-2.5 shrink-0">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-white shadow-xs">
              <Tag class="w-5 h-5" />
            </div>
            <div>
              <div class="font-extrabold text-xl tracking-tight text-slate-900 flex items-center gap-1.5">
                Akce<span class="text-amber-600">Potraviny</span>
                <span class="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  ČR
                </span>
              </div>
              <p class="text-xs text-slate-500">
                Slevy ze všech českých supermarketů na jednom místě
              </p>
            </div>
          </div>

          {/* Centered Search Bar */}
          <div class="flex-1 max-w-xl relative">
            <div class="relative flex items-center">
              <Search class="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                ref={desktopInputRef}
                type="text"
                value={searchQuery}
                onInput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
                placeholder="Hledat máslo, pivo, vejce, kuřecí..."
                class="w-full pl-10 pr-16 py-2 rounded-xl bg-slate-100 border border-transparent focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-hidden"
              />
              <div class="absolute right-2.5 flex items-center gap-1.5">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    class="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                    aria-label="Vymazat hledání"
                  >
                    <X class="w-4 h-4" />
                  </button>
                ) : (
                  <kbd class="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-200/70 border border-slate-300/60 rounded">
                    /
                  </kbd>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Cart Action Button */}
          <div class="shrink-0">
            <button
              type="button"
              onClick={handleCartClick}
              class={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-all shadow-xs cursor-pointer active:scale-95 ${
                isBouncing ? 'ring-2 ring-amber-400 scale-105' : ''
              }`}
              title="Nákupní seznam"
            >
              <ShoppingBag class={`w-4 h-4 text-amber-400 transition-transform ${isBouncing ? 'scale-125' : ''}`} />
              <span>Nákupní lístek</span>
              {shoppingListCount > 0 && (
                <span class={`inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-full min-w-5 transition-transform ${isBouncing ? 'scale-125' : ''}`}>
                  {shoppingListCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
