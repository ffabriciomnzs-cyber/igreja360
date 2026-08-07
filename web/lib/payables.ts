export interface PayableInstallment {
  id: string;
  number: number;
  dueDate: string;
  amount: number;
  paidAt: string | null;
  paidAmount: number | null;
  overdue: boolean;
}

export interface Payable {
  id: string;
  description: string;
  creditor: string | null;
  category: string;
  installments: number;
  note: string | null;
  createdAt: string;
  installmentAmount: number;
  totalAmount: number;
  paidAmount: number;
  openAmount: number;
  paidCount: number;
  overdueCount: number;
  finished: boolean;
  nextDueDate: string | null;
  items: PayableInstallment[];
}

export interface PayablesStats {
  openAmount: number;
  openCount: number;
  monthAmount: number;
  monthCount: number;
  overdueAmount: number;
  overdueCount: number;
}

export const EMPTY_PAYABLES_STATS: PayablesStats = {
  openAmount: 0,
  openCount: 0,
  monthAmount: 0,
  monthCount: 0,
  overdueAmount: 0,
  overdueCount: 0,
};

/** Situação da conta, para o selo colorido da lista. */
export function payableStatus(p: Payable): {
  label: string;
  variant: 'success' | 'danger' | 'warning' | 'default';
} {
  if (p.finished) return { label: 'quitada', variant: 'success' };
  if (p.overdueCount > 0) {
    return {
      label:
        p.overdueCount === 1 ? '1 atrasada' : `${p.overdueCount} atrasadas`,
      variant: 'danger',
    };
  }
  if (p.nextDueDate) {
    const dias = Math.ceil(
      (new Date(p.nextDueDate).getTime() - Date.now()) / 86_400_000,
    );
    if (dias <= 3) return { label: 'vence em breve', variant: 'warning' };
  }
  return { label: 'em dia', variant: 'default' };
}
