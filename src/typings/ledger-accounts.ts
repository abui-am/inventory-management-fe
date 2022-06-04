import { Link } from './common';

export interface LedgerAccountData {
  id: string;
  name: string;
  type: string;
  balance: number;
  created_at: Date;
  updated_at: Date;
}

export interface LedgerAccounts {
  current_page: number;
  data: LedgerAccountData[];
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

export interface GetLedgerAccountsResponse {
  ledger_accounts: LedgerAccounts;
}
