import { AlertTriangle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { DialogDivider, DialogHeading, DialogRow } from '@/components/ui/dialog-summary';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEditAudit } from '@/hooks/mutation/useMutateAudit';
import { cn } from '@/lib/cn';
import { AuditsData } from '@/typings/audit';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

type BarisJurnal = { akun: string; tipe: 'debit' | 'kredit' };

/**
 * Ayat yang akan ditulis backend saat baris ini disetujui.
 *
 * Bukan tebakan: `ItemAuditController::createExpense` membuat beban bernama
 * "Beban Penyusutan Persediaan", dan `CreateLedgerJob::setExpenseLedger` mengkredit
 * PERSEDIAAN — bukan Kas — khusus untuk beban bernama itu. Arah sebaliknya ditulis
 * `createIncome`: D Persediaan / K Pendapatan Lain-Lain. Nilainya selalu
 * selisih × harga beli rata-rata barangnya.
 */
export const jurnalAudit = (beda: number): BarisJurnal[] => {
  if (beda < 0) {
    return [
      { akun: 'Beban Penyusutan Persediaan', tipe: 'debit' },
      { akun: 'Persediaan', tipe: 'kredit' },
    ];
  }
  if (beda > 0) {
    return [
      { akun: 'Persediaan', tipe: 'debit' },
      { akun: 'Pendapatan Lain-Lain', tipe: 'kredit' },
    ];
  }
  return [];
};

/**
 * Menyetujui hasil audit satu barang.
 *
 * Dialog lama hanya berisi satu kotak angka berjudul "Jumlah Audit Sebenarnya" —
 * tidak ada stok sistem, tidak ada selisih, dan tidak satu kata pun bahwa menekan
 * Simpan menggerakkan stok DAN menulis jurnal. Di sini ketiganya ada di layar yang
 * sama, dan angka yang diubah dari hitungan petugas diberi peringatan: angka inilah
 * yang dipakai, hitungan petugas ikut tertimpa.
 */
