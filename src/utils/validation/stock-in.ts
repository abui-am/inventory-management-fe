import { array, bool, number, object, string } from 'yup';

export const validationSchemaStockIn = object().shape({
  invoiceType: object().nullable().required('*'),

  invoiceNumber: number()
    .nullable()
    .when('invoiceType.value', {
      is: 'manual',
      then: (schema) => schema.required('* Required'),
      otherwise: (schema) => schema,
    }),
  supplier: object().nullable().required('* Required'),
  dateIn: string()
    .nullable()
    .when('paymentMethod.value', {
      is: (value: any) => ['debt', 'current_account'].includes(value),
      then: (schema) => schema.required('* Required'),
      otherwise: (schema) => schema,
    }),
  stockAdjustment: array().min(1, 'Minimal 1 barang').nullable().required('* Required'),
  memo: string().nullable(),
  paymentMethod: object().nullable(),
  customer: object()
    .shape({
      label: string(),
    })
    .nullable()
    .required('* Required'),
  sender: object()
    .shape({
      label: string(),
    })
    .nullable()
    .required('* Required'),
  isNewSupplier: bool().nullable(),
});

export const validationSchemaStockInItem = object().shape({
  item: object().nullable().required('* Required'),
  itemId: string().required('* Required'),
  buyPrice: number().moreThan(0, 'Harus lebih dari IDR Rp0').nullable().required('* Required'),
  discount: number().moreThan(0, 'Harus lebih dari IDR Rp0').nullable(),
  qty: number().moreThan(0, 'Harus lebih dari 0').nullable().required('* Required'),
  unit: string().nullable().required('* Required'),
  memo: string().nullable(),
  isNew: object().nullable(),
});
