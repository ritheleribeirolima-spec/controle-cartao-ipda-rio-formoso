import { Purchase, PaymentRecord, AppMode, Installment } from '../types';
import { INITIAL_PURCHASES, INITIAL_PAYMENT_RECORDS } from './initialData';
import { addMonthsToISODate } from '../utils/dateUtils';

const STORAGE_KEYS = {
  PURCHASES: 'ipda_cartao_purchases_v1',
  PAYMENTS: 'ipda_cartao_payments_v1',
  MODE: 'ipda_cartao_mode_v1',
};

class StorageService {
  private purchases: Purchase[] = [];
  private paymentRecords: PaymentRecord[] = [];
  private appMode: AppMode = 'view';
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedPurchases = localStorage.getItem(STORAGE_KEYS.PURCHASES);
      const storedPayments = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      const storedMode = localStorage.getItem(STORAGE_KEYS.MODE);

      if (storedPurchases) {
        this.purchases = JSON.parse(storedPurchases);

        // Migration: Update lembrancinhas if still has old R$ 600,00 value
        const lembrancinhas = this.purchases.find((p) => p.id === 'compra-lembrancinhas');
        if (lembrancinhas && lembrancinhas.totalAmountInCents === 60000) {
          lembrancinhas.totalAmountInCents = 68995;
          lembrancinhas.installmentAmountInCents = 34498;
          lembrancinhas.notes = 'Lembrancinhas para a festividade da congregação (2x R$ 344,98).';
          if (lembrancinhas.installments[0]) {
            lembrancinhas.installments[0].amountInCents = 34498;
          }
          if (lembrancinhas.installments[1]) {
            lembrancinhas.installments[1].amountInCents = 34497;
          }
          this.savePurchasesToStorage();
        }
      } else {
        this.purchases = JSON.parse(JSON.stringify(INITIAL_PURCHASES));
        this.savePurchasesToStorage();
      }

      if (storedPayments) {
        this.paymentRecords = JSON.parse(storedPayments);
      } else {
        this.paymentRecords = JSON.parse(JSON.stringify(INITIAL_PAYMENT_RECORDS));
        this.savePaymentsToStorage();
      }

