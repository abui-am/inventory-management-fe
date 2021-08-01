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
  firstName: string;
  lastName: string;
  position: string;
  hasDashboardAccount: boolean;
};
