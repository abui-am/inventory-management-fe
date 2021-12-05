import { Link } from './common';

export interface Datum {
  id: string;
  name: string;
  unit: string;
  audits: AuditsData[];
}

export type AuditsData = {
  id: string;
  user_id: string;
  item_id: string;
  audit_quantity: number;
  is_valid: boolean;
  is_approved: boolean;
  update_count: number;
  created_at: Date;
  updated_at: Date;
};

export interface Items {
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

export interface ItemAuditsResponse {
  items: Items;
}

export interface ItemUnpaginatedAuditsResponse {
  items: Datum[];
}

export interface CreateItemsAuditBody {
  item_id: string;
  audit_quantity: number;
}

export interface CreateItemsAuditResponse {
  items_audit: {
    id: string;
    audit_quantity: number;
    is_valid: boolean;
    update_count: number;
  };
}
