import { ArchiveFill, Box, Calculator, House, Pen, PeopleFill, Person } from 'react-bootstrap-icons';
const MENU_LIST = [
  {
    id: 'home',
    slug: '/',
    displayName: 'Beranda',
    icon: (props = {}): JSX.Element => <House {...props} />,
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
    displayName: 'Stock In',
    icon: (props = {}): JSX.Element => <ArchiveFill {...props} />,
    permission: 'control:stock',
  },
  {
    id: 'stock.confirmation',
    slug: '/stock-in-confirmation',
    displayName: 'Konfirmasi Stock in',
    icon: (props = {}): JSX.Element => <ArchiveFill {...props} />,
    permission: 'control:stock.confirmation',
  },
  {
    id: 'sellprice.adjustment',
    slug: '/sell-price-adjustment',
    displayName: 'Konfirmasi Stock in',
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
];

export default MENU_LIST;
