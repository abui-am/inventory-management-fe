import Modal from '@/components/Modal';
import { sumPayments } from '@/components/stock-in/StockInTable';
import { Button } from '@/components/ui/button';
import { DialogDivider, DialogHeading, DialogRow } from '@/components/ui/dialog-summary';
import { TransactionData } from '@/typings/stock-in';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/**
 * Konfirmasi pembatalan barang masuk.
 *
 * Membatalkan hanya mungkin selagi statusnya Menunggu, jadi tidak ada jurnal yang perlu
 * dibalik dan stok belum bergerak — beda dengan pembatalan penjualan, yang menulis ayat
 * koreksi. Yang perlu dikatakan justru sebaliknya: tidak ada yang bisa mengembalikannya.
 * `TransactionRepository::TRANSISI` tidak memberi status Dibatalkan satu pun tujuan.
 */
export function CancelStockInDialog({
  transaction,
  isOpen,
  onClose,
  onConfirm,
  saving,
}: {
  transaction: TransactionData | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  saving: boolean;
}): JSX.Element {
  return (
    <Modal isOpen={isOpen} onRequestClose={saving ? undefined : onClose} bodyClassName="p-4">
      <div className="flex flex-col gap-2.5">
        <DialogHeading title="Batalkan barang masuk?">
          Stok dan jurnal tidak tersentuh — barang masuk ini belum dikonfirmasi. Statusnya berubah menjadi Dibatalkan,
          dan tidak bisa dikembalikan.
        </DialogHeading>

        <div className="flex flex-col gap-1.25 rounded-lg bg-surface-raised px-3.25 py-2.5">
          <DialogRow label="Kode" value={transaction?.transaction_code ?? '—'} />
          <DialogRow label="Supplier" value={transaction?.supplier?.name ?? '—'} mono={false} />
          <DialogRow label="Barang" value={`${transaction?.items?.length ?? 0}`} />
          <DialogDivider />
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold">Total</span>
            <span className="font-mono text-lg font-bold tabular-nums tracking-[-0.02em] text-accent">
              Rp {formatNumber(sumPayments(transaction?.payments))}
            </span>
          </div>
        </div>

        <div className="mt-1 flex justify-end">
          <Button className="mr-2" size="sm" variant="outline" disabled={saving} onClick={onClose}>
            Kembali
          </Button>
          <Button size="sm" variant="destructive" loading={saving} onClick={onConfirm}>
            Ya, batalkan
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CancelStockInDialog;
