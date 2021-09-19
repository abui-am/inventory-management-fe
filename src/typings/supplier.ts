import { Link } from './common';

export interface SupplierData {
  id: string;
  name: string;
  address: string;
  phone_number: string;
}

export interface Suppliers {
  current_page: number;
  data: SupplierData[];
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

export interface SuppliersResponse {
  suppliers: Suppliers;
}
