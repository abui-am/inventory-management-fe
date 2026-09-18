import Modal from '@/components/Modal';
import { sumPayments } from '@/components/stock-in/StockInTable';
import { buildPurchaseJournal } from '@/components/transaction/JournalPreviewCard';
import { Button } from '@/components/ui/button';
import { DialogDivider, DialogHeading, DialogRow } from '@/components/ui/dialog-summary';
import { METHODS_ON_CREDIT } from '@/constants/options';
import { TransactionData } from '@/typings/stock-in';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/**
 * Konfirmasi kenaikan status Menunggu → Ditinjau.
 *
 * Di sinilah barang masuk berhenti menjadi catatan dan mulai menjadi angka: backend
 * menulis SELURUH jurnalnya saat status masuk Ditinjau — Persediaan, beban ongkir, dan
 * satu baris kredit per pembayaran — lalu membuat utang untuk bagian yang dibayar Utang
 * atau Giro. Stoknya sendiri belum bergerak; itu baru terjadi saat barangnya diterima.
 *
 * Dua akibat yang berbeda itu yang dulu berangkat dari satu klik ikon tanpa penjelasan
 * apa pun.
 */
export function ReviewStockInDialog({
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
  const payments = (transaction?.payments ?? []).map((p) => ({
    method: p.payment_method,
    amount: +(p.payment_price ?? 0),
  }));

  const total = sumPayments(transaction?.payments);
  const ongkir = +(transaction?.shipping_cost ?? 0);
  const jurnal = buildPurchaseJournal(payments, total, ongkir);

  const kredit = payments
    .filter(({ method }) => METHODS_ON_CREDIT.includes(method))
    .reduce((jumlah, { amount }) => jumlah + amount, 0);
  const utangBerjalan = +(transaction?.supplier?.total_receivable ?? 0);

  return (
    <Modal isOpen={isOpen} onRequestClose={saving ? undefined : onClose} bodyClassName="p-4">
      <div className="flex flex-col gap-2.5">
        <DialogHeading title="Konfirmasi barang masuk?">
          Jurnalnya ditulis sekarang juga. Stok belum bertambah — itu terjadi nanti saat barangnya diterima.
        </DialogHeading>

        <div className="flex flex-col gap-1.25 rounded-lg bg-surface-raised px-3.25 py-2.5">
          <DialogRow label="Kode" value={transaction?.transaction_code ?? '—'} />
          <DialogRow label="Supplier" value={transaction?.supplier?.name ?? '—'} mono={false} />
          <DialogRow label="Barang" value={`${transaction?.items?.length ?? 0}`} />
          <DialogDivider />
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold">Total</span>
            <span className="font-mono text-lg font-bold tabular-nums tracking-[-0.02em] text-accent">
              Rp {formatNumber(total)}
            </span>
          </div>
        </div>

        {/* Jurnal yang benar-benar akan ditulis, bukan kalimat yang menjanjikannya. */}
        {jurnal.length > 0 && (
          <div className="flex flex-col gap-1.25 rounded-lg bg-surface-raised px-3.25 py-2.5">
            <span className="text-xs font-bold text-foreground-subtle">Jurnal yang ditulis</span>
            {jurnal.map((b) => (
              <DialogRow
                key={`${b.type}-${b.account}`}
                label={`${b.type === 'D' ? 'Debit' : 'Kredit'} ${b.account}`}
                value={formatNumber(b.amount)}
              />
            ))}
          </div>
        )}

        {kredit > 0 && (
          <p className="rounded-lg bg-warning-subtle px-3.25 py-2 text-sm leading-[17px] text-warning">
            Utang ke {transaction?.supplier?.name ?? 'supplier'} bertambah{' '}
            <span className="font-mono font-semibold tabular-nums">{formatNumber(kredit)}</span> menjadi{' '}
            <span className="font-mono font-semibold tabular-nums">{formatNumber(utangBerjalan + kredit)}</span>, dan
            tagihannya mulai berjalan.
          </p>
        )}

        <div className="mt-1 flex justify-end">
          <Button className="mr-2" size="sm" variant="outline" disabled={saving} onClick={onClose}>
            Kembali
          </Button>
          <Button size="sm" loading={saving} onClick={onConfirm}>
            Ya, konfirmasi
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ReviewStockInDialog;
