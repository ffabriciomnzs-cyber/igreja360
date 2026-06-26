export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  description: string | null;
  amount: string; // Decimal serializado como string pela API
  date: string;
  createdAt: string;
}

export interface FinancialSummary {
  income: number;
  expense: number;
  balance: number;
}

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: FinancialSummary;
}

export interface FinancialStats {
  income: number;
  expense: number;
  balance: number;
  monthIncome: number;
  monthExpense: number;
  monthBalance: number;
}

export const TYPE_LABELS: Record<TransactionType, string> = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
};

export const INCOME_CATEGORIES = [
  'Dízimos',
  'Ofertas',
  'Doações',
  'Campanhas',
  'Eventos',
  'Outros',
];

export const EXPENSE_CATEGORIES = [
  'Aluguel',
  'Água/Luz/Internet',
  'Manutenção',
  'Salários',
  'Eventos',
  'Missões',
  'Material',
  'Outros',
];
