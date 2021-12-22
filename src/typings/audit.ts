import { Link } from './common';

export interface AuditsData {
  id: string;
  user_id: string;
  item_id: string;
  item_name?: any;
  item_unit?: any;
  audit_quantity: number;
  audit_date?: any;
  is_valid: boolean;
  is_approved: boolean;
  update_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ItemAudits {
  current_page: number;
  data: AuditsData[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Link[];
  next_page_url: string;
  path: string;
  per_page: number;
  prev_page_url?: any;
  to: number;
  total: number;
}

export interface ItemAuditsResponse {
  item_audits: ItemAudits;
}

export interface ItemUnpaginatedAuditsResponse {
  item_audits: AuditsData[];
}
export interface CreateItemsAuditBody {
  item_id?: string;
  audit_quantity?: number;
  audit_date?: string;
}

export interface CreateItemsAuditResponse {
  items_audit: {
    id: string;
    audit_quantity: number;
    is_valid: boolean;
    update_count: number;
  };
}
