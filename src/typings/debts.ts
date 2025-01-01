export interface Datum {
  id: string;
  type: string;
  description: string;
  amount: string;
  due_date: string;
  is_paid: boolean;
  paid_date?: any;
  paid_amount: string;
  created_at: Date;
  updated_at: Date;
  related_model: {
    id: string;
    name: string;
  };
}

export interface Link {
  url: string;
  label: string;
  active: boolean;
}

export interface Debts {
  current_page: number;
  data: Datum[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Link[];
  next_page_url?: any;
  path: string;
  per_page: number;
  prev_page_url?: any;
  to: number;
  total: number;
}

export interface DebtResponse {
  debts: Debts;
}

export interface PayDebtPayload {
  id: string;
  data: {
    paid_amount: number;
    payment_method: string;
  };
}
