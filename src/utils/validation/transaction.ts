import { array, bool, number, object, ref, string } from 'yup';

export const validationSchemaItem = object().shape({
  item: object().nullable().required('* Required'),
  maxQty: number().moreThan(0, 'Harus lebih dari IDR Rp0').nullable(),
  discount: number().moreThan(0, 'Harus lebih dari IDR Rp0').nullable(),
  qty: number().moreThan(0, 'Harus lebih dari 0').max(ref('maxQty'), 'Tidak boleh lebih dari jumlah barang').nullable(),
  id: string().nullable(),
});

export const validationSchemaTransaction = object().shape({
  payAmount: number().moreThan(0, 'Harus lebih dari IDR Rp0').nullable().required('* Required'),
  dateIn: string().nullable(),
  stockAdjustment: array().nullable(),
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
  totalPrice: number().moreThan(0, 'Harus lebih dari IDR Rp0').nullable().required('* Required'),
});
