import { useState } from 'preact/hooks';
import { useSalesData } from './hooks/useSalesData';
import { useSalesSearch } from './hooks/useSalesSearch';
import { useShoppingList } from './hooks/useShoppingList';
import { Header } from './components/Header';
import { StoreFilter } from './components/StoreFilter';
import { CategoryFilter } from './components/CategoryFilter';
import { SortBar } from './components/SortBar';
import { ProductCard } from './components/ProductCard';
import { ShoppingListDrawer } from './components/ShoppingListDrawer';
import { SearchX, Zap } from 'lucide-preact';

export function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { items: salesItems, lastUpdated, isLoading } = useSalesData();

  const {
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
    totalCount,
    filteredCount,
  } = useSalesSearch({ initialItems: salesItems });

  const {
    itemsByStore,
    totalPrice,
    totalSavings,
    totalItemCount,
    addItem,
    removeItem,
    updateQuantity,
    clearList,
    getItemQuantity,
  } = useShoppingList();

  const handleResetFilters = () => {
    setSearchQuery('');
    clearStoreFilters();
    setSelectedCategory('all');
    setOnlyClubCard(null);
  };

  return (
    <div class="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Sticky Header with Search */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenShoppingList={() => setIsDrawerOpen(true)}
        shoppingListCount={totalItemCount}
      />

      {/* Main Content Area */}
      <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Banner with Value Prop */}
        <div class="bg-gradient-to-r from-amber-500 via-amber-600 to-red-500 rounded-2xl p-4 sm:p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold mb-2 backdrop-blur-xs">
              <Zap class="w-3.5 h-3.5 text-yellow-200 fill-yellow-200" />
              <span>Bleskové vyhledávání</span>
            </div>
            <h1 class="text-xl sm:text-2xl font-black tracking-tight">
              Nejvýhodnější akce na potraviny v Česku
            </h1>
            <p class="text-xs sm:text-sm text-white/90 mt-1 max-w-xl">
              Prohledávejte slevy ze supermarketů Albert, Billa, Lidl, Kaufland, Penny, Tesco, Rohlík a Košík. Vše běží okamžitě přímo ve vašem mobilu.
            </p>
          </div>

          <div class="flex items-center gap-3 shrink-0 text-xs font-semibold bg-black/15 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-white/10">
            <div>
              <div class="text-base font-black text-amber-200">{totalCount}</div>
              <div class="text-[11px] text-white/80">Aktivních slev</div>
            </div>
            <div class="h-8 w-px bg-white/20" />
            <div>
              <div class="text-base font-black text-amber-200">8</div>
              <div class="text-[11px] text-white/80">Řetězců</div>
            </div>
            <div class="h-8 w-px bg-white/20" />
            <div>
              <div class="text-base font-black text-amber-200">Až -50%</div>
              <div class="text-[11px] text-white/80">Úspora</div>
            </div>
          </div>
        </div>

        {/* Filter Section: Stores & Categories */}
        <div class="space-y-2.5 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          {/* Store Selection Chips */}
          <div>
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Obchody
            </div>
            <StoreFilter
              selectedStores={selectedStores}
              onToggleStore={toggleStore}
              onClearStores={clearStoreFilters}
            />
          </div>

          {/* Category Pills */}
          <div>
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Kategorie
            </div>
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>
        </div>

        {/* Result Sort & Counts Bar */}
        <SortBar
          filteredCount={filteredCount}
          totalCount={totalCount}
          sortBy={sortBy}
          onSortChange={setSortBy}
          hideExpired={hideExpired}
          onToggleHideExpired={() => setHideExpired(!hideExpired)}
          onlyClubCard={onlyClubCard}
          onClubCardChange={setOnlyClubCard}
        />

        {/* Product Grid / Empty State */}
        {filteredCount === 0 ? (
          <div class="py-16 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs">
            <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <SearchX class="w-7 h-7" />
            </div>
            <h3 class="text-base font-bold text-slate-900">
              Nebyly nalezeny žádné slevy
            </h3>
            <p class="text-xs text-slate-500 max-w-sm mt-1 mb-4">
              Zkuste upravit hledaný výraz, zkontrolovat překlep, nebo resetovat zvolené filtry obchodů a kategorií.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              Resetovat všechny filtry
            </button>
          </div>
        ) : (
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4.5">
            {filteredItems.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                quantityInList={getItemQuantity(item.id)}
                onAddToList={addItem}
              />
            ))}
          </div>
        )}
      </main>

      {/* Shopping List Slide-Over Drawer */}
      <ShoppingListDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        itemsByStore={itemsByStore}
        totalPrice={totalPrice}
        totalSavings={totalSavings}
        totalItemCount={totalItemCount}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearList={clearList}
      />

      {/* Footer */}
      <footer class="mt-auto border-t border-slate-200 bg-white py-6">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div class="flex items-center gap-2">
            <span
              class={`w-2 h-2 rounded-full inline-block ${
                isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            <span>
              {isLoading
                ? 'Aktualizuji data slev...'
                : lastUpdated
                ? `Aktualizováno: ${new Date(lastUpdated).toLocaleDateString('cs-CZ', {
                    day: 'numeric',
                    month: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'Aktuální data pro září 2026'}
            </span>
          </div>
          <div class="flex items-center gap-4 text-slate-400">
            <span>Běží 100% v prohlížeči (Preact + MiniSearch)</span>
            <span>•</span>
            <span class="hover:text-slate-600 transition-colors">Žádné reklamy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
