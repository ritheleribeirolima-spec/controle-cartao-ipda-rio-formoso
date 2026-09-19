import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, ShoppingBag } from 'lucide-react';
import { Purchase, PurchaseFilter, AppMode } from '../types';
import { PurchaseCard } from './PurchaseCard';
import { getPurchaseSummary } from '../utils/calculations';

interface PurchasesViewProps {
  purchases: Purchase[];
  currentMode: AppMode;
  onOpenNewPurchase: () => void;
  onSelectPurchase: (purchase: Purchase) => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  currentMode,
  onOpenNewPurchase,
  onSelectPurchase,
}) => {
  const [filter, setFilter] = useState<PurchaseFilter>('todas');
  const [searchQuery, setSearchQuery] = useState('');

  const filterOptions: { id: PurchaseFilter; label: string }[] = [
    { id: 'todas', label: 'Todas' },
    { id: 'igreja', label: 'Igreja' },
    { id: 'particular', label: 'Particular' },
    { id: 'em_aberto', label: 'Em aberto' },
    { id: 'quitadas', label: 'Quitadas' },
  ];

  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const summary = getPurchaseSummary(purchase);

      // Category / Status Filter
      if (filter === 'igreja' && purchase.category !== 'igreja') return false;
      if (filter === 'particular' && purchase.category !== 'particular') return false;
      if (filter === 'em_aberto' && summary.isFullyPaid) return false;
      if (filter === 'quitadas' && !summary.isFullyPaid) return false;

      // Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchDesc = purchase.description.toLowerCase().includes(query);
        const matchNotes = purchase.notes?.toLowerCase().includes(query);
        if (!matchDesc && !matchNotes) return false;
      }

      return true;
    });
  }, [purchases, filter, searchQuery]);

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-300">
      {/* Top action row with Search & New Purchase button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por descrição ou observação..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs placeholder:text-slate-400 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 p-1"
            >
              Limpar
            </button>
          )}
        </div>

        {currentMode === 'admin' ? (
          <button
            id="purchases-new-button"
            onClick={onOpenNewPurchase}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-xl transition-all shadow-sm cursor-pointer flex-shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nova compra</span>
          </button>
        ) : (
          <div className="text-xs text-slate-400 self-center hidden sm:block">
            Modo Consulta
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {filterOptions.map((opt) => {
          const isActive = filter === opt.id;
          return (
            <button
              key={opt.id}
              id={`filter-btn-${opt.id}`}
              onClick={() => setFilter(opt.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Purchases List */}
      {filteredPurchases.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center my-6">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-3">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Nenhuma compra encontrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `Não foram encontrados resultados para "${searchQuery}".`
              : 'Nenhuma compra cadastrada nesta categoria.'}
          </p>
          {currentMode === 'admin' && (
            <button
              onClick={onOpenNewPurchase}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar nova compra</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredPurchases.map((purchase) => (
            <PurchaseCard
              key={purchase.id}
              purchase={purchase}
              onClick={() => onSelectPurchase(purchase)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
