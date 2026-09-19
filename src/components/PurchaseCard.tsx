import React from 'react';
import { Tag, Calendar, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { Purchase } from '../types';
import { formatCurrency } from '../utils/formatters';
import { formatDateBR } from '../utils/dateUtils';
import { getPurchaseSummary } from '../utils/calculations';

interface PurchaseCardProps {
  purchase: Purchase;
  onClick: () => void;
}

export const PurchaseCard: React.FC<PurchaseCardProps> = ({ purchase, onClick }) => {
  const summary = getPurchaseSummary(purchase);
  const isChurch = purchase.category === 'igreja';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer active:scale-[0.99] relative overflow-hidden group"
    >
      {/* Category & Status Bar */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span
          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
            isChurch
              ? 'bg-blue-100 text-blue-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          <Tag className="w-3 h-3" />
          {isChurch ? 'Igreja' : 'Particular (Pastor)'}
        </span>

        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
            summary.isFullyPaid
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {summary.isFullyPaid ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Quitada</span>
            </>
          ) : (
            <>
              <Circle className="w-2.5 h-2.5 text-blue-500" />
              <span>Em aberto</span>
            </>
          )}
        </span>
      </div>

      {/* Description & Total Value */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
          {purchase.description}
        </h3>
        <div className="text-right flex-shrink-0">
          <span className="text-xs text-slate-400 block font-medium">Total</span>
          <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
            {formatCurrency(purchase.totalAmountInCents)}
          </span>
        </div>
      </div>

      {/* Progress Bar & Installments count */}
      <div className="space-y-1.5 mb-3 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
        <div className="flex justify-between text-xs font-semibold text-slate-700">
          <span>
            {purchase.installmentsCount} parcelas ({purchase.installmentsCount}x {formatCurrency(purchase.installmentAmountInCents)})
          </span>
          <span className="text-slate-500">
            {summary.paidCount} pagas • <span className="text-blue-600 font-bold">{summary.remainingCount} restantes</span>
          </span>
        </div>

        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${summary.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Footer: Next Due Date & Balance */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {summary.nextDue ? (
              <>
                Próximo vencimento: <strong className="text-slate-900">{formatDateBR(summary.nextDue)}</strong>
              </>
            ) : (
              <span className="text-emerald-700 font-medium">Sem pendências</span>
            )}
          </span>
        </div>

        <div className="text-right flex items-center gap-1">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Saldo Restante</span>
            <span className="font-bold text-slate-900 text-xs sm:text-sm">
              {formatCurrency(summary.remainingAmountInCents)}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 ml-1 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
