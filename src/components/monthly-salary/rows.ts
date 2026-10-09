import { Datum } from '@/typings/salary';

export type BarisGaji = {
  id: string;
  nama: string;
  jabatan: string;
  gaji: number;
  dibayar: number;
  sisa: number;
  /** Sebagian atau seluruhnya sudah dibayar lewat Gaji di Muka sebelum daftar ini dibuat. */
  diMuka: boolean;
  payroll: Datum;
};

/**
 * Bentuk baris tabel gaji.
 *
 * `paid_amount` dan `employee_salary` dikoersi di batas API: keduanya bisa datang sebagai
 * string dari PostgreSQL lewat Eloquent, dan `'2800000' - '1400000'` memang benar di
 * JavaScript sementara `'2800000' + 0` tidak — satu penjumlahan salah sudah cukup untuk
 * membuat seluruh kolom Sisa keliru.
 */
export function susunBaris(payrolls: Datum[]): BarisGaji[] {
  return payrolls.map((payroll) => {
    const gaji = +(payroll.employee_salary ?? 0);
    const dibayar = +(payroll.paid_amount ?? 0);

    return {
      id: payroll.id,
      nama: `${payroll.employee?.first_name ?? ''} ${payroll.employee?.last_name ?? ''}`.trim(),
      jabatan: payroll.employee_position ?? '',
      gaji,
      dibayar,
      // Dijepit di 0: backend menolak pembayaran yang melebihi gaji, tapi gaji yang
      // diturunkan setelah daftarnya dibuat bisa membuat selisihnya negatif.
      sisa: Math.max(gaji - dibayar, 0),
      diMuka: !!payroll.paid_in_advance,
      payroll,
    };
  });
}

export function jumlahkan(baris: BarisGaji[]): {
  gaji: number;
  dibayar: number;
  sisa: number;
  belumLunas: number;
  persen: number;
} {
  const gaji = baris.reduce((total, b) => total + b.gaji, 0);
  const dibayar = baris.reduce((total, b) => total + b.dibayar, 0);

  return {
    gaji,
    dibayar,
    sisa: baris.reduce((total, b) => total + b.sisa, 0),
    belumLunas: baris.filter((b) => b.sisa > 0).length,
    // 0 dari 0 adalah 0%, bukan NaN — dan NaN% sempat tampil di kartu sebelum data datang.
    persen: gaji > 0 ? Math.round((dibayar / gaji) * 100) : 0,
  };
}

export const formatAngka = (n: number): string =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);
