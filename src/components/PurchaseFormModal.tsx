import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Calendar, Tag, AlertTriangle, FileText } from 'lucide-react';
import { Purchase, Category } from '../types';
import { formatCurrency, parseCurrencyToCents, centsToDecimalString } from '../utils/formatters';
import { toISODateString, addMonthsToISODate } from '../utils/dateUtils';
import { storageService } from '../services/storageService';

interface PurchaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseToEdit?: Purchase | null;
  onSaved: () => void;
}

export const PurchaseFormModal: React.FC<PurchaseFormModalProps> = ({
  isOpen,
  onClose,
  purchaseToEdit,
  onSaved,
}) => {
  const isEditing = Boolean(purchaseToEdit);

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('igreja');
  const [purchaseDate, setPurchaseDate] = useState(toISODateString(new Date()));
  const [totalAmountStr, setTotalAmountStr] = useState('');
  const [installmentsCount, setInstallmentsCount] = useState(1);
  const [installmentAmountStr, setInstallmentAmountStr] = useState('');
  const [isManualInstallment, setIsManualInstallment] = useState(false);
  const [firstDueDate, setFirstDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Confirmation dialog state for paid installments modification
  const [showPaidWarning, setShowPaidWarning] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<any>(null);

  // Set default first due date to 10th of next month if not set
  useEffect(() => {
    if (isOpen) {
      if (purchaseToEdit) {
        setDescription(purchaseToEdit.description);
        setCategory(purchaseToEdit.category);
        setPurchaseDate(purchaseToEdit.purchaseDate);
        setTotalAmountStr(centsToDecimalString(purchaseToEdit.totalAmountInCents));
        setInstallmentsCount(purchaseToEdit.installmentsCount);
        setInstallmentAmountStr(centsToDecimalString(purchaseToEdit.installmentAmountInCents));
        setIsManualInstallment(false);
        setFirstDueDate(purchaseToEdit.firstDueDate);
        setNotes(purchaseToEdit.notes || '');
        setError('');
        setShowPaidWarning(false);
      } else {
        // New purchase default
        setDescription('');
        setCategory('igreja');
        const todayStr = toISODateString(new Date());
        setPurchaseDate(todayStr);
        setTotalAmountStr('');
        setInstallmentsCount(1);
        setInstallmentAmountStr('');
        setIsManualInstallment(false);
        
        // Next 10th default
        const nextMonthDate = addMonthsToISODate(todayStr, 1);
        const [year, month] = nextMonthDate.split('-');
        setFirstDueDate(`${year}-${month}-10`);
        
        setNotes('');
        setError('');
        setShowPaidWarning(false);
      }
    }
  }, [isOpen, purchaseToEdit]);

  // Recalculate installment amount when total or count changes (unless user manually modified installment)
  const handleTotalAmountChange = (val: string) => {
    setTotalAmountStr(val);
    if (!isManualInstallment) {
      const cents = parseCurrencyToCents(val);
      if (cents > 0 && installmentsCount > 0) {
        const perInst = Math.round(cents / installmentsCount);
        setInstallmentAmountStr(centsToDecimalString(perInst));
      }
    }
  };

  const handleInstallmentsCountChange = (count: number) => {
    const safeCount = Math.max(1, count);
    setInstallmentsCount(safeCount);
    if (!isManualInstallment) {
      const cents = parseCurrencyToCents(totalAmountStr);
      if (cents > 0) {
        const perInst = Math.round(cents / safeCount);
        setInstallmentAmountStr(centsToDecimalString(perInst));
      }
    }
  };

  const handleInstallmentAmountChange = (val: string) => {
    setInstallmentAmountStr(val);
    setIsManualInstallment(true);
  };

  const resetToAutoInstallment = () => {
    setIsManualInstallment(false);
    const cents = parseCurrencyToCents(totalAmountStr);
    if (cents > 0 && installmentsCount > 0) {
      const perInst = Math.round(cents / installmentsCount);
      setInstallmentAmountStr(centsToDecimalString(perInst));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Informe a descrição da compra.');
      return;
    }

    const totalCents = parseCurrencyToCents(totalAmountStr);
    if (totalCents <= 0) {
      setError('Informe um valor total válido para a compra.');
      return;
    }

    if (installmentsCount <= 0) {
      setError('A quantidade de parcelas deve ser pelo menos 1.');
      return;
    }

    let instCents = parseCurrencyToCents(installmentAmountStr);
    if (instCents <= 0) {
      instCents = Math.round(totalCents / installmentsCount);
    }

    if (!firstDueDate) {
      setError('Informe a data do primeiro vencimento.');
      return;
    }

    const payload = {
      description: description.trim(),
      category,
      purchaseDate,
      totalAmountInCents: totalCents,
      installmentsCount,
      installmentAmountInCents: instCents,
      firstDueDate,
      notes: notes.trim() || undefined,
    };

    if (isEditing && purchaseToEdit) {
      const paidInstallments = purchaseToEdit.installments.filter((i) => i.paid);

      // Check if new installments count is less than already paid installments
      if (installmentsCount < paidInstallments.length) {
        setError(
          `Não é possível reduzir para ${installmentsCount} parcelas porque esta compra já possui ${paidInstallments.length} parcelas pagas registradas.`
        );
        return;
      }

      // If user changed total or installments count and there are paid installments, ask confirmation
      const changedFinancials =
        totalCents !== purchaseToEdit.totalAmountInCents ||
        installmentsCount !== purchaseToEdit.installmentsCount ||
        firstDueDate !== purchaseToEdit.firstDueDate ||
        instCents !== purchaseToEdit.installmentAmountInCents;

      if (changedFinancials && paidInstallments.length > 0) {
        setPendingSaveData(payload);
        setShowPaidWarning(true);
        return;
      }

      applyEdit(payload);
    } else {
      // Create new purchase
      storageService.createPurchase(payload);
      onSaved();
      onClose();
    }
  };

  const applyEdit = (payload: any) => {
    if (!purchaseToEdit) return;

    // Preserve paid installments and update remaining ones
    const paidInstallments = purchaseToEdit.installments.filter((i) => i.paid);
    const newInstallments = [...paidInstallments];

    // Generate remaining installments starting from next number
    const startNumber = paidInstallments.length + 1;
    for (let i = startNumber; i <= payload.installmentsCount; i++) {
      const dueDate = addMonthsToISODate(payload.firstDueDate, i - 1);
      
      let amount = payload.installmentAmountInCents;
      if (i === payload.installmentsCount) {
        // Adjust last installment if there's rounding difference
        const currentSumSoFar = newInstallments.reduce((acc, inst) => acc + inst.amountInCents, 0);
        const diff = payload.totalAmountInCents - (currentSumSoFar + (payload.installmentAmountInCents * (payload.installmentsCount - i)));
        if (diff > 0) {
          amount = diff;
        }
      }

      newInstallments.push({
        id: `inst-${purchaseToEdit.id}-${i}-${Date.now()}`,
        purchaseId: purchaseToEdit.id,
        number: i,
        totalInstallments: payload.installmentsCount,
        amountInCents: amount,
        dueDate,
        paid: false,
      });
    }

    // Update totalInstallments on existing paid ones to reflect new total
    newInstallments.forEach((inst) => {
      inst.totalInstallments = payload.installmentsCount;
    });

    const updatedPurchase: Purchase = {
      ...purchaseToEdit,
      description: payload.description,
      category: payload.category,
      purchaseDate: payload.purchaseDate,
      totalAmountInCents: payload.totalAmountInCents,
      installmentsCount: payload.installmentsCount,
      installmentAmountInCents: payload.installmentAmountInCents,
      firstDueDate: payload.firstDueDate,
      notes: payload.notes,
      installments: newInstallments,
      updatedAt: new Date().toISOString(),
    };

    storageService.updatePurchase(updatedPurchase);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isEditing ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
              {isEditing ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isEditing ? 'Editar Compra' : 'Nova Compra'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? 'Altere os dados da compra e parcelas' : 'Cadastre a compra para gerar as parcelas mensais'}
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

        {/* Warning Modal if editing changes already paid installments */}
        {showPaidWarning && (
          <div className="p-4 bg-amber-50 border-b border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 uppercase">
                  Atenção: Compra com parcelas já pagas
                </h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Esta compra já possui parcelas registradas como pagas. Ao prosseguir, as parcelas já quitadas serão preservadas intactas e apenas as parcelas futuras serão recalculadas.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaidWarning(false);
                      applyEdit(pendingSaveData);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Confirmar Alteração
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaidWarning(false)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descrição da Compra <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Freezer IPDA Rio Formoso, Lembrancinhas..."
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Categoria <span className="text-rose-500">*</span></span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  category === 'igreja'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value="igreja"
                  checked={category === 'igreja'}
                  onChange={() => setCategory('igreja')}
                  className="sr-only"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-sm">Igreja</span>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  category === 'particular'
                    ? 'border-amber-500 bg-amber-50/70 text-amber-900 font-bold shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value="particular"
                  checked={category === 'particular'}
                  onChange={() => setCategory('particular')}
                  className="sr-only"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-sm">Particular (Pastor)</span>
              </label>
            </div>
          </div>

          {/* Total Amount and Installments Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Valor Total (R$) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">R$</span>
                <input
                  type="text"
                  value={totalAmountStr}
                  onChange={(e) => handleTotalAmountChange(e.target.value)}
                  placeholder="0,00"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Número de Parcelas <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={installmentsCount}
                onChange={(e) => handleInstallmentsCountChange(parseInt(e.target.value, 10) || 1)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Installment Amount with auto-calculation and manual override */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Valor da Parcela (R$)
              </label>
              {isManualInstallment && (
                <button
                  type="button"
                  onClick={resetToAutoInstallment}
                  className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                >
                  Recalcular automaticamente
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">R$</span>
              <input
                type="text"
                value={installmentAmountStr}
                onChange={(e) => handleInstallmentAmountChange(e.target.value)}
                placeholder="0,00"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {installmentsCount}x de {formatCurrency(parseCurrencyToCents(installmentAmountStr))}
              {isManualInstallment ? ' (Ajuste manual ativado)' : ' (Calculado automaticamente: total ÷ parcelas)'}
            </p>
          </div>

          {/* Dates: Purchase Date & First Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data da Compra
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primeiro Vencimento <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={firstDueDate}
                  onChange={(e) => setFirstDueDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Observações (Opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes adicionais sobre a compra, finalidade, etc..."
              rows={2}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              id="save-purchase-button"
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Compra'}</span>
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
