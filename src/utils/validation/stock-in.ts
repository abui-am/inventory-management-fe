import { array, date, object, string } from 'yup';

/**
 * Hanya berisi yang benar-benar ada di form barang masuk.
 *
 * Sebelumnya skema ini menuntut `customer` dan `sender` — dua field milik penjualan yang
 * tidak pernah ada di halaman ini. Keduanya lolos hanya karena yup memberi objek yang
 * tidak dikirim nilai bawaan `{}`; begitu salah satunya benar-benar dipakai, form ini
 * akan tertutup tanpa pesan apa pun.
 */
export const validationSchemaStockIn = object().shape({
  supplier: object().nullable().required('* Required'),
  dateIn: date().nullable().required('* Required'),
  stockAdjustment: array().min(1, 'Minimal 1 barang'),
  invoiceNumber: string().nullable(),
  memo: string().nullable(),
});
