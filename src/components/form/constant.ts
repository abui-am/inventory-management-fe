import { date, mixed, number, object, ref, string } from 'yup';

export const validationSchemaSupplier = object().shape({
  name: string().nullable().required('* Required'),
  address: string().nullable(),
  phoneNumber: string().nullable(),
});

export const validationSchemaCustomer = object().shape({
  fullName: string().nullable().required('* Required'),
  address: string().nullable(),
  phoneNumber: string().nullable(),
});

export const validationSchemaConfirmationAudit = object().shape({
  auditQty: number().nullable().required('* Required'),
});

export const validationSchemaPrive = object().shape({
  description: string().nullable().required('* Required'),
  amount: number().moreThan(0, 'Harus lebih dari 0').nullable().required('* Required'),
  date: date().nullable().required('* Required'),
});

export const validationSchemaPayDebt = object().shape({
  debtAmount: number().nullable().required('* Required'),
  paidAmount: number().nullable().required('* Required'),
  unpaidAmount: number().nullable().required('* Required'),
  amount: number()
    .nullable()
    .moreThan(0)
    .max(ref('unpaidAmount'), 'Melebihi jumlah yang belum dibayarkan')

    .when('payFull', {
      is: false,
      then: (sch) => sch.required('* Required'),
      otherwise: (sch) => sch,
    }),

  paymentMethod: mixed().nullable().required('* Required'),
});

export const validationSchemaLedgerTopUp = object().shape({
  amount: number().moreThan(0, 'Harus lebih dari 0').nullable().required('* Required'),
  paymentMethod: mixed().nullable().required('* Required'),
});
