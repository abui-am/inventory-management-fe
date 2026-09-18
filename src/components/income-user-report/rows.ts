import { IncomeUserReportChild } from '@/typings/income-report';

export const formatNumber = (n: number): string =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.abs(n));

/** Angka bertanda: yang negatif ditulis dengan minus panjang, bukan tanda kurung. */
export const formatBertanda = (n: number): string => (n < 0 ? `−${formatNumber(n)}` : formatNumber(n));

/** Kelas warna untuk angka saldo: hijau kalau memegang uang toko, merah kalau memakainya. */
export const nadaSaldo = (nilai: number): string => {
  if (nilai > 0) return 'text-success';
  if (nilai < 0) return 'text-destructive';
  return '';
};

export type BarisOrang = {
  nama: string;
  jual: number;
  beli: number;
  beban: number;
  saldo: number;
  /** Kas yang mestinya ada di tangan orang ini — penjualan tunai dikurangi pengeluaran tunai. */
  kas: number;
  metode: BarisMetode[];
};

export type BarisMetode = {
  label: string;
  jual: number;
  beli: number;
  beban: number;
  saldo: number;
  /** Uang yang belum berpindah: piutang belum diterima, utang belum dibayar. */
  ket?: string;
};

/**
 * Susun satu baris per orang, beserta pecahannya menurut cara bayar.
 *
 * Piutang dan Utang sengaja jadi dua baris terpisah meski backend menjumlahkannya jadi satu
 * angka di `balance.payment_methods.debt` (piutang penjualan DIKURANGI utang pembelian).
 * Piutang adalah uang yang belum diterima dari customer, utang adalah uang yang belum
 * dibayar ke supplier — satu angka gabungan dari keduanya tidak menjawab pertanyaan apa pun,
 * jadi angka itu tidak dipakai di sini.
 */
export const susunBaris = (perUser: IncomeUserReportChild[]): BarisOrang[] =>
  perUser
    .map((u) => {
      const jualMetode = u.income?.payment_methods;
      const beliMetode = u.stock_in?.payment_methods;
      const bebanMetode = u.expense?.payment_methods;

      const metode: BarisMetode[] = [
        {
          label: 'Kas',
          jual: jualMetode?.cash ?? 0,
          beli: beliMetode?.cash ?? 0,
          beban: bebanMetode?.cash ?? 0,
          saldo: 0,
        },
        {
          label: 'Bank',
          jual: jualMetode?.bank ?? 0,
          beli: beliMetode?.bank ?? 0,
          beban: bebanMetode?.bank ?? 0,
          saldo: 0,
        },
        {
          label: 'Piutang',
          jual: jualMetode?.debt ?? 0,
          beli: 0,
          beban: 0,
          saldo: 0,
          ket: 'belum diterima',
        },
        {
          label: 'Giro',
          jual: jualMetode?.current_account ?? 0,
          beli: beliMetode?.current_account ?? 0,
          beban: 0,
          saldo: 0,
        },
        {
          label: 'Utang',
          jual: 0,
          beli: beliMetode?.debt ?? 0,
          beban: 0,
          saldo: 0,
          ket: 'belum dibayar',
        },
        // `payment_methods` di backend adalah pembayaran MENTAH, sementara kolom Pembelian
        // sudah bersih dari retur. Tanpa baris ini rincian tidak menjumlah pas ke barisnya —
        // selisihnya persis sebesar barang yang dikembalikan ke supplier.
        {
          label: 'Retur barang',
          jual: 0,
          beli: -(u.stock_in?.returns ?? 0),
          beban: 0,
          saldo: 0,
          ket: 'dikembalikan ke supplier',
        },
      ]
        .map((m) => ({ ...m, saldo: m.jual - m.beli - m.beban }))
        // Cara bayar yang tidak dipakai orang ini tidak ditampilkan: barisnya akan berbunyi
        // tiga kali "—" tanpa memberi tahu apa pun.
        .filter((m) => m.jual || m.beli || m.beban);

      const jual = u.income?.total_income ?? 0;
      const beli = u.stock_in?.total_purchase ?? 0;
      const beban = u.expense?.total_expense ?? 0;

      return {
        nama: u.name,
        jual,
        beli,
        beban,
        saldo: jual - beli - beban,
        kas: (jualMetode?.cash ?? 0) - (beliMetode?.cash ?? 0) - (bebanMetode?.cash ?? 0),
        metode,
      };
    })
    // Yang tidak punya aktivitas apa pun di rentang ini tidak perlu satu baris kosong.
    .filter((o) => o.jual || o.beli || o.beban)
    .sort((a, b) => b.jual - a.jual || b.beli - a.beli);

export const jumlahkan = (baris: BarisOrang[]) => ({
  jual: baris.reduce((t, o) => t + o.jual, 0),
  beli: baris.reduce((t, o) => t + o.beli, 0),
  beban: baris.reduce((t, o) => t + o.beban, 0),
  saldo: baris.reduce((t, o) => t + o.saldo, 0),
});
