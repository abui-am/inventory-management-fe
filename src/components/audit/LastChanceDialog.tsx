import { AlertTriangle } from 'lucide-react';
import React from 'react';

import { KESEMPATAN_MAKS } from '@/components/audit/audit-shared';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { DialogHeading, DialogRow } from '@/components/ui/dialog-summary';
import { AuditsData } from '@/typings/audit';

/**
 * Peringatan kesempatan terakhir.
 *
 * Muncul hanya di kiriman ke-3: setelah ini `ItemAuditPolicy::update` menolak
 * perubahan dari petugas gudang, dan barisnya benar-benar terkunci sampai pemilik
 * turun tangan di Laporan Audit.
 */
export function LastChanceDialog({
  row,
  nilai,
  isOpen,
  onClose,
  onConfirm,
  saving,
}: {
  row: AuditsData | null;
  nilai: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  saving: boolean;
}): JSX.Element {
  return (
    <Modal isOpen={isOpen} onRequestClose={saving ? undefined : onClose} bodyClassName="p-4">
      <div className="flex flex-col gap-2.5">
        <DialogHeading title="Kesempatan terakhir untuk barang ini">
          Setelah kiriman ini hitungannya terkunci untuk hari ini. Perbaikan hanya bisa dilakukan pemilik lewat Laporan
          Audit.
        </DialogHeading>

        <div className="flex flex-col gap-1.25 rounded-lg bg-surface-raised px-3.25 py-2.5">
          <DialogRow label="Barang" value={row?.item_name ?? '—'} mono={false} />
          <DialogRow label="Hitungan yang dikirim" value={`${nilai} ${row?.item_unit ?? ''}`.trim()} mono={false} />
          <DialogRow label="Kesempatan" value={`${KESEMPATAN_MAKS} dari ${KESEMPATAN_MAKS}`} />
        </div>

        <span className="flex items-start gap-1.25 text-sm text-warning" role="alert">
          <AlertTriangle size={13} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
          <span>Hitung ulang dulu kalau masih ragu — angka ini yang dipakai menyesuaikan stok.</span>
        </span>

        <div className="mt-1 flex justify-end">
          <Button className="mr-2" size="sm" variant="outline" disabled={saving} onClick={onClose}>
            Hitung ulang dulu
          </Button>
          <Button size="sm" loading={saving} onClick={onConfirm}>
            Kirim hitungan
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default LastChanceDialog;
