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

export type IncomeUserReport = {
  income_report: {
    name: 'Super Admin';
    stock_in: {
      purchases: number;
      shipping_cost: number;
      total_purchase: number;
      payment_methods: {
        cash: number;
        bank: number;
        debt: number;
        current_account: number;
      };
    };
  }[];
};
