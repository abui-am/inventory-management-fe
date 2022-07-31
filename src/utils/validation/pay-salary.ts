import { bool, mixed, number, object, ref } from 'yup';

export const salarySchema = () =>
  object().shape({
    salary: number().moreThan(0, 'Harus lebih dari IDR Rp0').nullable().required('* Required'),
    paidAmount: number().nullable(),
    payFull: bool().nullable(),
    transactionType: mixed().nullable().required('* Required'),
    amount: number()
      .nullable()
      .moreThan(0, 'Harus lebih dari IDR Rp0')
      .max(ref('salary'), 'Tidak boleh melebihi jumlah gaji')
      .when('payFull', {
        is: false,
        then: (schema) => schema.required('* Required'),
        otherwise: (schema) => schema,
      }),
  });
