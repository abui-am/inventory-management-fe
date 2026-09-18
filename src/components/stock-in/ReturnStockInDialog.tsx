import { Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import Modal from '@/components/Modal';
import { sumPayments } from '@/components/stock-in/StockInTable';
import { buildReturnJournal } from '@/components/transaction/JournalPreviewCard';
import { Button } from '@/components/ui/button';
import { DialogDivider, DialogHeading, DialogRow } from '@/components/ui/dialog-summary';
import { Textarea } from '@/components/ui/textarea';
import { useReturnStockIn } from '@/hooks/mutation/useMutateStockIn';
import { cn } from '@/lib/cn';
import { TransactionData } from '@/typings/stock-in';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/** Jumlah yang sudah pernah diretur, per barang. */
const returnedByItem = (transaction: TransactionData | null): Record<string, number> => {
  const total: Record<string, number> = {};
  (transaction?.returns ?? []).forEach((retur) => {
    (retur.items ?? []).forEach((baris) => {
      total[baris.item_id] = (total[baris.item_id] ?? 0) + +(baris.quantity ?? 0);
    });
  });
  return total;
};

/**
 * Retur barang masuk.
 *
 * Bukan pembatalan: barangnya benar-benar pernah diterima, jadi statusnya tidak berubah
 * dan riwayat barang masuknya tetap utuh. Yang tertulis adalah peristiwa baru — stok
 * berkurang, dan jurnalnya berjalan berlawanan arah sebesar nilai yang dikembalikan.
 *
 * Alasannya wajib, sama seperti pembatalan penjualan: enam bulan lagi baris jurnalnya
 * masih ada, dan tanpa alasan tidak ada yang bisa menjelaskan kenapa ia ditulis.
 */
export function ReturnStockInDialog({
  transaction,
  isOpen,
  onClose,
}: {
  transaction: TransactionData | null;
  isOpen: boolean;
  onClose: () => void;
}): JSX.Element {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const { mutateAsync, isLoading } = useReturnStockIn();

  // Isian retur sebelumnya tidak boleh terbawa ke dialog berikutnya.
  useEffect(() => {
    if (isOpen) {
      setQty({});
      setReason('');
    }
  }, [isOpen, transaction?.id]);

  const sudah = useMemo(() => returnedByItem(transaction), [transaction]);

  /** Barang yang masih mungkin diretur, beserta batas atasnya. */
  const baris = (transaction?.items ?? []).map((item) => {
    const diterima = +(item.pivot?.quantity ?? 0);
    const diretur = sudah[item.id] ?? 0;
    const stok = +(item.quantity ?? 0);
    // Dua batas sekaligus: tidak boleh lebih dari yang pernah datang, dan tidak boleh
    // lebih dari yang masih ada di gudang — barang yang sudah terjual tidak bisa
    // dikembalikan ke supplier.
    const maks = Math.max(Math.min(diterima - diretur, stok), 0);

    return {
      id: item.id,
      nama: item.pivot?.item_name ?? item.name,
      satuan: item.pivot?.item_unit ?? item.unit,
      harga: +(item.pivot?.purchase_price ?? 0),
      diterima,
      diretur,
      stok,
      maks,
    };
  });

  const dipilih = baris.filter((b) => (qty[b.id] ?? 0) > 0);
  const totalRetur = dipilih.reduce((total, b) => total + b.harga * (qty[b.id] ?? 0), 0);

  const ubah = (id: string, nilai: number, maks: number) =>
    setQty((lama) => ({ ...lama, [id]: Math.min(Math.max(nilai, 0), maks) }));

  // Jurnal yang AKAN ditulis backend, disusun dari pembayaran transaksi ini.
  const jurnal = buildReturnJournal(
    (transaction?.payments ?? []).map((p) => ({
      method: p.payment_method,
      amount: +(p.payment_price ?? 0),
    })),
    sumPayments(transaction?.payments),
    totalRetur
  );

  const bisaSimpan = dipilih.length > 0 && !!reason.trim();

  const submit = async () => {
    if (!transaction || !bisaSimpan) return;
    try {
      await mutateAsync({
        transactionId: transaction.id,
        reason: reason.trim(),
        items: dipilih.map((b) => ({ id: b.id, quantity: qty[b.id] })),
      });
      onClose();
    } catch {
      // Pesannya sudah muncul sebagai toast di hook-nya.
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={isLoading ? undefined : onClose} bodyClassName="p-4">
      <div className="flex flex-col gap-2.5">
        <DialogHeading title="Retur barang masuk">
          Stok berkurang dan jurnalnya ditulis seketika. Status barang masuk tetap Diterima — barangnya memang pernah
          datang.
        </DialogHeading>

        <div className="flex flex-col gap-1.25 rounded-lg bg-surface-raised px-3.25 py-2.5">
          <DialogRow label="Kode" value={transaction?.transaction_code ?? '—'} />
          <DialogRow label="Supplier" value={transaction?.supplier?.name ?? '—'} mono={false} />
        </div>

        {/* Satu baris per barang: jumlah retur diketik di sebelah jumlah yang pernah
            datang, supaya batasnya terbaca tanpa harus menebak. */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Barang yang dikembalikan</span>

          {baris.map((b) => {
            const nilai = qty[b.id] ?? 0;
            const habis = b.maks === 0;

            return (
              <div
                key={b.id}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg border border-border px-2.75 py-2',
                  nilai > 0 && 'border-accent bg-accent-subtle',
                  habis && 'opacity-55'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-medium">{b.nama}</div>
                  <div className="mt-px text-xs text-foreground-subtle">
                    Diterima <span className="font-mono tabular-nums">{b.diterima}</span> {b.satuan}
                    {b.diretur > 0 && (
                      <>
                        {' · sudah diretur '}
                        <span className="font-mono tabular-nums">{b.diretur}</span>
                      </>
                    )}
                    {' · stok '}
                    <span className="font-mono tabular-nums">{b.stok}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center overflow-hidden rounded-control border border-border-strong focus-within:border-accent focus-within:ring-2 focus-within:ring-ring/25">
                  <button
                    type="button"
                    aria-label={`Kurangi retur ${b.nama}`}
                    disabled={habis || nilai <= 0}
                    onClick={() => ubah(b.id, nilai - 1, b.maks)}
                    className="flex size-7 items-center justify-center text-foreground-subtle transition-colors duration-fast hover:bg-surface-raised hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Minus size={14} strokeWidth={2} aria-hidden />
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={b.maks}
                    aria-label={`Jumlah retur ${b.nama}`}
                    disabled={habis}
                    value={nilai === 0 ? '' : nilai}
                    placeholder="0"
                    onChange={(e) => ubah(b.id, e.target.value === '' ? 0 : +e.target.value, b.maks)}
                    className="h-7 w-12 border-0 bg-transparent text-center font-mono text-base font-medium tabular-nums text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    aria-label={`Tambah retur ${b.nama}`}
                    disabled={habis || nilai >= b.maks}
                    onClick={() => ubah(b.id, nilai + 1, b.maks)}
                    className="flex size-7 items-center justify-center text-foreground-subtle transition-colors duration-fast hover:bg-surface-raised hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Plus size={14} strokeWidth={2} aria-hidden />
                  </button>
                </div>

                <span className="w-[88px] shrink-0 text-right font-mono text-base font-semibold tabular-nums">
                  {formatNumber(b.harga * nilai)}
                </span>
              </div>
            );
          })}
        </div>

        <div>
          <label htmlFor="return-reason" className="mb-1 block text-sm font-medium">
            Alasan retur
          </label>
          <Textarea
            id="return-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Mis. 3 karung sobek dan basah"
          />
        </div>

        <div className="flex flex-col gap-1.25 rounded-lg bg-surface-raised px-3.25 py-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold">Nilai retur</span>
            <span className="font-mono text-lg font-bold tabular-nums tracking-[-0.02em] text-accent">
              Rp {formatNumber(totalRetur)}
            </span>
          </div>

          {jurnal.length > 0 && (
            <>
              <DialogDivider />
              {jurnal.map((b) => (
                <DialogRow
                  key={`${b.type}-${b.account}`}
                  label={`${b.type === 'D' ? 'Debit' : 'Kredit'} ${b.account}`}
                  value={formatNumber(b.amount)}
                />
              ))}
            </>
          )}
        </div>

        {/* Ongkos kirim sengaja tidak ikut: ongkirnya sudah benar-benar dikeluarkan, dan
            mengirim barang balik tidak mengembalikan ongkos yang sudah terpakai. */}
        <p className="text-2xs leading-[15px] text-foreground-subtle">
          Ongkos kirim tidak ikut diretur. Bagian yang dibayar Utang atau Giro memotong tagihan yang belum dibayar;
          bagian yang sudah lunas dicatat sebagai pengembalian ke Kas.
        </p>

        <div className="mt-1 flex justify-end">
          <Button className="mr-2" size="sm" variant="outline" disabled={isLoading} onClick={onClose}>
            Kembali
          </Button>
          <Button size="sm" variant="destructive" loading={isLoading} disabled={!bisaSimpan} onClick={submit}>
            Simpan retur
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ReturnStockInDialog;
