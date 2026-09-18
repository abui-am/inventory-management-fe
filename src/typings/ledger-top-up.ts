import { Link } from './common';
import { LedgerAccountData } from './ledger-accounts';

export type CreateLedgerTopUpPayload = {
  amount: number;
  payment_method: string;
  ledger_account_id: string;
};

export interface LedgerTopUpsData {
  id: string;
  ledger_account_id: string;
  ledger_account: LedgerAccountData;
  amount: string;
  payment_method: string;
  created_at: Date;
  updated_at: Date;
}

export interface LedgerTopUps {
  current_page: number;
  data: LedgerTopUpsData[];
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

/** Ringkasan satu akun tujuan — dipakai sebagai hitungan tab "Ke Kas", "Ke Bank". */
export interface LedgerTopUpAccountTotal {
  ledger_account_id: string;
  name: string;
  total: number;
  count: number;
}

/**
 * Ringkasan konversi untuk rentang tanggal yang sedang dibuka — dihitung
 * `LedgerTopUpController::totals`, bukan dijumlah dari halaman yang sedang tampil.
 *
 * `capital` dipisah dari `transfer` karena artinya memang beda: sumber "uang pribadi"
 * dikreditkan ke Modal, jadi ia setoran pemilik; sisanya cuma memindahkan uang.
 */
export interface LedgerTopUpTotals {
  total: number;
  count: number;
  capital: number;
  capital_count: number;
  transfer: number;
  transfer_count: number;
  accounts: LedgerTopUpAccountTotal[];
}

export interface GetLedgerTopUpsResponse {
  ledger_top_ups: LedgerTopUps;
  totals: LedgerTopUpTotals;
}
