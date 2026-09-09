import {
  ArrowLeftRight,
  BadgeCheck,
  Banknote,
  BookOpen,
  Boxes,
  Briefcase,
  ClipboardList,
  Coins,
  CreditCard,
  FileBarChart,
  Home,
  Landmark,
  PackagePlus,
  PiggyBank,
  Receipt,
  ScrollText,
  Tags,
  TrendingUp,
  Truck,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';

/**
 * Sidebar dikelompokkan, bukan 24 baris datar. Memindai 24 item yang semuanya berikon
 * koin untuk menemukan satu halaman memakan waktu lebih lama daripada membaca lima
 * judul grup lalu satu item di dalamnya.
 *
 * Tidak ada halaman yang dihapus atau digabung dan tidak ada rute yang berubah — tautan
 * lama dan bookmark tetap hidup. Yang berubah hanya susunan dan penamaan di sidebar.
 *
 * Daftarnya tetap DATAR. Pengelompokan cuma sebuah field, karena tiga tempat lain
 * (judul halaman di Layout, command palette, penyaringan hak akses) mencari item
 * berdasarkan slug — struktur bersarang akan memaksa ketiganya ikut berubah tanpa
 * memberi apa pun.
 */
export const MENU_GROUPS = [
  { id: 'penjualan', label: 'Penjualan' },
  { id: 'pembelian', label: 'Pembelian' },
  { id: 'persediaan', label: 'Persediaan' },
  { id: 'keuangan', label: 'Keuangan' },
  { id: 'karyawan', label: 'Karyawan' },
] as const;

export type MenuGroupId = (typeof MENU_GROUPS)[number]['id'];

export type MenuItem = {
  id: string;
  slug: string;
  /** Nama di sidebar. Boleh pendek: judul grup sudah memberi konteksnya. */
  displayName: string;
  /** Judul di kepala halaman, kalau `displayName` terlalu pendek untuk berdiri sendiri. */
  title?: string;
  /** Tanpa grup berarti berdiri sendiri di paling atas. */
  group?: MenuGroupId;
  icon: (props?: Record<string, unknown>) => JSX.Element;
  permission: string;
};

const MENU_LIST: MenuItem[] = [
  {
    id: 'home',
    slug: '/',
    displayName: 'Beranda',
    icon: (props = {}) => <Home {...props} />,
    permission: 'view:home',
  },

  // — Penjualan —
  {
    id: 'transaction',
    slug: '/transaction',
    displayName: 'Transaksi',
    group: 'penjualan',
    icon: (props = {}) => <Receipt {...props} />,
    permission: 'control:transaction',
  },
  {
    id: 'customer',
    slug: '/customer',
    displayName: 'Customer',
    group: 'penjualan',
    icon: (props = {}) => <UserRound {...props} />,
    permission: 'control:customer',
  },
  {
    id: 'account-receivable',
    slug: '/account-receivable',
    displayName: 'Piutang',
    group: 'penjualan',
    icon: (props = {}) => <Banknote {...props} />,
    permission: 'control:account-receivable',
  },

  // — Pembelian —
  {
    id: 'stock',
    slug: '/stock-in',
    displayName: 'Barang Masuk',
    group: 'pembelian',
    icon: (props = {}) => <PackagePlus {...props} />,
    permission: 'control:stock',
  },
  {
    id: 'stock.confirmation',
    slug: '/stock-in-confirmation',
    displayName: 'Konfirmasi',
    title: 'Konfirmasi Barang Masuk',
    group: 'pembelian',
    icon: (props = {}) => <BadgeCheck {...props} />,
    permission: 'control:stock.confirmation',
  },
  {
    id: 'supplier',
    slug: '/supplier',
    displayName: 'Supplier',
    group: 'pembelian',
    icon: (props = {}) => <Truck {...props} />,
    permission: 'control:supplier',
  },
  {
    id: 'debt',
    slug: '/debt',
    displayName: 'Utang',
    group: 'pembelian',
    icon: (props = {}) => <CreditCard {...props} />,
    permission: 'control:debt',
  },
  {
    id: 'debt-giro',
    slug: '/debt-giro',
    displayName: 'Utang Giro',
    group: 'pembelian',
    icon: (props = {}) => <ScrollText {...props} />,
    permission: 'control:debt-giro',
  },

  // — Persediaan —
  {
    id: 'items',
    slug: '/items',
    displayName: 'Barang',
    group: 'persediaan',
    icon: (props = {}) => <Boxes {...props} />,
    permission: 'control:item',
  },
  {
    id: 'sellprice.adjustment',
    slug: '/sell-price-adjustment',
    displayName: 'Harga Jual',
    title: 'Penyesuaian Harga Jual',
    group: 'persediaan',
    icon: (props = {}) => <Tags {...props} />,
    permission: 'control:stock.adjust-sell-price',
  },
  {
    id: 'inventory.audit',
    slug: '/inventory/audit',
    displayName: 'Audit Barang',
    group: 'persediaan',
    icon: (props = {}) => <ClipboardList {...props} />,
    permission: 'control:audit',
  },
  {
    id: 'inventory.report',
    slug: '/audit/report',
    displayName: 'Laporan Audit',
    group: 'persediaan',
    icon: (props = {}) => <FileBarChart {...props} />,
    permission: 'view:audit',
  },

  // — Keuangan —
  {
    id: 'general-ledger',
    slug: '/general-ledger',
    displayName: 'Jurnal Umum',
    title: 'Keuangan',
    group: 'keuangan',
    icon: (props = {}) => <BookOpen {...props} />,
    permission: 'control:general-ledger',
  },
  {
    id: 'ledger',
    slug: '/ledger',
    displayName: 'Buku Besar',
    title: 'Keuangan',
    group: 'keuangan',
    icon: (props = {}) => <Landmark {...props} />,
    permission: 'control:ledger',
  },
  {
    id: 'expense',
    slug: '/expense',
    displayName: 'Beban',
    title: 'Keuangan',
    group: 'keuangan',
    icon: (props = {}) => <Wallet {...props} />,
    permission: 'control:expense',
  },
  {
    id: 'convert-balance',
    slug: '/convert-balance',
    displayName: 'Konversi Saldo',
    title: 'Keuangan',
    group: 'keuangan',
    icon: (props = {}) => <ArrowLeftRight {...props} />,
    permission: 'control:convert-balance',
  },
  {
    id: 'income-report',
    slug: '/income-report',
    displayName: 'Laporan Pendapatan',
    title: 'Keuangan',
    group: 'keuangan',
    icon: (props = {}) => <TrendingUp {...props} />,
    permission: 'control:income-report',
  },
  {
    id: 'income-user-report',
    slug: '/income-user-report',
    displayName: 'Laporan per Kasir',
    title: 'Keuangan',
    group: 'keuangan',
    icon: (props = {}) => <FileBarChart {...props} />,
    permission: 'control:income-report',
  },
  {
    id: 'laporan-perubahan-modal',
    slug: '/laporan-perubahan-modal',
    displayName: 'Perubahan Modal',
    title: 'Keuangan',
    group: 'keuangan',
    icon: (props = {}) => <Coins {...props} />,
    permission: 'control:capital-change-report',
  },

  // — Karyawan —
  {
    id: 'karyawan',
    slug: '/employee',
    displayName: 'Karyawan',
    group: 'karyawan',
    icon: (props = {}) => <Users {...props} />,
    permission: 'control:profile',
  },
  {
    id: 'monthly-salary',
    slug: '/monthly-salary',
    displayName: 'Gaji Karyawan',
    group: 'karyawan',
    icon: (props = {}) => <Coins {...props} />,
    permission: 'view:monthly-salary',
  },
  {
    id: 'advance-payrolls',
    slug: '/pre-paid-salary',
    displayName: 'Gaji di Muka',
    title: 'Gaji Dibayar di Muka',
    group: 'karyawan',
    icon: (props = {}) => <PiggyBank {...props} />,
    permission: 'control:advance-payrolls',
  },
  {
    id: 'prive',
    slug: '/prive',
    displayName: 'Prive',
    group: 'karyawan',
    icon: (props = {}) => <Briefcase {...props} />,
    permission: 'control:prive',
  },
];

export default MENU_LIST;
