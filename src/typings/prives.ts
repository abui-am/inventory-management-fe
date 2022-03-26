export interface User {
  id: string;
  username: string;
  created_at: Date;
  updated_at: Date;
}

export interface Datum {
  id: string;
  description: string;
  amount: string;
  prive_date: string;
  created_at: Date;
  updated_at: Date;
  user: User;
}

export interface Link {
  url: string;
  label: string;
  active: boolean;
}

export interface Prives {
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

export interface PrivesResponse {
  prives: Prives;
}

export type CreatePrivePayload = {
  description: string;
  amount: number;
  prive_date: string;
};
