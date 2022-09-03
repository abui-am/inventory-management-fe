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
  next_page_url?: any;
  path: string;
  per_page: number;
  prev_page_url?: any;
  to: number;
  total: number;
}

export interface GetLedgerTopUpsResponse {
  ledger_top_ups: LedgerTopUps;
}
