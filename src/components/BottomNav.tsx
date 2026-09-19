import React from 'react';
import { Home, ShoppingCart, Calendar, History } from 'lucide-react';

export type NavTab = 'inicio' | 'compras' | 'resumo' | 'historico';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  pendingCount = 0,
}) => {
  const tabs = [
    {
      id: 'inicio' as NavTab,
      label: 'Início',
      icon: Home,
    },
    {
      id: 'compras' as NavTab,
      label: 'Compras',
      icon: ShoppingCart,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: 'resumo' as NavTab,
      label: 'Resumo Mensal',
      icon: Calendar,
    },
    {
      id: 'historico' as NavTab,
      label: 'Histórico',
      icon: History,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
      <div className="max-w-md mx-auto px-2">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 px-2 rounded-xl transition-all cursor-pointer relative ${
                  isActive
                    ? 'text-blue-600 font-semibold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.25]' : 'stroke-2'}`} />
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1 -right-2.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center leading-tight">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[11px] mt-1 tracking-tight leading-tight whitespace-nowrap ${isActive ? 'font-bold' : ''}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-6 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
