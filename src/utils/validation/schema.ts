import { number, object, Reference, string } from 'yup';

export const sEmployee = object().nullable();
export const sSalaryAmount = (amount: number | Reference<number>) =>
  number().moreThan(0, 'Harus lebih dari IDR Rp0').max(amount, 'Jumlah harus kurang atau sama dengan gaji');
export const sDate = string().nullable();
