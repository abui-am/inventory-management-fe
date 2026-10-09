import { EmployeeDataWithSalary } from './employee';

export type CreateSalaryPayload = {
  month: string;
};

export type PayPayrollPayload = {
  id: string;
  data: {
    amount: number;
    payment_method: string;
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
  next_page_url?: string | null;
  path: string;
  per_page: number;
  prev_page_url?: string | null;
  to: number;
  total: number;
}

export interface PreviewPayrolls {
  current_page: number;
  data: EmployeeDataWithSalary[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Link[];
  next_page_url?: string | null;
  path: string;
  per_page: number;
  prev_page_url?: string | null;
  to: number;
  total: number;
}

export interface SalaryResponse {
  payrolls: Payrolls;
}

/**
 * Bentuk jawaban `POST /payrolls` saat `paginated: false`.
 *
 * `PayrollController::index` memetakan koleksi biasa di cabang itu, jadi `payrolls`
 * datang sebagai array — bukan objek paginasi. Dipakai untuk menjumlahkan gaji satu
 * bulan penuh, yang tidak bisa dibaca dari satu halaman tabel.
 */
export interface SalaryUnpaginatedResponse {
  payrolls: Datum[];
}

export type UpdatePayrollPayload = {
  amount: number;
};

export interface PreviewSalaryResponse {
  employees: PreviewPayrolls;
}
