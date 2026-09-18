import { array, bool, number, object, ref, string } from 'yup';

export const validationSchemaTransaction = object().shape({
  payAmount: number().when('paymentMethod.value', {
    is: 'cash',
    then: (schema) =>
      schema.min(ref('totalPrice'), 'Tidak boleh kurang dari total harga').nullable().required('* Required'),
    otherwise: (schema) => schema.max(ref('totalPrice'), 'Tidak boleh lebih dari total harga'),
  }),
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
  totalPrice: number().moreThan(0, 'Harus lebih dari Rp 0').nullable().required('* Required'),
  // moreThan(0) menolak ongkos kirim 0 — padahal nol adalah nilai yang paling sering
  // benar. Yang perlu ditolak hanya angka negatif.
  shippingCost: number().min(0, 'Tidak boleh negatif').nullable(),
  discount: number().min(0, 'Tidak boleh negatif').nullable(),
});
