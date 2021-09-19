import { Link } from './common';

export interface RolesData {
  id: number;
  name: string;
  guard_name: string;
}

export interface RolesResponse {
  roles: {
    current_page: number;
    data: RolesData[];
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
  };
}

export interface RolesResponseUnpaginated {
  roles: RolesData[];
}

export type FetchRolesBody = { paginated: boolean; per_page: number };
