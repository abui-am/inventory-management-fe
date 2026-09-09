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

export const PRIVES_SORT_BY_OPTIONS = [
  {
    label: 'Sortir berdasarkan tanggal',
    value: 'prive_date',
    data: ['prive_date'],
  },
  {
    label: 'Sortir berdasarkan jumlah penarikan',
    value: 'amount',
    data: ['amount'],
  },
];

export const PAYROLLS_SORT_BY_OPTIONS = [
  {
    label: 'Sortir berdasarkan status',
    value: 'status',
    data: ['status'],
  },
  {
    label: 'Sortir berdasarkan gaji',
    value: 'employee_salary',
    data: ['employee_salary'],
  },
];

export const ADVANCE_PAYROLLS_SORT_BY_OPTIONS = [
  {
    label: 'Sortir berdasarkan tanggal',
    value: 'created_at',
    data: ['created_at'],
  },
  {
    label: 'Sortir berdasarkan jumlah',
    value: 'amount',
    data: ['amount'],
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

export const LEDGER_TOP_UPS_SORT_BY_OPTIONS = [
  {
    label: 'Sortir berdasarkan tanggal transaksi',
    value: 'updated_at',
    data: ['updated_at'],
  },
  {
    label: 'Sortir berdasarkan jumlah transaksi',
    value: 'amount',
    data: ['amount'],
  },
];

export const EXPENSES_SORT_BY_OPTIONS = [
  {
    label: 'Sortir berdasarkan terbaru',
    value: 'created_at',
    data: ['created_at'],
  },
  {
    label: 'Sortir berdasarkan nama',
    value: 'name',
    data: ['name'],
  },
  {
    label: 'Sortir berdasarkan deskripsi',
    value: 'description',
    data: ['description'],
  },

  {
    label: 'Sortir berdasarkan jumlah',
    value: 'amount',
    data: ['amount'],
  },
  {
    label: 'Sortir berdasarkan metode pembayaran',
    value: 'payment_method',
    data: ['payment_method'],
  },
  {
    label: 'Sortir berdasarkan tanggal',
    value: 'date',
    data: ['date'],
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

export const CUSTOMER_SORT_BY_OPTIONS = [
  {
    label: 'Sortir berdasarkan nama',
    value: 'full_name',
    data: ['full_name'],
  },
  {
    label: 'Sortir berdasarkan alamat',
    value: 'address',
    data: ['address'],
  },
];

export const DEBT_SORT_BY_OPTIONS = [
  {
    label: 'Sortir berdasarkan tanggal',
    value: 'created_at',
    data: ['created_at'],
  },
  {
    label: 'Sortir berdasarkan status',
    value: 'is_paid',
    data: ['is_paid'],
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
  {
    label: 'Bank',
    value: 'bank',
  },
];

export const PAYMENT_METHOD_OPTIONS_DEBT = [
  { label: 'Cash', value: 'cash' },
  {
    label: 'Bank',
    value: 'bank',
  },
  {
    label: 'Giro',
    value: 'current_account',
  },
];

// Beda dengan Option di typings/common.ts: value-nya angka, bukan string.
export type PerPageOption = { label: string; value: number };

// "Munculkan 10" terpotong jadi "Munc…" di kotak selebar toolbar. Konteksnya sudah
// jelas dari tempatnya berdiri — di samping penomoran halaman.
export const PER_PAGE_OPTIONS: PerPageOption[] = [
  { label: '5 / hal', value: 5 },
  { label: '10 / hal', value: 10 },
  { label: '20 / hal', value: 20 },
  { label: '50 / hal', value: 50 },
];
