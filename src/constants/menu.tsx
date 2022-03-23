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
];

export default MENU_LIST;
