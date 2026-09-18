import { useEffect, useState } from 'react';

import { KESEMPATAN_MAKS, terkunci } from '@/components/audit/audit-shared';
import { useEditAudit } from '@/hooks/mutation/useMutateAudit';
import { AuditsData } from '@/typings/audit';

export type Konfirmasi = { row: AuditsData; nilai: number; kirim: () => Promise<void> };

/**
 * Satu kotak hitungan: isinya, aturan boleh-tidaknya dikirim, dan pengirimannya.
 *
 * Dipakai baris tabel DAN kartu layar sempit — keduanya harus tunduk pada aturan yang
 * sama, termasuk peringatan kesempatan terakhir. `useEditAudit` mengunci id-nya saat
 * hook dipanggil, jadi logikanya memang milik satu baris, bukan milik halaman.
 */
export function useHitungan(
  row: AuditsData,
  {
    onSelesai,
    onKonfirmasi,
  }: {
    onSelesai: (id: string) => void;
    onKonfirmasi: (konfirmasi: Konfirmasi) => void;
  }
): {
  nilai: string;
  setNilai: (nilai: string) => void;
  simpan: () => void;
  batal: () => void;
  bisaSimpan: boolean;
  terkunci: boolean;
  isLoading: boolean;
} {
  const { mutateAsync, isLoading } = useEditAudit(row.id);
  const awal = row.update_count > 0 ? `${row.audit_quantity}` : '';
  const [nilai, setNilai] = useState(awal);

  // Data baru dari server menang atas isian lama — misalnya setelah audit dibuat ulang,
  // atau setelah baris yang sama dikirim dari perangkat lain.
  useEffect(() => {
    setNilai(row.update_count > 0 ? `${row.audit_quantity}` : '');
  }, [row.id, row.update_count, row.audit_quantity]);

  const kunci = terkunci(row);
  const angka = Number(nilai);
  const sah = nilai.trim() !== '' && Number.isFinite(angka) && angka >= 0;
  // Mengirim angka yang sama persis hanya membuang satu kesempatan.
  const berubah = row.update_count === 0 || angka !== +row.audit_quantity;
  const bisaSimpan = sah && berubah && !kunci && !isLoading;

  const kirim = async () => {
    await mutateAsync({ audit_quantity: angka, user_id: row.user_id });
    onSelesai(row.id);
  };

  const simpan = () => {
    if (!bisaSimpan) return;
    if (row.update_count === KESEMPATAN_MAKS - 1) {
      onKonfirmasi({ row, nilai: angka, kirim });
      return;
    }
    kirim();
  };

  return { nilai, setNilai, simpan, batal: () => setNilai(awal), bisaSimpan, terkunci: kunci, isLoading };
}
