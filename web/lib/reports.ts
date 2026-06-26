export interface ReportCategory {
  category: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
}

export interface ReportOverview {
  members: {
    total: number;
    active: number;
    visitors: number;
    inactive: number;
  };
  cells: { total: number; active: number; membersInCells: number };
  financial: {
    income: number;
    expense: number;
    balance: number;
    monthIncome: number;
    monthExpense: number;
    monthBalance: number;
  };
  events: { upcoming: number };
  campaigns: { active: number };
  prayers: { active: number; answered: number };
  categories: ReportCategory[];
}
