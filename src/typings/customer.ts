export interface Datum {
  id: string;
  full_name: string;
  phone_number: string;
  address: string;
  created_at: Date;
  updated_at: Date;
}

export interface Link {
  url: string;
  label: string;
  active: boolean;
}

export interface Customers {
  current_page: number;
  data: Datum[];
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

export interface CustomersResponse {
  customers: Customers;
}
