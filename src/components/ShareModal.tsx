import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { formatDateBR } from '../utils/dateUtils';
import { NextDueDateSummary, MonthSummary } from '../utils/calculations';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextDueSummary?: NextDueDateSummary;
  monthSummary?: MonthSummary;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  nextDueSummary,
  monthSummary,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareType, setShareType] = useState<'nextDue' | 'month'>('nextDue');

  if (!isOpen) return null;

  // Generate share text for next due date
  const generateNextDueText = () => {
    if (!nextDueSummary || !nextDueSummary.dueDate) {
      return 'Nenhum vencimento pendente no momento.';
    }

    const dateFormatted = formatDateBR(nextDueSummary.dueDate);
    const churchFormatted = formatCurrency(nextDueSummary.igrejaCents);
    const partFormatted = formatCurrency(nextDueSummary.particularCents);
    const totalFormatted = formatCurrency(nextDueSummary.totalCents);

    let text = `*Controle do Cartão — IPDA Rio Formoso*\n\n`;
    text += `📅 *Vencimento: ${dateFormatted}*\n\n`;
    text += `🏛️ *Igreja:* ${churchFormatted}\n`;
    text += `👤 *Particular:* ${partFormatted}\n\n`;
    text += `💳 *Total: ${totalFormatted}*\n\n`;
    text += `*Detalhamento das compras:*`;

    nextDueSummary.installments.forEach((item) => {
      const catLabel = item.purchase.category === 'igreja' ? 'Igreja' : 'Particular';
      text += `\n• ${item.purchase.description} (${catLabel}): ${formatCurrency(item.installment.amountInCents)} [${item.installment.number}ª/${item.purchase.installmentsCount}]`;
    });

    return text;
  };

  // Generate share text for monthly summary
  const generateMonthText = () => {
    if (!monthSummary) return '';
    const churchFormatted = formatCurrency(monthSummary.igrejaCents);
    const partFormatted = formatCurrency(monthSummary.particularCents);
    const totalFormatted = formatCurrency(monthSummary.totalCents);

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthTitle = `${monthNames[monthSummary.monthIndex]} de ${monthSummary.year}`;

    let text = `*Controle do Cartão — IPDA Rio Formoso*\n\n`;
    text += `🗓️ *Resumo de ${monthTitle}*\n\n`;
    text += `🏛️ *Igreja:* ${churchFormatted}\n`;
    text += `👤 *Particular:* ${partFormatted}\n\n`;
    text += `💳 *Total do Mês: ${totalFormatted}*\n\n`;
    text += `*Parcelas do mês:*`;

    monthSummary.installments.forEach((item) => {
      const catLabel = item.purchase.category === 'igreja' ? 'Igreja' : 'Particular';
      const statusLabel = item.installment.paid ? '✓ Paga' : '○ Pendente';
      text += `\n• ${item.purchase.description} (${catLabel}): ${formatCurrency(item.installment.amountInCents)} (${statusLabel})`;
    });

    return text;
  };

  const textToShare = shareType === 'nextDue' ? generateNextDueText() : generateMonthText();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToShare);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Controle do Cartão — IPDA Rio Formoso',
          text: textToShare,
        });
      } catch (err) {
        // User may cancel share
      }
    } else {
      handleCopy();
    }
  };

  const openWhatsApp = () => {
    const encoded = encodeURIComponent(textToShare);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Compartilhar Resumo</h3>
              <p className="text-xs text-slate-500">Enviar texto formatado pelo WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Options toggle if month summary available */}
          {monthSummary && (
            <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setShareType('nextDue')}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  shareType === 'nextDue'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Próximo Vencimento
              </button>
              <button
                type="button"
                onClick={() => setShareType('month')}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  shareType === 'month'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mês Selecionado
              </button>
            </div>
          )}

          {/* Preview Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Mensagem a ser enviada:
            </label>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-all max-h-60 overflow-y-auto">
              {textToShare}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={openWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm transition-colors cursor-pointer shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Abrir no WhatsApp</span>
          </button>

          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-colors cursor-pointer border ${
              copied
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-800 hover:bg-slate-100 border-slate-200 shadow-xs'
            }`}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
            <span>{copied ? 'Copiado para a área de transferência!' : 'Copiar Texto'}</span>
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="sm:w-auto p-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors flex items-center justify-center cursor-pointer"
              title="Compartilhar pelo sistema"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
