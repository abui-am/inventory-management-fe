export type Income = {
  sales: number;
  hpp: number;
  discounts: number;
};

export type Expense = {
  id: string;
  name: string;
  amount: number;
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
