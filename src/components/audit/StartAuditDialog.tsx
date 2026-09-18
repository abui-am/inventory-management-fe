import dayjs from 'dayjs';
import { AlertTriangle } from 'lucide-react';
import React from 'react';

import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { DialogDivider, DialogHeading, DialogRow } from '@/components/ui/dialog-summary';

/**
 * Konfirmasi membuat audit satu hari.
 *
 * Dua kejadian, satu dialog, karena isinya sama kecuali akibatnya:
 * - `mulai` — tanggal itu belum punya audit sama sekali.
 * - `ulang` — tanggal itu sudah punya audit. `ItemAuditRepository::create` MENGHAPUS
 *   seluruh baris tanggal tersebut sebelum membuatnya lagi, jadi hitungan yang sudah
 *   dikirim hari itu ikut hilang. Sebelumnya tidak ada satu kalimat pun yang
 *   mengatakannya.
 */
export function StartAuditDialog({
  varian,
  tanggal,
  jumlahBarang,
  sudahDihitung,
  isOpen,
  onClose,
  onConfirm,
  saving,
}: {
  varian: 'mulai' | 'ulang';
  tanggal: Date;
  jumlahBarang?: number;
  sudahDihitung: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  saving: boolean;
}): JSX.Element {
  const ulang = varian === 'ulang';
  const hari = dayjs(tanggal).format('DD MMM YYYY');

  return (
    <Modal isOpen={isOpen} onRequestClose={saving ? undefined : onClose} bodyClassName="p-4">
      <div className="flex flex-col gap-2.5">
        <DialogHeading title={ulang ? `Buat ulang audit ${hari}?` : `Mulai audit ${hari}?`}>
          {ulang
            ? 'Seluruh baris audit tanggal ini dihapus lalu dibuat lagi dari stok sistem terbaru. Hitungan yang sudah dikirim hilang dan tidak bisa dikembalikan.'
            : 'Seluruh barang masuk daftar hitung sekarang, berikut stok sistemnya saat ini sebagai pembanding. Pastikan tidak ada barang masuk yang belum dicatat — barang yang masuk setelah ini tidak ikut terhitung.'}
        </DialogHeading>

        <div className="flex flex-col gap-1.25 rounded-lg bg-surface-raised px-3.25 py-2.5">
          <DialogRow label="Tanggal" value={hari} />
          <DialogRow
            label={ulang ? 'Barang yang dihitung ulang' : 'Barang yang dihitung'}
            value={`${jumlahBarang ?? 0}`}
          />
          {ulang && (
            <>
              <DialogDivider />
              <DialogRow label="Hitungan yang hilang" value={`${sudahDihitung}`} />
            </>
          )}
        </div>

        {ulang && sudahDihitung > 0 && (
          <span className="flex items-start gap-1.25 text-sm text-destructive" role="alert">
            <AlertTriangle size={13} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              <span className="font-mono font-semibold tabular-nums">{sudahDihitung}</span> barang sudah dihitung hari
              ini. Hitungannya kembali kosong dan petugas harus mengulang dari awal.
            </span>
          </span>
        )}

        <div className="mt-1 flex justify-end">
          <Button className="mr-2" size="sm" variant="outline" disabled={saving} onClick={onClose}>
            {ulang ? 'Kembali' : 'Batal'}
          </Button>
          <Button size="sm" variant={ulang ? 'destructive' : 'default'} loading={saving} onClick={onConfirm}>
            {ulang ? 'Ya, buat ulang' : 'Mulai audit'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default StartAuditDialog;
