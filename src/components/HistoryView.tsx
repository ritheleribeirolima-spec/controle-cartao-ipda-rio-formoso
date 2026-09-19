import React, { useState, useMemo } from 'react';
import { 
  History as HistoryIcon, 
  Calendar, 
  Tag, 
  Undo2, 
  CheckCircle2, 
  Search,
  Filter,
  Church,
  User,
  ArrowDownLeft
} from 'lucide-react';
import { PaymentRecord, AppMode, Category } from '../types';
import { formatCurrency } from '../utils/formatters';
import { formatDateBR } from '../utils/dateUtils';
import { ConfirmModal } from './ConfirmModal';

interface HistoryViewProps {
  paymentRecords: PaymentRecord[];
  currentMode: AppMode;
  onUndoPayment: (paymentRecordId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  paymentRecords,
  currentMode,
  onUndoPayment,
}) => {
  const [filter, setFilter] = useState<'todos' | 'igreja' | 'particular'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [undoRecordTarget, setUndoRecordTarget] = useState<PaymentRecord | null>(null);

  const filteredRecords = useMemo(() => {
    return paymentRecords.filter((record) => {
      // Category filter
      if (filter === 'igreja' && record.category !== 'igreja') return false;
      if (filter === 'particular' && record.category !== 'particular') return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchDesc = record.purchaseDescription.toLowerCase().includes(query);
        const matchNote = record.note?.toLowerCase().includes(query);
        if (!matchDesc && !matchNote) return false;
      }

      return true;
    });
  }, [paymentRecords, filter, searchQuery]);

  const totalPaidInFiltered = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.amountInCents, 0);
  }, [filteredRecords]);

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-300">
      {/* Header & Total Paid Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <HistoryIcon className="w-4 h-4 text-blue-600" />
            <span>Histórico de Pagamentos Realizados</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-['Outfit'] mt-0.5">
            Registro de Baixas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Todas as parcelas pagas e antecipadas permanecem arquivadas permanentemente
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200/80 p-3 rounded-xl flex items-center justify-between sm:justify-end gap-3">
          <div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Total Baixado (Filtrado)
            </span>
            <span className="text-lg font-black text-emerald-900">
              {formatCurrency(totalPaidInFiltered)}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por compra ou observação..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs placeholder:text-slate-400 font-medium"
          />
        </div>

        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl flex-shrink-0">
          <button
            onClick={() => setFilter('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('igreja')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'igreja' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Igreja
          </button>
          <button
            onClick={() => setFilter('particular')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'particular' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Particular
          </button>
        </div>
      </div>

      {/* Payment Records List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center my-6">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-3">
            <HistoryIcon className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Nenhum registro de pagamento</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `Nenhum pagamento correspondente a "${searchQuery}".`
              : 'Nenhum pagamento registrado no filtro selecionado.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs divide-y divide-slate-100">
          {filteredRecords.map((record) => {
            const isChurch = record.category === 'igreja';

            return (
              <div
                key={record.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">
                        {record.purchaseDescription}
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

                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-700">
                        {record.installmentNumber}ª parcela de {record.totalInstallments}
                      </span>
                      <span>•</span>
                      <span>Pago em {formatDateBR(record.paymentDate)}</span>
                    </div>

                    {record.note && (
                      <p className="text-xs text-slate-600 mt-1 bg-slate-50 px-2.5 py-1 rounded-md inline-block border border-slate-200/60">
                        Obs: {record.note}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center">
                  <span className="text-base font-extrabold text-emerald-800 tracking-tight">
                    {formatCurrency(record.amountInCents)}
                  </span>

                  {currentMode === 'admin' && (
                    <button
                      onClick={() => setUndoRecordTarget(record)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Desfazer marcação deste pagamento"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Undo Payment Confirmation Modal */}
      {undoRecordTarget && (
        <ConfirmModal
          isOpen={Boolean(undoRecordTarget)}
          title="Desfazer Pagamento"
          message={`Tem certeza que deseja desfazer o pagamento de ${formatCurrency(undoRecordTarget.amountInCents)} da compra "${undoRecordTarget.purchaseDescription}" (${undoRecordTarget.installmentNumber}ª parcela)? A parcela voltará a constar como pendente no sistema.`}
          confirmLabel="Sim, Desfazer Pagamento"
          cancelLabel="Cancelar"
          isDestructive={true}
          onConfirm={() => {
            onUndoPayment(undoRecordTarget.id);
            setUndoRecordTarget(null);
          }}
          onCancel={() => setUndoRecordTarget(null)}
        />
      )}
    </div>
  );
};
