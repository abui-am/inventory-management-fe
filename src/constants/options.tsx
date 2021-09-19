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
    value: 'bond',
  },
];
