export interface CustomerData {
  id: string;
  full_name: string;
  phone_number: string;
  address: string;
  created_at: Date;
  updated_at: Date;
  total_debt: number;
}

export interface CreateCustomerBody {
  full_name: string;
  phone_number: string;
  address: string;
}

export interface CreateCustomerResponse {
  customer: {
    id: string;
    full_name: string;
  };
}

export interface Link {
  url: string;
  label: string;
  active: boolean;
}

export interface Customers {
  current_page: number;
  data: CustomerData[];
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

export interface CustomersResponse {
  customers: Customers;
}

export interface CustomerDetailResponse {
  customer: CustomerData;
}
