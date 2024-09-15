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
  income_report: IncomeUserReportChild[];
};

export interface IncomeUserReportChild {
  name: string;
  income: Transaction & {
    total_income: number;
  };
  stock_in: Transaction & {
    total_purchase: number;
  };
  expense: ExpensePerUser;
  balance: Balance;
}

export interface Transaction {
  sales?: number;
  purchases?: number;
  discount?: number;
  shipping_cost: number;
  payment_methods: PaymentMethods;
}

export interface PaymentMethods {
  cash: number;
  bank: number;
  debt?: number;
  current_account?: number;
}

export interface ExpensePerUser {
  expenses: ExpenseItem[];
  total_expense: number;
  payment_methods: PaymentMethods;
}

export interface ExpenseItem {
  name: string;
  amount: number;
}

export interface Balance {
  total_balance: number;
  payment_methods: PaymentMethods;
}
