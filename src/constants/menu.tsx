import { ArchiveFill, Box, Calculator, Coin, House, Paperclip, Pen, PeopleFill, Person } from 'react-bootstrap-icons';

const MENU_LIST = [
  {
    id: 'home',
    slug: '/',
    displayName: 'Beranda',
    icon: (props = {}): JSX.Element => <House {...props} />,
    permission: 'view:home',
  },
  {
    id: 'karyawan',
    slug: '/employee',
    displayName: 'Karyawan',
    icon: (props = {}): JSX.Element => <PeopleFill {...props} />,
    permission: 'control:profile',
  },
  {
    id: 'transaction',
    slug: '/transaction',
    displayName: 'Transaksi',
    icon: (props = {}): JSX.Element => <Pen {...props} />,
    permission: 'control:transaction',
  },
  {
    id: 'stock',
    slug: '/stock-in',
    displayName: 'Barang Masuk',
    icon: (props = {}): JSX.Element => <ArchiveFill {...props} />,
    permission: 'control:stock',
  },
  {
    id: 'stock.confirmation',
    slug: '/stock-in-confirmation',
    displayName: 'Konfirmasi Barang Masuk',
    icon: (props = {}): JSX.Element => <ArchiveFill {...props} />,
    permission: 'control:stock.confirmation',
  },
  {
    id: 'sellprice.adjustment',
    slug: '/sell-price-adjustment',
    displayName: 'Penyesuaian Harga Jual',
    icon: (props = {}): JSX.Element => <Calculator {...props} />,
    permission: 'control:stock.adjust-sell-price',
  },
  {
    id: 'items',
    slug: '/items',
    displayName: 'Barang',
    icon: (props = {}): JSX.Element => <Box {...props} />,
    permission: 'control:item',
  },
  {
    id: 'supplier',
    slug: '/supplier',
    displayName: 'Supplier',
    icon: (props = {}): JSX.Element => <Person {...props} />,
    permission: 'control:supplier',
  },
  {
    id: 'customer',
    slug: '/customer',
    displayName: 'Customer',
    icon: (props = {}): JSX.Element => <Person {...props} />,
    permission: 'control:customer',
  },
  {
    id: 'inventory.audit',
    slug: '/inventory/audit',
    displayName: 'Audit Barang',
    icon: (props = {}): JSX.Element => <Box {...props} />,
    permission: 'control:audit',
  },
  {
    id: 'inventory.report',
    slug: '/audit/report',
    displayName: 'Laporan Audit',
    icon: (props = {}): JSX.Element => <Paperclip {...props} />,
    permission: 'view:audit',
  },
  {
    id: 'monthly-salary',
    slug: '/monthly-salary',
    displayName: 'Gaji Karyawan',
    icon: (props = {}): JSX.Element => <Coin {...props} />,
    permission: 'view:monthly-salary',
  },
  {
    id: 'advance-payrolls',
    slug: '/pre-paid-salary',
    displayName: 'Gaji dibayar di Muka',
    icon: (props = {}): JSX.Element => <Coin {...props} />,
    permission: 'control:advance-payrolls',
  },
  {
    id: 'prive',
    slug: '/prive',
    displayName: 'Prive',
    icon: (props = {}): JSX.Element => <Coin {...props} />,
    permission: 'control:prive',
  },
  {
    id: 'debt',
    slug: '/debt',
    displayName: 'Utang',
    icon: (props = {}): JSX.Element => <Coin {...props} />,
    permission: 'control:debt',
  },
  {
    id: 'debt-giro',
    slug: '/debt-giro',
    displayName: 'Utang Giro',
    icon: (props = {}): JSX.Element => <Coin {...props} />,
    permission: 'control:debt-giro',
  },

  {
    id: 'account-receivable',
    slug: '/account-receivable',
    displayName: 'Piutang',
    icon: (props = {}): JSX.Element => <Coin {...props} />,
    permission: 'control:account-receivable',
  },
  {
    id: 'general-ledger',
    slug: '/general-ledger',
    displayName: 'Jurnal umum',
    title: 'Keuangan',
    icon: (props = {}): JSX.Element => <Coin {...props} />,
    permission: 'control:general-ledger',
  },
  {
    id: 'ledger',
    slug: '/ledger',
    displayName: 'Buku Besar',
    title: 'Keuangan',
    icon: (props = {}): JSX.Element => <Coin {...props} />,
    permission: 'control:ledger',
  },
  {
    id: 'convert-balance',
    slug: '/convert-balance',
    displayName: 'Konversi Saldo',
    title: 'Keuangan',
    icon: (props = {}): JSX.Element => <Coin {...props} />,
    permission: 'control:convert-balance',
  },
  {
    id: 'expense',
    slug: '/expense',
    displayName: 'Beban',
    title: 'Keuangan',
    icon: (props = {}): JSX.Element => <Coin {...props} />,
    permission: 'control:expense',
  },
  {
    id: 'income-report',
    slug: '/income-report',
    displayName: 'Laporan Pendapatan',
    title: 'Keuangan',
    icon: (props = {}): JSX.Element => <Coin {...props} />,
    permission: 'control:income-report',
  },
  {
    id: 'income-user-report',
    slug: '/income-user-report',
    displayName: 'Laporan Pendapatan Per Kasir',
    title: 'Keuangan',
    icon: (props = {}): JSX.Element => <Coin {...props} />,
    permission: 'control:income-report',
  },
  {
    id: 'laporan-perubahan-modal',
    slug: '/laporan-perubahan-modal',
    displayName: 'Laporan Perubahan Modal',
    title: 'Keuangan',
    icon: (props = {}): JSX.Element => <Coin {...props} />,
    permission: 'control:capital-change-report',
  },
];

export default MENU_LIST;
