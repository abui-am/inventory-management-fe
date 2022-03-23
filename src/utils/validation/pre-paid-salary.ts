import { number, object, ref } from 'yup';

import { sDate, sEmployee, sSalaryAmount } from './schema';

export const prepaidSalarySchema = () =>
  object().shape({
    employee: sEmployee.required().required('* Harus diisi'),
    amount: sSalaryAmount(ref('salary')).required('* Harus diisi'),
    salaryDate: sDate.required('* Harus diisi'),
    salary: number().nullable().required('* Harus diisi'),
  });
