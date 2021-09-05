/* eslint-disable camelcase */
export type BackendRes<T> = {
  status_code: number;
  message: string;
  data: T;
};

export type EmployeeRes = {
  employees: {
    current_page: number;
    data: EmployeeData[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    next_page_url: string;
    path: string;
    per_page: number;
    prev_page_url?: string;
    to: number;
    total: number;
  };
};

export type EmployeeData = {
  id: string;
  first_name: string;
  last_name?: string;
  position?: string;
  has_dashboard_account: boolean;
  created_at: Date;
  updated_at: Date;
};

export type EmployeeDetailRes = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  gender: string;
  email: string;
  handphoneNumber: string;
  address: string;
  birthday: Date;
};
