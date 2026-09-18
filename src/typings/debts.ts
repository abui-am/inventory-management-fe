export interface Datum {
  id: string;
  type: string;
  description: string;
  amount: string;
  due_date: string;
  is_paid: boolean;
  paid_date?: string | null;
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
  next_page_url?: string | null;
  path: string;
  per_page: number;
  prev_page_url?: string | null;
  to: number;
  total: number;
}

/**
 * Ringkasan seluruh buku tagihan — dihitung backend di samping halamannya.
 *
 * Penyaring tab tidak ikut menghitungnya: angka "lewat jatuh tempo" harus tetap sama
 * ketika orang membuka tab Lunas.
 */
export interface DebtTotals {
  remaining: number;
  remaining_count: number;
  overdue: number;
  overdue_count: number;
  /** Umur tagihan lewat tempo yang paling lama, dalam hari. */
  overdue_days: number;
  /** Penerimaan pada rentang tanggal yang sedang dipakai halaman; `paid_date` yang dibaca. */
  received: number;
}

export interface DebtResponse {
  debts: Debts;
  totals: DebtTotals;
}

export interface PayDebtPayload {
  id: string;
  data: {
    paid_amount: number;
    payment_method: string;
  };
}
