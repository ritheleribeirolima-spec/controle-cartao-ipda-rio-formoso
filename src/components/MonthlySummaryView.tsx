import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Church, 
  User, 
  Share2, 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { Purchase, AppMode, Installment } from '../types';
import { calculateMonthSummary, MonthSummary } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import { formatDateBR, getMonthYearLabel, isDateInPast, getMonthName } from '../utils/dateUtils';

interface MonthlySummaryViewProps {
  purchases: Purchase[];
  currentMode: AppMode;
  onOpenShare: (summary: MonthSummary) => void;
  onSelectPurchase: (purchase: Purchase) => void;
  onPayInstallments: (items: { purchase: Purchase; installment: Installment }[]) => void;
}

export const MonthlySummaryView: React.FC<MonthlySummaryViewProps> = ({
  purchases,
  currentMode,
  onOpenShare,
  onSelectPurchase,
  onPayInstallments,
}) => {
  // Default to October 2026 (the active target period requested: 10/10/2026)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(9); // 9 = October (0-indexed)

  const summary = calculateMonthSummary(purchases, currentYear, currentMonthIndex);

  const prevMonthIndex = (currentMonthIndex - 1 + 12) % 12;
  const nextMonthIndex = (currentMonthIndex + 1) % 12;

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
  };

  const pendingInMonth = summary.installments.filter((i) => !i.installment.paid);

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      {/* Month Navigation Bar: ← Setembro | Outubro de 2026 | Novembro → */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <button
          id="prev-month-btn"
          onClick={handlePrevMonth}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{getMonthName(prevMonthIndex)}</span>
        </button>

        <div className="text-center px-2">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
            Resumo Mensal do Cartão
          </span>
          <h2 className="text-base sm:text-lg font-black text-slate-900 font-['Outfit'] tracking-tight">
            {getMonthYearLabel(currentYear, currentMonthIndex)}
          </h2>
        </div>

        <button
          id="next-month-btn"
          onClick={handleNextMonth}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
        >
          <span className="hidden sm:inline">{getMonthName(nextMonthIndex)}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Month Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Igreja */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Church className="w-3.5 h-3.5 text-blue-600" />
              Igreja
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              IPDA
            </span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-blue-900 tracking-tight block font-['Outfit']">
            {formatCurrency(summary.igrejaCents)}
          </span>
        </div>

        {/* Particular */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-600" />
              Particular
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
              Pastor
            </span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-amber-900 tracking-tight block font-['Outfit']">
            {formatCurrency(summary.particularCents)}
          </span>
        </div>

        {/* TOTAL DO MÊS */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              TOTAL DO MÊS
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
              Geral
            </span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-white tracking-tight block font-['Outfit']">
            {formatCurrency(summary.totalCents)}
          </span>
        </div>
      </div>

      {/* Share / Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100/80 p-3 rounded-2xl">
        <div className="text-xs text-slate-600 font-medium">
          Status: <strong className="text-emerald-700">{formatCurrency(summary.paidCents)} pago</strong> • <strong className="text-blue-700">{formatCurrency(summary.pendingCents)} pendente</strong>
        </div>

        <button
          id="share-month-btn"
          onClick={() => onOpenShare(summary)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          <Share2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Compartilhar este mês</span>
        </button>
      </div>

      {/* Parcelas do Mês List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="font-bold text-slate-900 text-base">
            Parcelas com Vencimento em {getMonthName(currentMonthIndex)} de {currentYear}
          </h3>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
            {summary.installments.length} {summary.installments.length === 1 ? 'parcela' : 'parcelas'}
          </span>
        </div>

        {summary.installments.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">Nenhuma parcela cadastrada para este mês.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {summary.installments.map((item) => {
              const isChurch = item.purchase.category === 'igreja';
              const isPast = !item.installment.paid && isDateInPast(item.installment.dueDate);

              return (
                <div
                  key={item.installment.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
                >
                  <div 
                    onClick={() => onSelectPurchase(item.purchase)}
                    className="cursor-pointer min-w-0 flex-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors">
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

                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                      <span>{item.installment.number}ª parcela de {item.purchase.installmentsCount}</span>
                      <span>•</span>
                      <span>Vencimento: {formatDateBR(item.installment.dueDate)}</span>
                      {item.installment.paid && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">
                            Paga em {formatDateBR(item.installment.paidAt)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center">
                    <span className="font-black text-slate-900 text-base">
                      {formatCurrency(item.installment.amountInCents)}
                    </span>

                    {item.installment.paid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Paga</span>
                      </span>
                    ) : isPast ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-800">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Atrasada</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                        <Circle className="w-3 h-3 text-blue-500" />
                        <span>Pendente</span>
                      </span>
                    )}

                    {currentMode === 'admin' && !item.installment.paid && (
                      <button
                        onClick={() => onPayInstallments([item])}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        Dar baixa
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
