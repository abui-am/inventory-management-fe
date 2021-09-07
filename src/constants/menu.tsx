import { ArchiveFill, House, Pen, PeopleFill } from 'react-bootstrap-icons';
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
  },
  {
    id: 'stock',
    slug: '/storage',
    displayName: 'Stock Gudang',
    icon: (props = {}): JSX.Element => <ArchiveFill {...props} />,
  },

  {
    id: 'transaction',
    slug: '/transaction',
    displayName: 'Transaksi',
    icon: (props = {}): JSX.Element => <Pen {...props} />,
  },
];

export default MENU_LIST;
