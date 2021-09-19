import { Link } from './common';

export interface RegionProvincesRes {
  provinces: {
    current_page: number;
    data: RegionProvincesResData[];
    first_page_url: string;
    from?: number;
    last_page: number;
    last_page_url: string;
    links: Link[];
    next_page_url?: string;
    path: string;
    per_page: number;
    prev_page_url?: string;
    to?: number;
    total: number;
  };
}

export interface RegionProvincesResData {
  id: number;
  name: string;
}

export interface RegionCitiesRes {
  cities: {
    current_page: number;
    data: RegionCitiesResData[];
    first_page_url: string;
    from?: number;
    last_page: number;
    last_page_url: string;
    links: Link[];
    next_page_url?: string;
    path: string;
    per_page: number;
    prev_page_url?: string;
    to?: number;
    total: number;
  };
}

export interface RegionCitiesResData {
  id: number;
  name: string;
  type: string;
}

export interface RegionSubdistrictRes {
  subdistricts: {
    current_page: number;
    data: RegionSubdistrictResData[];
    first_page_url: string;
    from?: number;
    last_page: number;
    last_page_url: string;
    links: Link[];
    next_page_url?: string;
    path: string;
    per_page: number;
    prev_page_url?: string;
    to?: number;
    total: number;
  };
}

export interface RegionSubdistrictResData {
  id: number;
  name: string;
  type: string;
}

export interface RegionVilageRes {
  villages: {
    current_page: number;
    data: RegionVillageResData[];
    first_page_url: string;
    from?: number;
    last_page: number;
    last_page_url: string;
    links: Link[];
    next_page_url?: string;
    path: string;
    per_page: number;
    prev_page_url?: string;
    to?: number;
    total: number;
  };
}

export interface RegionVillageResData {
  id: number;
  name: string;
}