      if (storedMode === 'admin' || storedMode === 'view') {
        this.appMode = storedMode;
      } else {
        this.appMode = 'view'; // Default to View mode as requested
      }
    } catch (e) {
      console.error('Failed to load from storage, using initial fallback', e);
      this.purchases = JSON.parse(JSON.stringify(INITIAL_PURCHASES));
      this.paymentRecords = JSON.parse(JSON.stringify(INITIAL_PAYMENT_RECORDS));
      this.appMode = 'view';
    }
  }

  private savePurchasesToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(this.purchases));
    } catch (e) {
      console.error('Failed to save purchases to localStorage', e);
    }
  }

  private savePaymentsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(this.paymentRecords));
    } catch (e) {
      console.error('Failed to save payment records to localStorage', e);
    }
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error in storage listener', err);
      }
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getPurchases(): Purchase[] {
    return [...this.purchases];
  }

  public getPurchaseById(id: string): Purchase | undefined {
    return this.purchases.find((p) => p.id === id);
  }

  public getPaymentRecords(): PaymentRecord[] {
    return [...this.paymentRecords];
  }

  public getAppMode(): AppMode {
    return this.appMode;
  }

  public setAppMode(mode: AppMode): void {
    this.appMode = mode;
    try {
      localStorage.setItem(STORAGE_KEYS.MODE, mode);
    } catch (e) {
      console.error('Failed to save mode', e);
    }
    this.notify();
  }

  public createPurchase(data: {
    description: string;
    category: 'igreja' | 'particular';
    purchaseDate: string;
    totalAmountInCents: number;
    installmentsCount: number;
    installmentAmountInCents: number;
    firstDueDate: string;
    notes?: string;
  }): Purchase {
    const purchaseId = `purchase-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const installments = this.generateInstallments(
      purchaseId,
      data.totalAmountInCents,
      data.installmentsCount,
      data.installmentAmountInCents,
      data.firstDueDate
    );

    const newPurchase: Purchase = {
      id: purchaseId,
      description: data.description.trim(),
      category: data.category,
      purchaseDate: data.purchaseDate,
      totalAmountInCents: data.totalAmountInCents,
      installmentsCount: data.installmentsCount,
      installmentAmountInCents: data.installmentAmountInCents,
      firstDueDate: data.firstDueDate,
      notes: data.notes?.trim() || undefined,
      installments,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.purchases = [newPurchase, ...this.purchases];
    this.savePurchasesToStorage();
    this.notify();
    return newPurchase;
  }

  public updatePurchase(updated: Purchase): void {
    const index = this.purchases.findIndex((p) => p.id === updated.id);
    if (index === -1) return;

    this.purchases[index] = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    this.savePurchasesToStorage();
    this.notify();
  }

  public deletePurchase(purchaseId: string): void {
    // Remove the purchase
    this.purchases = this.purchases.filter((p) => p.id !== purchaseId);
    // Remove payment records associated with this purchase
    this.paymentRecords = this.paymentRecords.filter((r) => r.purchaseId !== purchaseId);

    this.savePurchasesToStorage();
    this.savePaymentsToStorage();
    this.notify();
  }

  /**
   * Registers payment for one or more installments
   */
  public registerPayments(
    payments: Array<{
      purchaseId: string;
      installmentId: string;
      paymentDate: string;
      amountInCents: number;
      note?: string;
    }>
  ): void {
    const nowIso = new Date().toISOString();
    const newRecords: PaymentRecord[] = [];

    payments.forEach((p) => {
      const purchase = this.purchases.find((item) => item.id === p.purchaseId);
      if (!purchase) return;

      const inst = purchase.installments.find((i) => i.id === p.installmentId);
      if (!inst) return;

      const paymentRecordId = `pag-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      inst.paid = true;
      inst.paidAt = p.paymentDate;
      inst.paymentNote = p.note;
      inst.paymentRecordId = paymentRecordId;

      newRecords.push({
        id: paymentRecordId,
        purchaseId: purchase.id,
        installmentId: inst.id,
        installmentNumber: inst.number,
        totalInstallments: purchase.installmentsCount,
        amountInCents: p.amountInCents,
        paymentDate: p.paymentDate,
        purchaseDescription: purchase.description,
        category: purchase.category,
        note: p.note,
        recordedAt: nowIso,
      });

      purchase.updatedAt = nowIso;
    });

    this.paymentRecords = [...newRecords, ...this.paymentRecords];
    this.savePurchasesToStorage();
    this.savePaymentsToStorage();
    this.notify();
  }

  /**
   * Undoes a payment, restoring installment status to unpaid
   */
  public undoPayment(paymentRecordId: string): boolean {
    const record = this.paymentRecords.find((r) => r.id === paymentRecordId);
    if (!record) return false;

    // Find purchase and installment
    const purchase = this.purchases.find((p) => p.id === record.purchaseId);
    if (purchase) {
      const inst = purchase.installments.find((i) => i.id === record.installmentId);
      if (inst) {
        inst.paid = false;
        inst.paidAt = undefined;
        inst.paymentNote = undefined;
        inst.paymentRecordId = undefined;
      }
      purchase.updatedAt = new Date().toISOString();
    }

    // Remove payment record
    this.paymentRecords = this.paymentRecords.filter((r) => r.id !== paymentRecordId);
    this.savePurchasesToStorage();
    this.savePaymentsToStorage();
    this.notify();
    return true;
  }

  public resetToInitialData(): void {
    this.purchases = JSON.parse(JSON.stringify(INITIAL_PURCHASES));
    this.paymentRecords = JSON.parse(JSON.stringify(INITIAL_PAYMENT_RECORDS));
    this.savePurchasesToStorage();
    this.savePaymentsToStorage();
    this.notify();
  }

  public exportDataJson(): string {
    return JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        purchases: this.purchases,
        paymentRecords: this.paymentRecords,
      },
      null,
      2
    );
  }

  public importDataJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.purchases) && Array.isArray(parsed.paymentRecords)) {
        this.purchases = parsed.purchases;
        this.paymentRecords = parsed.paymentRecords;
        this.savePurchasesToStorage();
        this.savePaymentsToStorage();
        this.notify();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Invalid JSON import', e);
      return false;
    }
  }

  /**
   * Generates installment list starting from firstDueDate with monthly progression
   */
  public generateInstallments(
    purchaseId: string,
    totalAmountInCents: number,
    count: number,
    baseInstallmentInCents: number,
    firstDueDate: string
  ): Installment[] {
    const installments: Installment[] = [];
    let accumulated = 0;

    for (let i = 1; i <= count; i++) {
      const dueDate = addMonthsToISODate(firstDueDate, i - 1);
      
      // For the last installment, adjust for rounding difference if using auto division
      let amount = baseInstallmentInCents;
      if (i === count) {
        // If the sum of base installments differs from total due to rounding cents, adjust the last installment
        const difference = totalAmountInCents - (baseInstallmentInCents * (count - 1));
        if (difference > 0) {
          amount = difference;
        }
      }
      accumulated += amount;

      installments.push({
        id: `inst-${purchaseId}-${i}`,
        purchaseId,
        number: i,
        totalInstallments: count,
        amountInCents: amount,
        dueDate,
        paid: false,
      });
    }

    return installments;
  }
}

export const storageService = new StorageService();
