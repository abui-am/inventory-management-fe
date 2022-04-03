import { date, number, object, string } from 'yup';

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

export const validationSchemaPrive = object().shape({
  description: string().nullable().required('* Required'),
  amount: number().moreThan(0, 'Harus lebih dari 0').nullable().required('* Required'),
  date: date().nullable().required('* Required'),
});
