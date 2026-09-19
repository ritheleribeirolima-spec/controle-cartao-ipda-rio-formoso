import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Calendar, FileText, DollarSign, AlertCircle } from 'lucide-react';
import { Installment, Purchase } from '../types';
import { formatCurrency } from '../utils/formatters';
import { formatDateBR, toISODateString } from '../utils/dateUtils';
import { storageService } from '../services/storageService';

interface PaymentItemOption {
  purchase: Purchase;
  installment: Installment;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Pre-selected items or single purchase
  items: PaymentItemOption[];
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  items,
  onSuccess,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [paymentDate, setPaymentDate] = useState<string>(toISODateString(new Date()));
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && items.length > 0) {
      // By default select all provided items
      setSelectedIds(items.map((it) => it.installment.id));
      setPaymentDate(toISODateString(new Date()));
      setNote('');
      setError('');
    }
  }, [isOpen, items]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    setSelectedIds(items.map((it) => it.installment.id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const selectedItems = items.filter((it) => selectedIds.includes(it.installment.id));
  const totalCentsToPay = selectedItems.reduce((acc, curr) => acc + curr.installment.amountInCents, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setError('Selecione pelo menos uma parcela para registrar o pagamento.');
      return;
    }

    if (!paymentDate) {
      setError('Informe a data do pagamento.');
      return;
    }

    const paymentsPayload = selectedItems.map((it) => ({
      purchaseId: it.purchase.id,
      installmentId: it.installment.id,
      paymentDate,
      amountInCents: it.installment.amountInCents,
      note: note.trim() || undefined,
    }));

    storageService.registerPayments(paymentsPayload);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Registrar Pagamento</h3>
              <p className="text-xs text-slate-500">
                Selecione as parcelas e confirme a quitação
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Parcelas selection list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Parcelas Selecionadas ({selectedItems.length} de {items.length})
              </label>
              {items.length > 1 && (
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Marcar todas
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-slate-500 hover:underline cursor-pointer"
                  >
                    Desmarcar
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {items.map((it) => {
                const isChecked = selectedIds.includes(it.installment.id);
                const isChurch = it.purchase.category === 'igreja';

                return (
                  <div
                    key={it.installment.id}
                    onClick={() => toggleSelect(it.installment.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isChecked
                        ? 'border-emerald-500 bg-emerald-50/40'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {it.purchase.description}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              isChurch
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isChurch ? 'Igreja' : 'Particular'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {it.installment.number}ª parcela de {it.purchase.installmentsCount} • Vencimento: {formatDateBR(it.installment.dueDate)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-bold text-sm text-slate-900">
                        {formatCurrency(it.installment.amountInCents)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment total summary card */}
          <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span className="text-xs text-slate-300 font-medium">Total a dar baixa:</span>
            </div>
            <span className="text-lg font-extrabold text-emerald-300 tracking-tight">
              {formatCurrency(totalCentsToPay)}
            </span>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Data do Pagamento
            </label>
            <div className="relative">
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Payment Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observação (Opcional)
            </label>
            <div className="relative">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: Antecipado pelo irmão Diego, PIX da igreja..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
              />
              <FileText className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="submit"
              disabled={selectedItems.length === 0}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirmar Pagamento ({formatCurrency(totalCentsToPay)})</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold text-sm transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
