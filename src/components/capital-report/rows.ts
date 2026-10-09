import { CapitalReportData } from '@/typings/capital-report';

export type AngkaModal = {
  modalAwal: number;
  modalDisetor: number;
  labaDitahan: number;
  /** Sudah bertanda negatif dari backend — uang toko yang dipakai pemilik. */
  prive: number;
  diambil: number;
};

const ambil = (rows: CapitalReportData[], title: CapitalReportData['title']): number =>
  +(rows.find((r) => r.title === title)?.amount ?? 0);

/**
 * Lima baris laporan perubahan modal, dibaca dari jawaban `POST /capital-report`.
 *
 * Backend mengirimnya sebagai daftar `{ title, amount }`, bukan objek berkunci, jadi
 * tiap layar sebelumnya mencari judulnya sendiri-sendiri dengan `find()` yang disalin
 * berulang. Dikumpulkan di sini supaya ejaan judulnya hanya ada di satu tempat.
 */
export function bacaAngka(rows: CapitalReportData[] = []): AngkaModal {
  return {
    modalAwal: ambil(rows, 'Modal Awal'),
    modalDisetor: ambil(rows, 'Modal Disetor'),
    labaDitahan: ambil(rows, 'Laba Ditahan'),
    prive: ambil(rows, 'Prive'),
    diambil: ambil(rows, 'Laba Diambil Owner'),
  };
}

/**
 * Modal akhir periode yang BELUM ditutup.
 *
 * Dihitung ulang tiap kali halaman dibuka dan belum ada di buku besar — ia baru ditulis
 * saat periodenya ditutup. Rumusnya dipertahankan persis seperti layar lama supaya
 * angkanya tidak berubah diam-diam: laba yang diambil pemilik mengurangi laba ditahan,
 * bukan menambah baris sendiri.
 */
export function modalAkhirBerjalan(a: AngkaModal, diambil = 0): number {
  return a.modalAwal + a.modalDisetor + a.labaDitahan + a.prive - diambil;
}

export const formatAngka = (n: number): string =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.abs(n));

/** Angka apa adanya, termasuk tanda minusnya. Modal akhir bisa negatif. */
export const formatUtuh = (n: number): string =>
  `${n < 0 ? '−' : ''}${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.abs(n))}`;

/**
 * Angka beserta tandanya, diturunkan dari nilainya — bukan dari baris mana ia berada.
 *
 * "Laba ditahan" bisa NEGATIF (periode yang rugi), dan Prive bisa 0. Menempelkan tanda
 * secara tetap per baris membuat kerugian 3.397.000 tampil sebagai "+3.397.000" dan prive
 * kosong tampil sebagai "−0" — dua angka yang salah baca, padahal totalnya benar.
 */
export function formatBertanda(n: number): string {
  if (n === 0) return '0';
  return `${n > 0 ? '+' : '−'}${formatAngka(n)}`;
}

/** Warna token untuk sebuah kontribusi: menambah modal hijau, mengurangi merah, nol netral. */
export function nadaKontribusi(n: number): string {
  if (n > 0) return 'text-success';
  if (n < 0) return 'text-destructive';
  return 'text-foreground-subtle';
}
