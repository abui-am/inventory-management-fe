import { number, object, string } from 'yup';

export const sEmployee = object().nullable();
export const sSalaryAmount = (amount: any) => number().max(amount, 'Jumlah harus kurang atau sama dengan gaji');
export const sDate = string().nullable();
