import { Link, Status } from './common';

export interface Item {
  id: string;
  item_id: string;
  purchase_price: number;
  discount?: number;
  quantity: number;
  note: string;
}

export interface Payment {
  maturity_date?: Date | string;
  cash: number;
  change: number;
  created_at: Date;
  paid: boolean;
  payment_date: Date;
  payment_method: string;
  payment_price: number;
  transaction_id: string;
  updated_at: Date;
}

export interface CreateTransactionBody {
  transactionable_id: string;
  invoice_number?: unknown;
  purchase_date: string;
  note: string;
  items: Item[];
  payments: Partial<Payment>[];
  transactionable_type: string;
  shipping_cost?: number;
}

export type CreateStockInBody = Omit<CreateTransactionBody, 'transactionable_type'> & {
  transactionable_type: 'suppliers';
};

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

export interface Supplier {
  id: string;
  name: string;
  address?: string;
  /** Utang berjalan ke supplier ini; ikut di `Supplier::simpleView()`. */
  total_receivable?: number;
  created_at: Date;
  updated_at: Date;
}

export interface TrasactionPayment {
  transaction_id: string;
  payment_date: string;
  payment_price: number;
  maturity_date: string;
  paid: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TrasactionPivot {
  transaction_id: string;
  item_id: string;
  purchase_price: number;
  quantity: number;
  discount?: number;
  total_price: number;
  item_name: string;
  item_unit: string;
  note: string;

  median_purchase_price?: number;
}

export interface TrasactionItem {
  id: string;
  /** Kode barang yang dipakai kasir mencarinya — beda dengan `id` yang uuid. */
  item_id?: string;
  name: string;
  slug: string;
  quantity?: unknown;
  unit: string;
  /** Harga jual yang berlaku sekarang; dikirim `Item::transactionSimpleView()`. */
  sell_price?: number;
  created_at: Date;
  updated_at: Date;
  pivot: TrasactionPivot;
}

export interface TransactionData {
  id: string;
  invoice_number: string;
  transaction_code: string;
  purchase_date: string;
  payment_method: string;
  status: Status;
  note: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: unknown;
  pic: Pic;
  supplier: Supplier;
  payments: Payment[];
  discount: number;
  /** Dikirim `Transaction::simpleView()` pada setiap transaksi; belum pernah ditulis di sini. */
  shipping_cost: number;
  items: TrasactionItem[];
  /** Retur yang pernah terjadi pada barang masuk ini — kosong untuk yang belum pernah. */
  returns?: StockInReturn[];
}

export interface StockInReturnItem {
  id: string;
  item_id: string;
  item_name: string;
  item_unit: string;
  purchase_price: number;
  quantity: number;
  total_price: number;
}

export interface StockInReturn {
  id: string;
  transaction_id: string;
  reason: string;
  total_price: number;
  returned_at: string;
  returned_by?: { employee?: { first_name?: string; last_name?: string } } | null;
  items: StockInReturnItem[];
  created_at: Date;
}

export interface ReturnStockInBody {
  reason: string;
  items: { id: string; quantity: number }[];
}

export interface Transactions {
  current_page: number;
  data: TransactionData[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Link[];
  next_page_url?: string;
  path: string;
  per_page: number;
  prev_page_url?: string;
  to: number;
  total: number;
}

export interface TransactionsResponse {
  transactions: Transactions;
}

export interface TransactionResponse {
  transaction: TransactionData;
}
