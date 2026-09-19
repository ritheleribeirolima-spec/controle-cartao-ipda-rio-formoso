import { Purchase, Installment } from '../types';

export interface NextDueDateSummary {
  dueDate: string | null;
  igrejaCents: number;
  particularCents: number;
  totalCents: number;
  installments: {
    installment: Installment;
    purchase: Purchase;
  }[];
}

export interface DashboardMetrics {
  nextDue: NextDueDateSummary;
  totalPaidCents: number;
  totalPendingCents: number;
  activePurchasesCount: number;
  pendingInstallmentsCount: number;
}

/**
 * Calculates next due date summary and high-level dashboard metrics dynamically from purchases
 */
export function calculateDashboardMetrics(purchases: Purchase[]): DashboardMetrics {
  let totalPaidCents = 0;
  let totalPendingCents = 0;
  let pendingInstallmentsCount = 0;
  let activePurchasesCount = 0;

  const pendingInstallmentsWithPurchase: {
    installment: Installment;
    purchase: Purchase;
  }[] = [];

  purchases.forEach((purchase) => {
    let hasPending = false;

    purchase.installments.forEach((inst) => {
      if (inst.paid) {
        totalPaidCents += inst.amountInCents;
      } else {
        totalPendingCents += inst.amountInCents;
        pendingInstallmentsCount++;
        hasPending = true;
        pendingInstallmentsWithPurchase.push({
          installment: inst,
          purchase,
        });
      }
    });

    if (hasPending) {
      activePurchasesCount++;
    }
  });

  // Find the earliest unpaid due date
  let nextDueDate: string | null = null;
  if (pendingInstallmentsWithPurchase.length > 0) {
    const sortedDueDates = pendingInstallmentsWithPurchase
      .map((item) => item.installment.dueDate)
      .sort((a, b) => a.localeCompare(b));
    nextDueDate = sortedDueDates[0] || null;
  }

  // Calculate totals for next due date
  let igrejaCents = 0;
  let particularCents = 0;
  const nextDueInstallments: {
    installment: Installment;
    purchase: Purchase;
  }[] = [];

  if (nextDueDate) {
    pendingInstallmentsWithPurchase.forEach((item) => {
      if (item.installment.dueDate === nextDueDate) {
        nextDueInstallments.push(item);
        if (item.purchase.category === 'igreja') {
          igrejaCents += item.installment.amountInCents;
        } else {
          particularCents += item.installment.amountInCents;
        }
      }
    });
  }

  return {
    nextDue: {
      dueDate: nextDueDate,
      igrejaCents,
      particularCents,
      totalCents: igrejaCents + particularCents,
      installments: nextDueInstallments,
    },
    totalPaidCents,
    totalPendingCents,
    activePurchasesCount,
    pendingInstallmentsCount,
  };
}

export interface MonthSummary {
  year: number;
  monthIndex: number; // 0-indexed (0 = Jan, 9 = Oct)
  monthPrefix: string; // e.g. "2026-10"
  igrejaCents: number;
  particularCents: number;
  totalCents: number;
  paidCents: number;
  pendingCents: number;
  installments: {
    installment: Installment;
    purchase: Purchase;
  }[];
}

/**
 * Calculates the monthly summary for a specific year and month
 */
export function calculateMonthSummary(
  purchases: Purchase[],
  year: number,
  monthIndex: number
): MonthSummary {
  const monthStr = String(monthIndex + 1).padStart(2, '0');
  const monthPrefix = `${year}-${monthStr}`;

  let igrejaCents = 0;
  let particularCents = 0;
  let paidCents = 0;
  let pendingCents = 0;
  const matchingInstallments: {
    installment: Installment;
    purchase: Purchase;
  }[] = [];

  purchases.forEach((purchase) => {
    purchase.installments.forEach((inst) => {
      if (inst.dueDate.startsWith(monthPrefix)) {
        matchingInstallments.push({
          installment: inst,
          purchase,
        });

        if (purchase.category === 'igreja') {
          igrejaCents += inst.amountInCents;
        } else {
          particularCents += inst.amountInCents;
        }

        if (inst.paid) {
          paidCents += inst.amountInCents;
        } else {
          pendingCents += inst.amountInCents;
        }
      }
    });
  });

  // Sort installments by day of month, then description
  matchingInstallments.sort((a, b) => {
    const comp = a.installment.dueDate.localeCompare(b.installment.dueDate);
    if (comp !== 0) return comp;
    return a.purchase.description.localeCompare(b.purchase.description);
  });

  return {
    year,
    monthIndex,
    monthPrefix,
    igrejaCents,
    particularCents,
    totalCents: igrejaCents + particularCents,
    paidCents,
    pendingCents,
    installments: matchingInstallments,
  };
}

/**
 * Helper to compute single purchase progress and status
 */
export function getPurchaseSummary(purchase: Purchase) {
  const totalInstallments = purchase.installments.length;
  const paidInstallments = purchase.installments.filter((i) => i.paid);
  const pendingInstallments = purchase.installments.filter((i) => !i.paid);

  const paidCount = paidInstallments.length;
  const remainingCount = pendingInstallments.length;

  const paidAmountInCents = paidInstallments.reduce((sum, i) => sum + i.amountInCents, 0);
  const remainingAmountInCents = pendingInstallments.reduce((sum, i) => sum + i.amountInCents, 0);

  const progressPercent = totalInstallments > 0 ? Math.round((paidCount / totalInstallments) * 100) : 0;
  const isFullyPaid = remainingCount === 0 && totalInstallments > 0;

  // Next due date for this purchase
  const nextDue = pendingInstallments.length > 0 ? pendingInstallments[0].dueDate : null;

  return {
    paidCount,
    remainingCount,
    paidAmountInCents,
    remainingAmountInCents,
    progressPercent,
    isFullyPaid,
    nextDue,
  };
}
