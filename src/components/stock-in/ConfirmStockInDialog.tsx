import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { DialogDivider, DialogHeading, DialogRow } from '@/components/ui/dialog-summary';
import { formatPaymentMethod } from '@/utils/format';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/**
 * Konfirmasi sebelum barang masuk disimpan.
 *
 * Isinya kebalikan dari konfirmasi penjualan, dan justru itu yang perlu dikatakan:
 * menyimpan barang masuk BELUM menyentuh stok maupun jurnal — keduanya baru berjalan
 * saat statusnya dinaikkan. Satu hal yang memang langsung terjadi dan tidak bisa
 * ditarik kembali adalah barang baru: ia dibuat di master sebelum transaksinya dikirim,
 * dan tetap ada di sana walau barang masuknya kemudian dibatalkan.
 */
export function ConfirmStockInDialog({
  isOpen,
  onClose,
  onConfirm,
  saving,
  supplier,
  itemCount,
  newItemCount,
  amountByMethod,
  total,
  currentDebt,
  creditThisTransaction,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  saving: boolean;
  supplier?: string;
  itemCount: number;
  /** Barang yang belum terdaftar dan akan dibuat lebih dulu. */
  newItemCount: number;
  amountByMethod: { method: string; amount: number }[];
  total: number;
  currentDebt: number;
  creditThisTransaction: number;
}): JSX.Element {
  return (
    <Modal isOpen={isOpen} onRequestClose={saving ? undefined : onClose} bodyClassName="p-4">
      <div className="flex flex-col gap-2.5">
        <DialogHeading title="Simpan sebagai Menunggu?">
          Stok dan jurnal belum berubah. Keduanya berjalan setelah barang masuk ini dikonfirmasi.
        </DialogHeading>

        <div className="flex flex-col gap-1.25 rounded-lg bg-surface-raised px-3.25 py-2.5">
          <DialogRow label="Supplier" value={supplier ?? '—'} mono={false} />
          <DialogRow label="Barang" value={`${itemCount}`} />
          <DialogDivider />
          {amountByMethod.map(({ method, amount }) => (
            <DialogRow key={method} label={formatPaymentMethod(method)} value={formatNumber(amount)} />
          ))}
          <DialogDivider />
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold">Total</span>
            <span className="font-mono text-lg font-bold tabular-nums tracking-[-0.02em] text-accent">
              Rp {formatNumber(total)}
            </span>
          </div>
        </div>

        {/* Satu-satunya akibat yang langsung permanen di layar ini. */}
        {newItemCount > 0 && (
          <p className="rounded-lg bg-info-subtle px-3.25 py-2 text-sm leading-[17px] text-info">
            <span className="font-mono font-semibold tabular-nums">{newItemCount}</span> barang baru akan dibuat di
            master barang, dan tetap ada walau barang masuk ini dibatalkan.
          </p>
        )}

        {creditThisTransaction > 0 && (
          <p className="rounded-lg bg-warning-subtle px-3.25 py-2 text-sm leading-[17px] text-warning">
            Setelah dikonfirmasi, utang ke {supplier ?? 'supplier'} bertambah{' '}
            <span className="font-mono font-semibold tabular-nums">{formatNumber(creditThisTransaction)}</span> menjadi{' '}
            <span className="font-mono font-semibold tabular-nums">
              {formatNumber(currentDebt + creditThisTransaction)}
            </span>
            .
          </p>
        )}

        <div className="mt-1 flex justify-end">
          <Button className="mr-2" size="sm" variant="outline" disabled={saving} onClick={onClose}>
            Batal
          </Button>
          <Button size="sm" loading={saving} onClick={onConfirm}>
            Ya, simpan
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmStockInDialog;
