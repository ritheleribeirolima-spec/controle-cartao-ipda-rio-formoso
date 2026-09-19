import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Tag, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Circle, 
  Edit3, 
  Trash2, 
  CreditCard,
  FileText,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import { Purchase, Installment, AppMode } from '../types';
import { formatCurrency } from '../utils/formatters';
import { formatDateBR, isDateInPast } from '../utils/dateUtils';
import { getPurchaseSummary } from '../utils/calculations';
import { ConfirmModal } from './ConfirmModal';

interface PurchaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: Purchase | null;
  currentMode: AppMode;
  onEdit: (purchase: Purchase) => void;
  onDelete: (purchaseId: string) => void;
  onPayInstallments: (installments: Installment[]) => void;
  onUndoPayment?: (paymentRecordId: string) => void;
}

export const PurchaseDetailModal: React.FC<PurchaseDetailModalProps> = ({
  isOpen,
  onClose,
  purchase,
  currentMode,
  onEdit,
  onDelete,
  onPayInstallments,
  onUndoPayment,
}) => {
  const [selectedInstallmentIds, setSelectedInstallmentIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [undoPaymentTarget, setUndoPaymentTarget] = useState<Installment | null>(null);

  if (!isOpen || !purchase) return null;

  const summary = getPurchaseSummary(purchase);
  const isChurch = purchase.category === 'igreja';

  const toggleSelectInstallment = (id: string) => {
    if (selectedInstallmentIds.includes(id)) {
      setSelectedInstallmentIds(selectedInstallmentIds.filter((item) => item !== id));
    } else {
      setSelectedInstallmentIds([...selectedInstallmentIds, id]);
    }
  };

  const handlePaySelected = () => {
    const selected = purchase.installments.filter((inst) => 
      selectedInstallmentIds.includes(inst.id) && !inst.paid
    );
    if (selected.length > 0) {
      onPayInstallments(selected);
      setSelectedInstallmentIds([]);
    }
  };

  const handlePaySingle = (inst: Installment) => {
    onPayInstallments([inst]);
  };

  const pendingInstallments = purchase.installments.filter((i) => !i.paid);
  const selectedPendingCount = purchase.installments.filter(
    (i) => selectedInstallmentIds.includes(i.id) && !i.paid
  ).length;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[94vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-start justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                    isChurch
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  {isChurch ? 'Igreja' : 'Particular (Pastor)'}
                </span>

                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    summary.isFullyPaid
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {summary.isFullyPaid ? '✓ Quitado' : '○ Em Aberto'}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                {purchase.description}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer flex-shrink-0"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* Main Financial KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Valor Total
                </span>
                <span className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5 block">
                  {formatCurrency(purchase.totalAmountInCents)}
                </span>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                  Total Pago
                </span>
                <span className="text-base sm:text-lg font-extrabold text-emerald-800 mt-0.5 block">
                  {formatCurrency(summary.paidAmountInCents)}
                </span>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/60 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
                  Saldo em Aberto
                </span>
                <span className="text-base sm:text-lg font-extrabold text-blue-800 mt-0.5 block">
                  {formatCurrency(summary.remainingAmountInCents)}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Progresso da Quitação</span>
                <span className="text-blue-600 font-bold">{summary.progressPercent}% quitado</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${summary.progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
                <span>{summary.paidCount} parcelas pagas</span>
                <span>{summary.remainingCount} restantes</span>
              </div>
            </div>

            {/* Detailed metadata */}
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
              <div className="p-3 flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Data da Compra
                </span>
                <span className="font-bold text-slate-800">{formatDateBR(purchase.purchaseDate)}</span>
              </div>

              <div className="p-3 flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  Parcelamento
                </span>
                <span className="font-bold text-slate-800">
                  {purchase.installmentsCount}x de {formatCurrency(purchase.installmentAmountInCents)}
                </span>
              </div>

              <div className="p-3 flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Primeiro Vencimento
                </span>
                <span className="font-bold text-slate-800">{formatDateBR(purchase.firstDueDate)}</span>
              </div>

              <div className="p-3 flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  Próximo Vencimento
                </span>
                <span className="font-bold text-blue-700">
                  {summary.nextDue ? formatDateBR(summary.nextDue) : 'Nenhum (Quitado)'}
                </span>
              </div>

              {purchase.notes && (
                <div className="p-3">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium mb-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Observações
                  </span>
                  <p className="text-slate-700 text-xs leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {purchase.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Individual Installments List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Parcelas Individuais ({purchase.installments.length})
                </h3>

                {currentMode === 'admin' && pendingInstallments.length > 1 && (
                  <div className="text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedPendingCount === pendingInstallments.length) {
                          setSelectedInstallmentIds([]);
                        } else {
                          setSelectedInstallmentIds(pendingInstallments.map((i) => i.id));
                        }
                      }}
                      className="text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      {selectedPendingCount === pendingInstallments.length ? 'Desmarcar' : 'Selecionar pendentes'}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {purchase.installments.map((inst) => {
                  const isPast = !inst.paid && isDateInPast(inst.dueDate);
                  const isSelected = selectedInstallmentIds.includes(inst.id);

                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600">
                      <Circle className="w-3 h-3 text-slate-400" />
                      Pendente
                    </span>
                  );

                  if (inst.paid) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Pago em {formatDateBR(inst.paidAt)}
                      </span>
                    );
                  } else if (isPast) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-100 text-rose-800">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        Atrasado
                      </span>
                    );
                  }

                  return (
                    <div
                      key={inst.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                        inst.paid
                          ? 'bg-slate-50/70 border-slate-200/80'
                          : isSelected
                          ? 'bg-blue-50/60 border-blue-400 shadow-xs'
                          : isPast
                          ? 'bg-rose-50/30 border-rose-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Checkbox for quick payment in admin mode */}
                        {currentMode === 'admin' && !inst.paid && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectInstallment(inst.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">
                              {inst.number}ª parcela
                            </span>
                            <span className="text-xs font-semibold text-slate-700">
                              — {formatCurrency(inst.amountInCents)}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                            {inst.paid ? (
                              <>
                                <span>Paga em {formatDateBR(inst.paidAt)}</span>
                                {inst.paymentNote && <span>• {inst.paymentNote}</span>}
                              </>
                            ) : (
                              <span>Vence em {formatDateBR(inst.dueDate)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 self-end sm:self-center">
                        {statusBadge}

                        {/* Admin direct action */}
                        {currentMode === 'admin' && (
                          <>
                            {!inst.paid ? (
                              <button
                                type="button"
                                onClick={() => handlePaySingle(inst)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                Dar baixa
                              </button>
                            ) : (
                              onUndoPayment && inst.paymentRecordId && (
                                <button
                                  type="button"
                                  onClick={() => setUndoPaymentTarget(inst)}
                                  className="text-[11px] text-slate-500 hover:text-rose-600 underline cursor-pointer"
                                  title="Desfazer marcação de pagamento"
                                >
                                  Desfazer
                                </button>
                              )
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-2 justify-between items-center">
            {currentMode === 'admin' ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => onEdit(purchase)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-4 h-4 text-slate-600" />
                  <span>Editar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Excluir</span>
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">
                Modo Consulta (leitura)
              </div>
            )}

            <div className="flex gap-2 w-full sm:w-auto">
              {currentMode === 'admin' && selectedPendingCount > 0 && (
                <button
                  type="button"
                  onClick={handlePaySelected}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Dar Baixa ({selectedPendingCount} selecionadas)</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors cursor-pointer ml-auto"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Excluir Compra"
        message="Tem certeza que deseja excluir esta compra e suas parcelas?"
        confirmLabel="Sim, Excluir Compra"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete(purchase.id);
          onClose();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Undo Payment Confirmation Modal */}
      {undoPaymentTarget && (
        <ConfirmModal
          isOpen={Boolean(undoPaymentTarget)}
          title="Desfazer Pagamento"
          message={`Deseja desfazer o pagamento da ${undoPaymentTarget.number}ª parcela (${formatCurrency(undoPaymentTarget.amountInCents)}) e marcá-la novamente como pendente?`}
          confirmLabel="Desfazer Pagamento"
          cancelLabel="Cancelar"
          isDestructive={false}
          onConfirm={() => {
            if (undoPaymentTarget.paymentRecordId && onUndoPayment) {
              onUndoPayment(undoPaymentTarget.paymentRecordId);
            }
            setUndoPaymentTarget(null);
          }}
          onCancel={() => setUndoPaymentTarget(null)}
        />
      )}
    </>
  );
};
