import { ArchiveFill, House, PeopleFill } from 'react-bootstrap-icons';
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
    id: 'inventory',
    slug: '/inventory',
    displayName: 'Inventory',
    icon: (props = {}): JSX.Element => <ArchiveFill {...props} />,
  },
];

export default MENU_LIST;