export function ApproveAuditDialog({
  row,
  isOpen,
  onClose,
  onApproved,
}: {
  row: AuditsData | null;
  isOpen: boolean;
  onClose: () => void;
  onApproved?: () => void;
}): JSX.Element {
  const { mutateAsync, isLoading } = useEditAudit(row?.id ?? '');
  const [jumlah, setJumlah] = useState('');

  const sistem = +(row?.item_quantity ?? 0);
  const hitungan = +(row?.audit_quantity ?? 0);
  const harga = +(row?.buy_price ?? 0);

  useEffect(() => {
    if (!isOpen) return;
    setJumlah(`${hitungan}`);
  }, [isOpen, row?.id, hitungan]);

  const angka = Number(jumlah);
  const sah = jumlah.trim() !== '' && Number.isFinite(angka) && angka >= 0;
  const beda = angka - sistem;
  const nilai = Math.abs(beda) * harga;
  const diubah = sah && angka !== hitungan;
  const ayat = jurnalAudit(beda);

  const setujui = async () => {
    if (!row || !sah) return;
    try {
      const res = await mutateAsync({ id: row.id, user_id: row.user_id, audit_quantity: angka, is_approved: true });
      toast.success(res.message);
      onApproved?.();
      onClose();
    } catch {
      // Pesannya sudah muncul sebagai toast di hook-nya.
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={isLoading ? undefined : onClose} bodyClassName="p-4">
      <div className="flex flex-col gap-2.5">
        <DialogHeading title="Setujui hasil audit?">
          Stok {row?.item_name ?? 'barang ini'} berubah dari{' '}
          <span className="font-mono font-semibold tabular-nums">{sistem}</span> menjadi{' '}
          <span className="font-mono font-semibold tabular-nums">{sah ? angka : hitungan}</span>, dan jurnal di bawah
          ditulis saat ini juga. Tidak ada cara membatalkannya.
        </DialogHeading>

        <div className="flex flex-col gap-1.25 rounded-lg bg-surface-raised px-3.25 py-2.5">
          <DialogRow label="Barang" value={row?.item_name ?? '—'} mono={false} />
          <DialogRow label="Stok menurut sistem" value={`${sistem} ${row?.item_unit ?? ''}`.trim()} mono={false} />
          <DialogRow label="Hasil hitung petugas" value={`${hitungan} ${row?.item_unit ?? ''}`.trim()} mono={false} />
          <DialogDivider />
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-foreground-muted">Selisih</span>
            <span
              className={cn(
                'font-mono text-sm font-semibold tabular-nums',
                beda < 0 && 'text-destructive',
                beda > 0 && 'text-info'
              )}
            >
              {beda > 0 ? '+' : ''}
              {beda} {row?.item_unit ?? ''}
            </span>
          </div>
        </div>

        <div>
          <Label htmlFor="jumlah" className="mb-1">
            Jumlah yang disetujui
          </Label>
          <Input
            id="jumlah"
            size="sm"
            type="number"
            min={0}
            inputMode="numeric"
            className="text-right font-mono tabular-nums"
            value={jumlah}
            disabled={isLoading}
            onChange={(e) => setJumlah(e.target.value)}
          />
          {diubah ? (
            <span className="mt-1 flex items-start gap-1.25 text-sm text-warning" role="alert">
              <AlertTriangle size={13} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                Diubah dari hitungan petugas (<span className="font-mono font-semibold tabular-nums">{hitungan}</span>).
                Angka ini yang dipakai menyesuaikan stok, dan hitungan petugas ikut tertimpa.
              </span>
            </span>
          ) : (
            <span className="mt-1 block text-xs text-foreground-subtle">
              Bawaannya hasil hitungan petugas. Ubah hanya kalau kamu menghitung ulang sendiri.
            </span>
          )}
        </div>

        {/* Pratinjau jurnal — sama bentuknya dengan pratinjau di Barang Masuk. */}
        <div className="rounded-lg bg-surface-raised px-3.25 py-2.5">
          <div className="mb-1 text-sm font-semibold">Jurnal yang ditulis</div>
          {ayat.length === 0 ? (
            <p className="text-xs text-foreground-subtle">
              Tidak ada jurnal: angkanya sama dengan stok sistem, jadi tidak ada yang perlu disesuaikan.
            </p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="pb-1 text-left text-xs font-bold text-foreground-subtle">Akun</th>
                  <th className="pb-1 text-right text-xs font-bold text-foreground-subtle">Debit</th>
                  <th className="pb-1 text-right text-xs font-bold text-foreground-subtle">Kredit</th>
                </tr>
              </thead>
              <tbody>
                {ayat.map(({ akun, tipe }) => (
                  <tr key={akun}>
                    <td className="py-0.75 text-sm">{akun}</td>
                    {/* Warnanya sama persis dengan Buku Besar: debit merah, kredit hijau,
                        sel kosong netral. Arah tiap baris terbaca sebelum angkanya. */}
                    <td
                      className={cn(
                        'py-0.75 text-right font-mono text-sm tabular-nums',
                        tipe === 'debit' ? 'font-semibold text-destructive' : 'text-foreground-subtle'
                      )}
                    >
                      {tipe === 'debit' ? formatNumber(nilai) : '—'}
                    </td>
                    <td
                      className={cn(
                        'py-0.75 text-right font-mono text-sm tabular-nums',
                        tipe === 'kredit' ? 'font-semibold text-success' : 'text-foreground-subtle'
                      )}
                    >
                      {tipe === 'kredit' ? formatNumber(nilai) : '—'}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-border">
                  <td className="pt-1.25 text-sm font-semibold">Balance</td>
                  <td className="pt-1.25 text-right font-mono text-sm font-bold tabular-nums text-destructive">
                    {formatNumber(nilai)}
                  </td>
                  <td className="pt-1.25 text-right font-mono text-sm font-bold tabular-nums text-success">
                    {formatNumber(nilai)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
          {harga <= 0 && ayat.length > 0 && (
            <p className="mt-1 text-xs text-warning">
              Harga beli barang ini kosong, jadi nilainya nol — jurnalnya tetap ditulis dengan angka nol.
            </p>
          )}
        </div>

        <div className="mt-1 flex justify-end">
          <Button className="mr-2" size="sm" variant="outline" disabled={isLoading} onClick={onClose}>
            Kembali
          </Button>
          <Button size="sm" loading={isLoading} disabled={!sah} onClick={setujui}>
            Setujui &amp; sesuaikan stok
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ApproveAuditDialog;
