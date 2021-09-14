export interface RolesData {
  id: number;
  name: string;
  guard_name: string;
}

export interface Link {
  url: string;
  label: string;
  active: boolean;
}

export interface RolesRespond {
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

export interface RolesRespondUnpaginated {
  roles: RolesData;
}

export type FetchRolesBody = { paginated: boolean; per_page: number };
