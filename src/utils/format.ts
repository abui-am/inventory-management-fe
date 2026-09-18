import dayjs, { Dayjs } from 'dayjs';

/**
 * Jumlah desimal SENGAJA dikunci, jangan dilepas.
 *
 * Tanpa `minimumFractionDigits`/`maximumFractionDigits`, jumlah desimal untuk IDR
 * diambil dari data CLDR runtime — dan Node dengan Chrome tidak sepakat:
 *
 *   Node 20 (CLDR 47) → "Rp 0,00"   "Rp 17.422.500,00"
 *   Chrome 152        → "Rp 0"      "Rp 17.422.500"
 *
 * Artinya setiap halaman yang menampilkan rupiah merender teks berbeda di server dan
 * di klien. React 18 menanggapi ketidakcocokan teks dengan membuang seluruh pohon SSR
 * dan me-render ulang dari nol (error #425/#418/#423) — halaman tetap tampil, tapi
 * hasil server terbuang dan interaktif jadi lebih lambat.
 *
 * Nol desimal juga yang benar untuk rupiah dan sudah dipakai di seluruh UI.
 */
export function formatToIDR(number: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
}

/**
 * Angka tanpa awalan "Rp", nol desimal, pemisah ribuan Indonesia.
 *
 * Dipakai di tempat yang satuannya sudah jelas dari kolom atau labelnya — "Jumlah",
 * "Subtotal", angka KPI — sehingga "Rp" di tiap sel hanya menambah lebar tanpa
 * menambah keterangan. Alasan mengunci desimalnya sama persis dengan `formatToIDR`
 * di atas: jumlah desimal bawaan diambil dari CLDR runtime dan Node berbeda dari Chrome.
 */
export function formatNumber(number: number) {
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(number);
}

export function formatDate(date: Date | string, { withHour = false }: { withHour?: boolean } = {}) {
  return dayjs(date).format(withHour ? 'DD MMM YYYY HH:mm' : 'DD MMM YYYY');
}

export function formatDateYYYYMMDD(date: Date) {
  return dayjs(date).format('YYYY-MM-DD');
}

export function formatDateYYYYMMDDHHmmss(date: Date | Dayjs) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

export function formatDateYYYYMM(date: Date) {
  return dayjs(date).format('YYYY-MM');
}

export function formatPaymentMethod(payment: string) {
  if (payment === 'current_account') {
    return 'Giro';
  }
  if (payment === 'debt') {
    return 'Utang';
  }

  if (payment === 'bank') {
    return 'Bank';
  }

  return 'Kas';
}

/**
 * Nomor HP Indonesia dikelompokkan supaya bisa dibaca dan dicocokkan sekilas.
 *
 * `6281210008007` → `62 812-1000-8007`. Disimpan tetap sebagai satu deretan angka;
 * pengelompokan ini hanya untuk dilihat. Nomor yang bentuknya di luar dugaan
 * dikembalikan apa adanya — lebih baik tampil mentah daripada tampil salah potong.
 */
export function formatPhoneNumber(phone?: string | null): string {
  const angka = `${phone ?? ''}`.replace(/\D/g, '');
  if (!angka) return '';
  if (!angka.startsWith('62') || angka.length < 9) return angka;

  const sisa = angka.slice(2);
  const bagian = [sisa.slice(0, 3), sisa.slice(3, 7), sisa.slice(7)].filter(Boolean);

  return `62 ${bagian.join('-')}`;
}
