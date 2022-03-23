export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  has_dashboard_account: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Datum {
  id: string;
  employee: Employee;
  amount: number;
  employee_position: string;
  payroll_month: string;
  created_at: Date;
  updated_at: Date;
}

export interface Link {
  url: string;
  label: string;
  active: boolean;
}

export interface AdvancePayrolls {
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

export interface AdvancePayrollsResponse {
  advance_payrolls: AdvancePayrolls;
}

export type CreateAdvancePayrollsPayload = {
  employee_id: string;
  amount: number;
  payroll_month: string; // YYYY-MM
};
