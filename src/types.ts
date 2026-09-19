export type Category = 'igreja' | 'particular';

export type InstallmentStatus = 'pago' | 'pendente' | 'atrasado';

export interface Installment {
  id: string;
  purchaseId: string;
  number: number;
  totalInstallments: number;
  amountInCents: number;
  dueDate: string; // YYYY-MM-DD
  paid: boolean;
  paidAt?: string; // YYYY-MM-DD
  paymentNote?: string;
  paymentRecordId?: string;
}

export interface Purchase {
  id: string;
  description: string;
  category: Category;
  purchaseDate: string; // YYYY-MM-DD
  totalAmountInCents: number;
  installmentsCount: number;
  installmentAmountInCents: number;
  firstDueDate: string; // YYYY-MM-DD
  notes?: string;
  installments: Installment[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  purchaseId: string;
  installmentId: string;
  installmentNumber: number;
  totalInstallments: number;
  amountInCents: number;
  paymentDate: string; // YYYY-MM-DD
  purchaseDescription: string;
  category: Category;
  note?: string;
  recordedAt: string;
}

export type AppMode = 'view' | 'admin';

export type PurchaseFilter = 'todas' | 'igreja' | 'particular' | 'em_aberto' | 'quitadas';
