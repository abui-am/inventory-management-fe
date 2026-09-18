import { Link } from './common';

export interface ItemData {
  id: string;
  item_id: string;
  name: string;
  quantity: number;
  unit: string;
  sell_price: number;
  buy_price: number;
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

export interface Item {
  id: string;
  name: string;
  slug: string;
  description?: unknown;
  quantity: number;
  item_id: string;
  buy_price?: number;
  sell_price?: number;
  unit: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: unknown;
}

export interface ItemResponse {
  item: Item;
}
/**
 * Ringkasan persediaan seluruh barang — dihitung backend di samping halamannya.
 *
 * Penyaring tab tidak ikut menghitungnya: angka "stok habis" harus tetap sama saat tab
 * mana pun dibuka.
 */
export interface ItemTotals {
  /** Jumlah seluruh barang — dipakai tab "Semua" supaya angkanya tidak ikut berubah saat menyaring. */
  count: number;
  /** Σ stok × harga beli. */
  value: number;
  out_of_stock: number;
  /** Barang yang belum punya harga jual — kasir tidak bisa menjualnya. */
  unpriced: number;
}

export interface ItemsResponse {
  items: Items;
  totals: ItemTotals;
}

export interface CreateItemsBody {
  name: string;
  unit: string;
  item_id: string;
}

export interface CreateItemsResponse {
  item: {
    id: string;
    name: string;
  };
}
