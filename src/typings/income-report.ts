export type Income = {
  sales: number;
  hpp: number;
  discounts: number;
  sales_per_user: Record<string, number>;
};

export type Expense = {
  id: string;
  name: string;
  amount: number;
  expenses_per_user: Record<string, number>;
};

export type IncomeReport = {
  income_report: {
    incomes: Income;
    expenses: Expense[];
    total_income: number;
    total_expense: number;
    total_profit: number;
  };
};
