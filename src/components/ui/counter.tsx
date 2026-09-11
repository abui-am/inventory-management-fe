import { cn } from '@/lib/cn';

/**
 * Angka pendamping sebuah judul: jumlah baris tabel, jumlah item satu seksi, jumlah
 * transaksi per tab penyaring.
 *
 * SATU bentuk untuk semua tempat — angka telanjang, tanpa kata satuan ("3", bukan
 * "3 baris"), tanpa pemisah titik tengah, tanpa lencana berlatar. Ukurannya sengaja
 * lebih kecil dari labelnya sementara kotaknya rata tengah, jadi garis dasarnya duduk
 * sedikit lebih tinggi — itu yang membuatnya terbaca sebagai keterangan, bukan bagian
 * dari judulnya.
 *
 * Dipakai lewat komponen ini, bukan disalin kelasnya, supaya penghitung di halaman
 * mana pun tidak pernah berbeda gaya. Lihat aturan di CLAUDE.md.
 */
export function Counter({ value, className }: { value?: number; className?: string }): JSX.Element | null {
  // `undefined` berarti jumlahnya belum datang — jangan tampilkan 0 yang berbohong.
  if (value === undefined) return null;

  return <span className={cn('font-mono text-2xs tabular-nums text-foreground-subtle', className)}>{value}</span>;
}

export default Counter;
