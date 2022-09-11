import { Link } from './common';

export interface Payment {
  cash: number;
  change: number;
  payment_method: string;
  maturity_date?: string;
}

export interface Item {
  id: string;
  purchase_price: number;
  discount?: unknown;
  quantity: number;
  note: string;
}

export interface CreateSaleBody {
  transactionable_type: 'customers';
  transactionable_id: string;
  sender_id: string;
  invoice_number?: unknown;
  purchase_date: string;
  payments: Payment[];
  note: string;
  discount: number;
  items: Item[];
}

export interface CreateSaleResponse {
  transaction: {
    id: string;
    invoice_number: string;
    transaction_code: string;
  };
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position?: unknown;
  has_dashboard_account: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Pic {
  id: string;
  username: string;
  created_at: Date;
  updated_at: Date;
  employee: Employee;
}

export interface Sender {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  has_dashboard_account: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Customer {
  id: string;
  full_name: string;
  phone_number: string;
  address: string;
  created_at: Date;
  updated_at: Date;
}

export interface SalePayment {
  transaction_id: string;
  payment_date: Date;
  payment_price: number;
  cash: number;
  change: number;
  maturity_date?: Date;
  paid: boolean;
  payment_method: string;
  created_at: Date;
  updated_at: Date;
}

export interface Pivot {
  transaction_id: string;
  item_id: string;
  purchase_price: number;
  quantity: number;
  discount?: number;
  total_price: number;
  item_name: string;
  item_unit: string;
  note: string;
  created_at: Date;
  updated_at: Date;
  median_purchase_price: number;
}

export interface SaleItem {
  id: string;
  name: string;
  slug: string;
  quantity: number;
  unit: string;
  created_at: Date;
  updated_at: Date;
  pivot: Pivot;
}

export interface SaleTransactionsData {
  id: string;
  invoice_number: string;
  transaction_code: string;
  purchase_date: string;
  payment_method: string;
  status: string;
  note: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: unknown;
  pic: Pic;
  sender: Sender;
  discount: number;
  customer: Customer;
  payments: SalePayment[];
  items: SaleItem[];
}

export interface SalesTransactions {
  current_page: number;
  data: SaleTransactionsData[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Link[];
  next_page_url?: unknown;
  path: string;
  per_page: number;
  prev_page_url?: unknown;
  to: number;
  total: number;
}

export interface SalesResponse {
  transactions: SalesTransactions;
}

export interface SalesResponseUnpaginated {
  transactions: SaleTransactionsData[];
}
