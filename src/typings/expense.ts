export interface CreateExpensePayload {
  name: string;
  description: string;
  amount: number;
  date?: string | null;
  payment_method: string;
}

export interface Expense {
  id: string;
  name: string;
  description: string;
  amount: number;
  payment_method: string;
  date: string;
  created_at: Date;
  updated_at: Date;
}

export interface Link {
  url: string;
  label: string;
  active: boolean;
}

export interface Expenses {
  current_page: number;
  data: Expense[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Link[];
  next_page_url?: string | null;
  path: string;
  per_page: number;
  prev_page_url?: string | null;
  to: number;
  total: number;
}

export interface ExpensesResponse {
  expenses: Expenses;
}
