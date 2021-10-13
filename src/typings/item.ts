import { Link } from './common';

export interface ItemData {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  created_at: Date;
  updated_at: Date;
}

export interface Items {
  current_page: number;
  data: ItemData[];
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

export interface ItemsResponse {
  items: Items;
}

export interface CreateItemsBody {
  name: string;
  unit: string;
}

export interface CreateItemsResponse {
  item: {
    id: string;
    name: string;
  };
}
