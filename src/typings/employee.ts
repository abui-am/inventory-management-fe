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

export type CreateEmployeePutBody = {
  first_name: string;
  last_name: string;
  nik: string;
  birth_date: string;
  gender: string;
  email: string;
  phone_number: string;
  position: string;
  addresses: Address[];
};

export interface Address {
  village_id: number;
  title: string;
  complete_address: string;
}

export interface AddressDetail {
  id: string;
  title: string;
  complete_address: string;
  main: boolean;
  village: Village;
}

export interface Province {
  id: number;
  name: string;
}

export interface City {
  id: number;
  type: string;
  name: string;
  province: Province;
}

export interface Subdistrict {
  id: number;
  name: string;
  city: City;
}

export interface Village {
  id: number;
  name: string;
  subdistrict: Subdistrict;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  nik: string;
  birth_date: string;
  gender: string;
  email: string;
  phone_number: string;
  position: string;
  addresses: AddressDetail[];
}

export interface EmployeeDetailRes {
  employee: Employee;
}

export interface Pivot {
  model_id: string;
  role_id: number;
  model_type: string;
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  created_at?: string;
  updated_at?: string;
  pivot: Pivot;
}

export interface UserRes {
  user: {
    id: string;
    username: string;
    roles: Role[];
  };
}
