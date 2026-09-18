import { useEffect, useState } from 'react';

import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { DialogDivider, DialogHeading, DialogRow } from '@/components/ui/dialog-summary';
import { Textarea } from '@/components/ui/textarea';
import { useVoidSale } from '@/hooks/mutation/useMutateSale';
import { SaleTransactionsData } from '@/typings/sale';
import { formatNumber } from '@/utils/format';

/** Jumlah yang dibayarkan, sama seperti kolom Jumlah di daftar transaksi. */
const sumPayments = (payments?: SaleTransactionsData['payments']): number =>
  (payments ?? []).reduce((total, payment) => total + +(payment?.payment_price ?? 0), 0);

/**
 * Konfirmasi pembatalan transaksi penjualan.
 *
 * Alasannya wajib: enam bulan lagi baris jurnal pembaliknya masih ada, dan tanpa alasan
 * tidak ada yang bisa menjelaskan kenapa ia ditulis. Tombolnya tetap mati sampai
 * alasannya diisi — bukan diisi lalu ditolak backend.
 */
export function VoidTransactionDialog({
  isOpen,
  onClose,
  transaction,
}: {
  isOpen: boolean;
  onClose: () => void;
  transaction: SaleTransactionsData | null;
}): JSX.Element {
  const [reason, setReason] = useState('');
  const { mutateAsync, isLoading } = useVoidSale();

  // Alasan transaksi sebelumnya tidak boleh terbawa ke dialog berikutnya.
  useEffect(() => {
    if (isOpen) setReason('');
  }, [isOpen]);

  const submit = async () => {
    if (!transaction || !reason.trim()) return;
    try {
      await mutateAsync({ transactionId: transaction.id, reason: reason.trim() });
      onClose();
    } catch {
      // Pesannya sudah muncul sebagai toast di hook-nya.
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={isLoading ? undefined : onClose} bodyClassName="p-4">
      <div className="flex flex-col gap-2.5">
        <DialogHeading title="Batalkan transaksi?">
          Transaksinya tidak dihapus. Jurnalnya dibalik, stok barang dikembalikan, dan piutangnya dihapus.
        </DialogHeading>

        <div className="flex flex-col gap-1.25 rounded-lg bg-surface-raised px-3.25 py-2.5">
          <DialogRow label="Kode" value={transaction?.transaction_code ?? '—'} />
          <DialogRow label="Customer" value={transaction?.customer?.full_name ?? 'Umum'} mono={false} />
          <DialogRow label="Barang" value={`${transaction?.items?.length ?? 0}`} />
          <DialogDivider />
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold">Total</span>
            <span className="font-mono text-lg font-bold tabular-nums tracking-[-0.02em] text-accent">
              Rp {formatNumber(sumPayments(transaction?.payments))}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="void-reason" className="mb-1 block text-sm font-medium">
            Alasan pembatalan
          </label>
          <Textarea
            id="void-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Mis. salah input barang"
          />
        </div>

        <div className="mt-1 flex justify-end">
          <Button className="mr-2" size="sm" variant="outline" disabled={isLoading} onClick={onClose}>
            Batal
          </Button>
          <Button size="sm" variant="destructive" loading={isLoading} disabled={!reason.trim()} onClick={submit}>
            Ya, batalkan
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default VoidTransactionDialog;
