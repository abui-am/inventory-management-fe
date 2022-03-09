export const genderOptions = [
  {
    label: 'Laki-laki',
    value: 'male',
  },
  {
    label: 'Perempuan',
    value: 'female',
  },
];

export const INVOICE_TYPE_OPTIONS = [
  {
    label: 'Manual',
    value: 'manual',
  },
  {
    label: 'Otomatis',
    value: 'automatic',
  },
];

export const EMPLOYEE_SORT_BY_OPTIONS = [
  {
    label: 'Sortir berdasarkan nama',
    value: 'name',
    data: ['first_name', 'last_name'],
  },
  {
    label: 'Sortir berdasarkan jabatan',
    value: 'position',
    data: ['position'],
  },
];

export const SALE_SORT_BY_OPTIONS = [
  {
    label: 'Sortir berdasarkan tanggal',
    value: 'date',
    data: ['created_at'],
  },
  {
    label: 'Sortir berdasarkan pembayaran',
    value: 'status',
    data: ['payment_method'],
  },
];

export const STOCK_IN_SORT_BY_OPTIONS = [
  {
    label: 'Sortir berdasarkan tanggal',
    value: 'date',
    data: ['created_at'],
  },
  {
    label: 'Sortir berdasarkan pembayaran',
    value: 'payment_menthod',
    data: ['payment_method'],
  },

  {
    label: 'Sortir berdasarkan status',
    value: 'status',
    data: ['status'],
  },
];

export const ITEMS_SORT_BY_OPTIONS = [
  {
    label: 'Sortir berdasarkan nama',
    value: 'name',
    data: ['name'],
  },
  {
    label: 'Sortir berdasarkan jumlah',
    value: 'quantity',
    data: ['quantity'],
  },

  {
    label: 'Sortir berdasarkan kemasan',
    value: 'unit',
    data: ['unit'],
  },
  {
    label: 'Sortir berdasarkan tanggal masuk',
    value: 'updated_at',
    data: ['updated_at'],
  },
];

export const SUPPLIER_SORT_BY_OPTIONS = [
  {
    label: 'Sortir berdasarkan nama',
    value: 'name',
    data: ['name'],
  },
  {
    label: 'Sortir berdasarkan alamat',
    value: 'address',
    data: ['address'],
  },
];

export const SORT_TYPE_OPTIONS = [
  {
    label: 'Sortir naik',
    value: 'asc',
  },
  { label: 'Sortir menurun', value: 'desc' },
];

export const PAYMENT_METHOD_OPTIONS = [
  { label: 'Cash', value: 'cash' },
  {
    label: 'Utang',
    value: 'debt',
  },
  {
    label: 'Giro',
    value: 'current_account',
  },
];

export const PER_PAGE_OPTIONS = [
  { label: 'Munculkan 5', value: 5 },
  { label: 'Munculkan 10', value: 10 },
  { label: 'Munculkan 20', value: 20 },
];
