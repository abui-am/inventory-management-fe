import { LedgerSourceType } from '@/typings/ledgers';

/**
 * Lima golongan akun, lima warna. Warnanya BUKAN hiasan: ia menjawab "ini akun apa"
 * tanpa pengguna perlu hafal daftar akunnya. Di luar kelima ini tidak ada warna lain.
 */
export type Golongan = 'harta' | 'kewajiban' | 'pendapatan' | 'beban' | 'modal' | 'penutup';

export const GOLONGAN: Record<Golongan, { label: string; variant: BadgeVariant; dot: string }> = {
  harta: { label: 'Harta', variant: 'info', dot: 'bg-info' },
  kewajiban: { label: 'Kewajiban', variant: 'warning', dot: 'bg-warning' },
  pendapatan: { label: 'Pendapatan', variant: 'success', dot: 'bg-success' },
  beban: { label: 'Beban', variant: 'destructive', dot: 'bg-destructive' },
  modal: { label: 'Modal', variant: 'accent', dot: 'bg-accent' },
  // Akun penutup tidak muncul di legenda — ia bukan golongan, cuma kendaraan saat
  // tutup buku — jadi sengaja tidak diberi warna.
  penutup: { label: 'Penutup', variant: 'neutral', dot: 'bg-foreground-subtle' },
};

type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'destructive' | 'info';

/**
 * Nama akun dieja PERSIS seperti backend menulisnya (`LedgerAccount::$types`), karena
 * nama itulah yang dikirim sebagai `description` tiap baris. Salah satu huruf dan
 * akunnya jatuh ke golongan default tanpa error apa pun.
 */
const GOLONGAN_AKUN: Record<string, Golongan> = {
  Kas: 'harta',
  Bank: 'harta',
  Giro: 'harta',
  Piutang: 'harta',
  Persediaan: 'harta',
  'Biaya Bayar Di Muka': 'harta',
  Utang: 'kewajiban',
  Penjualan: 'pendapatan',
  'Pendapatan Lain-Lain': 'pendapatan',
  'Harga Pokok Penjualan': 'beban',
  Beban: 'beban',
  Modal: 'modal',
  Prive: 'modal',
  'Laba Diambil Owner': 'modal',
  'Ikhtisar Laba Rugi': 'penutup',
  'Laba Ditahan': 'penutup',
};

/**
 * Golongan sebuah baris, dari nama akunnya — dengan jenis dokumen asal sebagai cadangan.
 *
 * Cadangan itu bukan kemewahan: baris debit sebuah beban TIDAK ditulis dengan nama akun
 * "Beban", melainkan dengan nama bebannya sendiri ("bensin") — lihat
 * `CreateLedgerJob::setExpenseLedger()`. Nama seperti itu mustahil ada di daftar mana
 * pun, jadi tanpa cadangan ini ia jatuh ke abu-abu "penutup", padahal jelas beban.
 */
export const golonganAkun = (nama: string, sumber?: LedgerSourceType | null): Golongan => {
  const dariNama = GOLONGAN_AKUN[nama];
  if (dariNama) return dariNama;
  if (sumber === 'expenses') return 'beban';
  if (sumber === 'prives') return 'modal';
  return 'penutup';
};

/** Urutan legenda. `penutup` tidak ikut — lihat catatan di GOLONGAN. */
export const GOLONGAN_LEGENDA: Golongan[] = ['harta', 'kewajiban', 'pendapatan', 'beban', 'modal'];

/** Halaman tujuan tiap jenis sumber. `null` = belum ada halamannya. */
export const HALAMAN_SUMBER: Record<LedgerSourceType, string | null> = {
  transactions: '/transaction',
  expenses: '/expense',
  prives: '/prive',
  ledger_top_ups: '/convert-balance',
  debts: '/debt',
  capital_reports: '/laporan-perubahan-modal',
};
