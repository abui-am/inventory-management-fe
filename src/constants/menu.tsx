import { ArchiveFill, PeopleFill } from 'react-bootstrap-icons';
const MENU_LIST = [
  {
    id: 'karyawan',
    slug: '/',
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
