import { object, string } from 'yup';

export const validationSchemaSupplier = object().shape({
  name: string().nullable().required('* Required'),
  address: string().nullable(),
  phoneNumber: string().nullable(),
});
