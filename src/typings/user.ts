import { Employee, Role } from './employee';

export interface User {
  id: string;
  username: string;
  created_at: Date;
  updated_at: Date;
  employee: Employee;
  roles: Role[];
}

export interface UserDetailResponse {
  user: User;
}
