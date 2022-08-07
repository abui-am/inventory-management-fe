export interface Datum {
  id: string;
  description: string;
  type: string;
  remaining_balance: number;
  amount: number;
  created_at: Date;
  updated_at: Date;
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
  next_page_url?: any;
  path: string;
  per_page: number;
  prev_page_url?: any;
  to: number;
  total: number;
}

export interface GetLedgersResponse {
  ledgers: Ledgers;
}
