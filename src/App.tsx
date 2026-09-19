import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { PurchasesView } from './components/PurchasesView';
import { MonthlySummaryView } from './components/MonthlySummaryView';
import { HistoryView } from './components/HistoryView';
import { PurchaseDetailModal } from './components/PurchaseDetailModal';
import { PurchaseFormModal } from './components/PurchaseFormModal';
import { PaymentModal } from './components/PaymentModal';
import { ShareModal } from './components/ShareModal';
import { DataBackupModal } from './components/DataBackupModal';
import { storageService } from './services/storageService';
import { Purchase, AppMode, Installment } from './types';
import { NextDueDateSummary, MonthSummary, calculateDashboardMetrics } from './utils/calculations';
import { Check, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('inicio');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [paymentRecords, setPaymentRecords] = useState(storageService.getPaymentRecords());
  const [currentMode, setCurrentMode] = useState<AppMode>(storageService.getAppMode());

  // Modal States
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = useState<Purchase | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentModalItems, setPaymentModalItems] = useState<{ purchase: Purchase; installment: Installment }[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareNextDue, setShareNextDue] = useState<NextDueDateSummary | undefined>(undefined);
  const [shareMonth, setShareMonth] = useState<MonthSummary | undefined>(undefined);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Sync state with storageService
  const refreshFromStorage = () => {
    const updatedPurchases = storageService.getPurchases();
    const updatedPayments = storageService.getPaymentRecords();
    const updatedMode = storageService.getAppMode();

    setPurchases(updatedPurchases);
    setPaymentRecords(updatedPayments);
    setCurrentMode(updatedMode);

    // If currently viewing a purchase in the detail modal, update its reference
    if (selectedPurchase) {
      const refreshed = updatedPurchases.find((p) => p.id === selectedPurchase.id);
      setSelectedPurchase(refreshed || null);
    }
  };

  useEffect(() => {
    refreshFromStorage();
    const unsubscribe = storageService.subscribe(() => {
      refreshFromStorage();
    });
    return () => unsubscribe();
  }, []);

  const handleToggleMode = (newMode: AppMode) => {
    storageService.setAppMode(newMode);
    setCurrentMode(newMode);
    showToast(`Modo alterado para ${newMode === 'admin' ? 'Administração' : 'Visualização'}`);
  };

  // Open New Purchase modal
  const handleOpenNewPurchase = () => {
    if (currentMode !== 'admin') {
      handleToggleMode('admin');
    }
    setPurchaseToEdit(null);
    setIsPurchaseFormOpen(true);
  };

  // Open Edit Purchase modal
  const handleOpenEditPurchase = (purchase: Purchase) => {
    setPurchaseToEdit(purchase);
    setIsPurchaseFormOpen(true);
  };

  // Delete purchase
  const handleDeletePurchase = (purchaseId: string) => {
    storageService.deletePurchase(purchaseId);
    showToast('Compra excluída com sucesso.');
  };

  // Trigger payments modal with selected installments
  const handlePayInstallments = (items: { purchase: Purchase; installment: Installment }[]) => {
    if (currentMode !== 'admin') {
      handleToggleMode('admin');
    }
    setPaymentModalItems(items);
    setIsPaymentModalOpen(true);
  };

  // Trigger payment for installments of a single purchase from the detail modal
  const handlePayInstallmentsFromPurchase = (installments: Installment[]) => {
    if (!selectedPurchase) return;
    const items = installments.map((inst) => ({
      purchase: selectedPurchase,
      installment: inst,
    }));
    handlePayInstallments(items);
  };

  // Undo payment
  const handleUndoPayment = (paymentRecordId: string) => {
    const success = storageService.undoPayment(paymentRecordId);
    if (success) {
      showToast('Pagamento desfeito. Parcela marcada novamente como pendente.');
    }
  };

  // Share triggers
  const handleOpenShareNextDue = (nextDue: NextDueDateSummary) => {
    setShareNextDue(nextDue);
    setShareMonth(undefined);
    setIsShareModalOpen(true);
  };

  const handleOpenShareMonth = (month: MonthSummary) => {
    setShareNextDue(undefined);
    setShareMonth(month);
    setIsShareModalOpen(true);
  };

  const handleOpenGeneralShare = () => {
    const metrics = calculateDashboardMetrics(purchases);
    setShareNextDue(metrics.nextDue);
    setIsShareModalOpen(true);
  };

  // Metric for bottom nav pending badge
  const metrics = calculateDashboardMetrics(purchases);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 pb-20 sm:pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-top-4 duration-200 border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        currentMode={currentMode}
        onToggleMode={handleToggleMode}
        onOpenShare={handleOpenGeneralShare}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      {/* Mode Banner Indicator (informative, non-intrusive) */}
      <div className="bg-slate-100 border-b border-slate-200/80 px-4 py-2 text-center text-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Modo atual:</span>
            <strong className="text-slate-800 font-semibold">
              {currentMode === 'admin' ? 'Administração (Edição & Baixas)' : 'Visualização (Somente Consulta)'}
            </strong>
          </div>
          <button
            onClick={() => handleToggleMode(currentMode === 'admin' ? 'view' : 'admin')}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
          >
            {currentMode === 'admin' ? 'Mudar para Consulta' : 'Mudar para Admin'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 sm:px-6 sm:py-6">
        {activeTab === 'inicio' && (
          <DashboardView
            purchases={purchases}
            currentMode={currentMode}
            onOpenNewPurchase={handleOpenNewPurchase}
            onOpenPurchaseDetail={(purchase) => setSelectedPurchase(purchase)}
            onOpenShare={handleOpenShareNextDue}
            onPayInstallments={handlePayInstallments}
          />
        )}

        {activeTab === 'compras' && (
          <PurchasesView
            purchases={purchases}
            currentMode={currentMode}
            onOpenNewPurchase={handleOpenNewPurchase}
            onSelectPurchase={(purchase) => setSelectedPurchase(purchase)}
          />
        )}

        {activeTab === 'resumo' && (
          <MonthlySummaryView
            purchases={purchases}
            currentMode={currentMode}
            onOpenShare={handleOpenShareMonth}
            onSelectPurchase={(purchase) => setSelectedPurchase(purchase)}
            onPayInstallments={handlePayInstallments}
          />
        )}

        {activeTab === 'historico' && (
          <HistoryView
            paymentRecords={paymentRecords}
            currentMode={currentMode}
            onUndoPayment={handleUndoPayment}
          />
        )}
      </main>

      {/* Mobile-first Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        pendingCount={metrics.pendingInstallmentsCount}
      />

      {/* MODALS */}

      {/* Purchase Detail Modal */}
      {selectedPurchase && (
        <PurchaseDetailModal
          isOpen={Boolean(selectedPurchase)}
          onClose={() => setSelectedPurchase(null)}
          purchase={selectedPurchase}
          currentMode={currentMode}
          onEdit={(p) => {
            setSelectedPurchase(null);
            handleOpenEditPurchase(p);
          }}
          onDelete={handleDeletePurchase}
          onPayInstallments={handlePayInstallmentsFromPurchase}
          onUndoPayment={handleUndoPayment}
        />
      )}

      {/* New / Edit Purchase Form Modal */}
      <PurchaseFormModal
        isOpen={isPurchaseFormOpen}
        onClose={() => setIsPurchaseFormOpen(false)}
        purchaseToEdit={purchaseToEdit}
        onSaved={() => {
          showToast(purchaseToEdit ? 'Compra atualizada com sucesso.' : 'Compra cadastrada com sucesso.');
          refreshFromStorage();
        }}
      />

      {/* Multi-installment Payment Registration Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        items={paymentModalItems}
        onSuccess={() => {
          showToast('Pagamento registrado com sucesso!');
          refreshFromStorage();
        }}
      />

      {/* WhatsApp Formatted Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        nextDueSummary={shareNextDue}
        monthSummary={shareMonth}
      />

      {/* Backup & Sync Modal */}
      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataChanged={() => {
          showToast('Dados sincronizados com sucesso.');
          refreshFromStorage();
        }}
      />
    </div>
  );
}
