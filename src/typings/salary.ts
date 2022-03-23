export type CreateSalaryPayload = {
  month: string;
};

export type PayPayrollPayload = {
  id: string;
  data: {
    amount: number;
  };
};

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  active: boolean;
}

export interface Datum {
  id: string;
  employee: Employee;
  status: string;
  paid_in_advance: boolean;
  paid_amount: number;
  payroll_date: string;
  employee_position: string;
  employee_salary: number;
  created_at: Date;
  updated_at: Date;
}

export interface Link {
  url: string;
  label: string;
  active: boolean;
}

export interface Payrolls {
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

export interface SalaryResponse {
  payrolls: Payrolls;
}

export type UpdatePayrollPayload = {
  amount: number;
};
