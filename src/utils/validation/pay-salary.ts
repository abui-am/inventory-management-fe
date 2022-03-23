import { bool, number, object, ref } from 'yup';

export const salarySchema = () =>
  object().shape({
    salary: number().nullable().required('* Required'),
    paidAmount: number().nullable().required('* Required'),
    payFull: bool().required('* Required'),
    amount: number()
      .nullable()
      .max(ref('salary'), 'Tidak boleh melebihi jumlah gaji')
      .when('payFull', {
        is: false,
        then: (schema) => schema.required('* Required'),
        otherwise: (schema) => schema,
      }),
  });
