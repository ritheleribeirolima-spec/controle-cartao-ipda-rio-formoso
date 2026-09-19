import React, { useState } from 'react';
import { X, Download, Upload, RefreshCw, Check, AlertTriangle, Database } from 'lucide-react';
import { storageService } from '../services/storageService';
import { ConfirmModal } from './ConfirmModal';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    const exported = storageService.exportDataJson();
    setJsonText(exported);

    // Trigger download of json file
    const blob = new Blob([exported], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-ipda-cartao-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = async () => {
    const exported = storageService.exportDataJson();
    try {
      await navigator.clipboard.writeText(exported);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImport = () => {
    if (!jsonText.trim()) return;
    const ok = storageService.importDataJson(jsonText);
    if (ok) {
      setImportStatus('success');
      onDataChanged();
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setImportStatus('error');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setJsonText(content);
        const ok = storageService.importDataJson(content);
        if (ok) {
          setImportStatus('success');
          onDataChanged();
          setTimeout(() => {
            onClose();
          }, 1500);
        } else {
          setImportStatus('error');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    storageService.resetToInitialData();
    onDataChanged();
    setShowResetConfirm(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Backup e Sincronização</h3>
                <p className="text-xs text-slate-500">Compartilhar dados entre aparelhos ou restaurar</p>
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
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-blue-900 leading-relaxed">
              <strong>Dica de Uso:</strong> Para compartilhar os dados atualizados entre o irmão Diego e o pastor, você pode baixar o backup JSON aqui e carregá-lo no outro aparelho com 1 clique!
            </div>

            {/* Export buttons */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 uppercase tracking-wider block">
                Exportar Dados do Sistema
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo JSON</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : null}
                  <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>
            </div>

            {/* Import options */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-700 uppercase tracking-wider block">
                Importar Backup
              </label>
              <label className="block p-3 border-2 border-dashed border-slate-300 rounded-xl text-center hover:border-blue-500 hover:bg-blue-50/30 transition-colors cursor-pointer">
                <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                <span className="font-bold text-slate-700 block">Clique para carregar arquivo .json</span>
                <span className="text-slate-400 text-[11px]">Substituirá os dados locais pelo backup</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileImport}
                  className="sr-only"
                />
              </label>

              {importStatus === 'success' && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg flex items-center gap-2 font-bold">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Dados importados com sucesso! Atualizando...</span>
                </div>
              )}

              {importStatus === 'error' && (
                <div className="p-2.5 bg-rose-50 text-rose-800 rounded-lg flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Formato de arquivo JSON inválido. Verifique o arquivo de backup.</span>
                </div>
              )}
            </div>

            {/* Reset to Initial Real Data */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Restaurar Dados Iniciais Reais</span>
                <span className="text-slate-500 text-[11px]">Freezer, Lembrancinhas, Tablet e Aparelho</span>
              </div>
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                Restaurar Padrão
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showResetConfirm}
        title="Restaurar Dados Iniciais"
        message="Deseja recarregar os dados iniciais reais da IPDA Rio Formoso? Qualquer alteração feita será substituída pelos 4 registros padrão."
        confirmLabel="Sim, Restaurar"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={handleResetData}
        onCancel={() => setShowResetConfirm(false)}
      />
    </>
  );
};
