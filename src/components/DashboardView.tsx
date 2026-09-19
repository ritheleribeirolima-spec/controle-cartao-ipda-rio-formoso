import React from 'react';
import { 
  Calendar, 
  CreditCard, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Share2, 
  Plus, 
  Church, 
  User, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { Purchase, AppMode, Installment } from '../types';
import { calculateDashboardMetrics, NextDueDateSummary } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import { formatDateBR } from '../utils/dateUtils';

interface DashboardViewProps {
  purchases: Purchase[];
  currentMode: AppMode;
  onOpenNewPurchase: () => void;
  onOpenPurchaseDetail: (purchase: Purchase) => void;
  onOpenShare: (nextDue: NextDueDateSummary) => void;
  onPayInstallments: (items: { purchase: Purchase; installment: Installment }[]) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  purchases,
  currentMode,
  onOpenNewPurchase,
  onOpenPurchaseDetail,
  onOpenShare,
  onPayInstallments,
}) => {
  const metrics = calculateDashboardMetrics(purchases);
  const { nextDue } = metrics;

  const handlePayNextDueInstallments = () => {
    if (nextDue.installments.length > 0) {
      onPayInstallments(nextDue.installments);
    }
  };

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-300">
      {/* Top Welcome & Church Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Painel Financeiro
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit'] tracking-tight mt-0.5">
            Cartão IPDA Rio Formoso
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Controle transparente de compras da igreja e despesas do pastor
          </p>
        </div>

        {currentMode === 'admin' && (
          <button
            id="dashboard-new-purchase-btn"
            onClick={onOpenNewPurchase}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nova compra</span>
          </button>
        )}
      </div>

      {/* PRÓXIMO VENCIMENTO - HERO CARD */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-700/80">
        {/* Background glow effects */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Card Top Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Próximo Vencimento da Fatura
                </span>
                <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {nextDue.dueDate ? formatDateBR(nextDue.dueDate) : 'Nenhum vencimento pendente'}
                </span>
              </div>
            </div>

            {nextDue.dueDate && (
              <button
                id="share-next-due-btn"
                onClick={() => onOpenShare(nextDue)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 active:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartilhar Fatura</span>
              </button>
            )}
          </div>

          {/* Subtotals: Igreja & Particular */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
            {/* Igreja Subtotal */}
            <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl border border-blue-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Church className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-300 block">
                    Total da Igreja
                  </span>
                  <span className="text-xs text-blue-400 font-medium">
                    {nextDue.installments.filter(i => i.purchase.category === 'igreja').length} compras neste vencimento
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base sm:text-lg font-extrabold text-blue-300 tracking-tight">
                  {formatCurrency(nextDue.igrejaCents)}
                </span>
              </div>
            </div>

            {/* Particular Subtotal */}
            <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-300 block">
                    Total Particular
                  </span>
                  <span className="text-xs text-amber-400 font-medium">
                    Pastor
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base sm:text-lg font-extrabold text-amber-300 tracking-tight">
                  {formatCurrency(nextDue.particularCents)}
                </span>
              </div>
            </div>
          </div>

          {/* TOTAL GERAL DO VENCIMENTO */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 rounded-2xl border border-blue-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300 block">
                Total Geral do Vencimento
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-['Outfit']">
                {formatCurrency(nextDue.totalCents)}
              </span>
            </div>

            {currentMode === 'admin' && nextDue.installments.length > 0 && (
              <button
                type="button"
                onClick={handlePayNextDueInstallments}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md self-stretch sm:self-auto"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Dar Baixa no Vencimento</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* METRIC CARDS (Total já pago, Saldo em aberto, Compras ativas, Parcelas pendentes) */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">
          Visão Geral do Cartão
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Já Pago */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 block">Total já pago</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight block mt-0.5">
              {formatCurrency(metrics.totalPaidCents)}
            </span>
          </div>

          {/* Saldo Total em Aberto */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 block">Saldo em aberto</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight block mt-0.5">
              {formatCurrency(metrics.totalPendingCents)}
            </span>
          </div>

          {/* Compras Ativas */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 block">Compras ativas</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight block mt-0.5">
              {metrics.activePurchasesCount} compras
            </span>
          </div>

          {/* Parcelas Pendentes */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 block">Parcelas pendentes</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight block mt-0.5">
              {metrics.pendingInstallmentsCount} parcelas
            </span>
          </div>
        </div>
      </div>

      {/* DETALHAMENTO DO PRÓXIMO VENCIMENTO */}
      {nextDue.dueDate && nextDue.installments.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Compras com Vencimento em {formatDateBR(nextDue.dueDate)}
              </h3>
              <p className="text-xs text-slate-500">
                Detalhamento dos valores que compõem a fatura atual
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
              {nextDue.installments.length} parcelas
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {nextDue.installments.map((item) => {
              const isChurch = item.purchase.category === 'igreja';
              return (
                <div
                  key={item.installment.id}
                  onClick={() => onOpenPurchaseDetail(item.purchase)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                        {item.purchase.description}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isChurch
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isChurch ? 'Igreja' : 'Particular'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {item.installment.number}ª parcela de {item.purchase.installmentsCount}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                      {formatCurrency(item.installment.amountInCents)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
