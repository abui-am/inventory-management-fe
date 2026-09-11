/** Dokumen yang menulis sebuah baris buku besar — morph `ledgerable` di backend. */
export type LedgerSourceType =
  | 'transactions'
  | 'expenses'
  | 'prives'
  | 'ledger_top_ups'
  | 'debts'
  | 'capital_reports';

export interface LedgerSource {
  type: LedgerSourceType;
  /** Id dokumen asalnya. SEMUA baris dengan id yang sama adalah satu ayat jurnal. */
  id: string;
  /** Penanda pendek yang dikenali manusia, mis. kode transaksi. Tidak semua punya. */
  code: string | null;
  label: string | null;
}

export interface Datum {
  id: string;
  description: string;
  type: string;
  remaining_balance: number;
  amount: number;
  created_at: Date | string;
  updated_at: Date | string;
  /**
   * `null` untuk baris yang memang tidak punya dokumen asal — di data sekarang ada 12,
   * seluruhnya baris tutup buku (Ikhtisar Laba Rugi) yang ditulis tanpa mengisi morph.
   */
  source: LedgerSource | null;
}

export interface Link {
  url: string;
  label: string;
  active: boolean;
}

export interface Ledgers {
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

export interface Total {
  debit: number;
  credit: number;
  difference: number;
}

export interface GetLedgersResponse {
  ledgers: Ledgers;
  total: Total;
}

export interface GetLedgersResponseUnpaginated {
  ledgers: Datum[];
  total: Total;
}
