import { Link } from './common';

export interface SupplierData {
  id: string;
  name: string;
  address: string;
  phone_number: string;
  total_receivable: number;
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

export interface SupplierDetail {
  id: string;
  name: string;
  address?: string;
  phone_number?: string;
  created_at: Date;
  updated_at: Date;
}

export interface SuppliersResponse {
  suppliers: Suppliers;
}

export interface SupplierDetailResponse {
  supplier: SupplierDetail;
}

export interface CreateSupplierResponse {
  supplier: {
    id: string;
    name: string;
  };
}

export type CreateSupplierBody = Partial<Omit<SupplierData, 'id'>>;
