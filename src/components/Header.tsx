import React, { useState } from 'react';
import { CreditCard, Eye, ShieldCheck, Share2, Info, Church, ChevronDown } from 'lucide-react';
import { AppMode } from '../types';

interface HeaderProps {
  currentMode: AppMode;
  onToggleMode: (mode: AppMode) => void;
  onOpenShare: () => void;
  onOpenBackupModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onToggleMode,
  onOpenShare,
  onOpenBackupModal,
}) => {
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-inner flex-shrink-0">
              <Church className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-['Outfit'] font-bold text-base sm:text-lg tracking-tight text-white leading-tight">
                  IPDA Rio Formoso
                </h1>
              </div>
              <p className="text-xs text-slate-300 font-medium flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                <span>Controle do Cartão</span>
              </p>
            </div>
          </div>

          {/* Right actions: Mode Selector & Share */}
          <div className="flex items-center gap-2">
            {/* Quick Share Button */}
            <button
              id="header-share-btn"
              onClick={onOpenShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-medium transition-colors border border-slate-700 cursor-pointer"
              title="Compartilhar resumo via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Compartilhar</span>
            </button>

            {/* Mode Switcher Pill */}
            <div className="relative">
              <button
                id="header-mode-toggle-btn"
                onClick={() => setShowModeDropdown(!showModeDropdown)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                  currentMode === 'admin'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30'
                }`}
                title="Alterar modo de acesso"
              >
                {currentMode === 'admin' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span>{currentMode === 'admin' ? 'Admin' : 'Consulta'}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {/* Mode Dropdown */}
              {showModeDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowModeDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-2 z-50 text-slate-200 text-xs">
                    <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/60 mb-1">
                      Modo de Acesso
                    </div>

                    <button
                      onClick={() => {
                        onToggleMode('view');
                        setShowModeDropdown(false);
                      }}
                      className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                        currentMode === 'view' ? 'bg-blue-600/30 text-white' : 'hover:bg-slate-700/60 text-slate-300'
                      }`}
                    >
                      <Eye className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-sm">Visualização (Consulta)</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          Apenas leitura para consultar parcelas, saldos e resumos.
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onToggleMode('admin');
                        setShowModeDropdown(false);
                      }}
                      className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer mt-1 ${
                        currentMode === 'admin' ? 'bg-amber-500/30 text-white' : 'hover:bg-slate-700/60 text-slate-300'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-sm">Administração</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          Permite cadastrar compras, registrar pagamentos e editar.
                        </div>
                      </div>
                    </button>

                    {onOpenBackupModal && (
                      <div className="pt-1.5 mt-1.5 border-t border-slate-700">
                        <button
                          onClick={() => {
                            onOpenBackupModal();
                            setShowModeDropdown(false);
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-700/60 text-slate-300 cursor-pointer text-left"
                        >
                          <Info className="w-3.5 h-3.5 text-slate-400" />
                          <span>Backup e Dados do Sistema</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
