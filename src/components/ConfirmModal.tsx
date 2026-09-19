import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl flex-shrink-0 ${isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{message}</p>
            </div>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
            <button
              id="confirm-modal-button"
              type="button"
              onClick={onConfirm}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer shadow-sm ${
                isDestructive
                  ? 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800'
                  : 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950'
              }`}
            >
              {confirmLabel}
            </button>
            <button
              id="cancel-modal-button"
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-pointer"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
