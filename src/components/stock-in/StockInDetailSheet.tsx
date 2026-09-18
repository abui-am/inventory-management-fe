import dayjs from 'dayjs';
import { ArrowRight, BookOpen, Check, Download, Info, Undo2, X } from 'lucide-react';
import React from 'react';

import { STATUS, StockInStatus, sumPayments } from '@/components/stock-in/StockInTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Sheet from '@/components/ui/sheet';
import { BarisNilai, ketBayar, PillMetode, Seksi } from '@/components/ui/sheet-section';
import { TransactionData } from '@/typings/stock-in';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/**
 * Rincian barang masuk sebagai sheet kanan, bukan modal di tengah.
 *
 * Barang masuk diperiksa berturut-turut — konfirmasi satu, lanjut ke berikutnya. Modal
 * menutup daftarnya, jadi tiap kali harus kembali dulu; sheet membiarkan antreannya
 * tetap terlihat di belakang.
 */
export function StockInDetailSheet({
  transaction,
  open,
  onClose,
  onClosed,
  onConfirm,
  onReceive,
  onCancel,
  onReturn,
  onOpenJournal,
  canConfirm,
  canAdjustPrice,
  canReturn,
}: {
  transaction: TransactionData;
  open: boolean;
  onClose: () => void;
  onClosed?: () => void;
  /** Menunggu → Ditinjau. Cukup mengirim statusnya. */
  onConfirm?: () => void;
  /**
   * Ditinjau → Diterima, lewat penetapan harga jual.
   *
   * Bukan sekadar mengirim status: backend menolak `accepted` tanpa `items[].sell_price`,
   * jadi langkah ini HARUS lewat layar harga jual yang mengirim keduanya sekaligus.
   */
  onReceive?: () => void;
  onCancel?: () => void;
  /** Retur sebagian/seluruh barang setelah barangnya diterima. */
  onReturn?: () => void;
  /** Hanya diberikan saat jurnalnya memang sudah ada (status ≥ Ditinjau). */
  onOpenJournal?: () => void;
  canConfirm: boolean;
  canAdjustPrice: boolean;
  canReturn: boolean;
}): JSX.Element {
  const status = (transaction.status ?? 'pending') as StockInStatus;
  const badge = STATUS[status] ?? STATUS.pending;

  const items = transaction.items ?? [];
  const subtotal = items.reduce((total, item) => total + +(item.pivot?.total_price ?? 0), 0);
  const ongkir = +(transaction.shipping_cost ?? 0);
  const total = sumPayments(transaction.payments);
  // Sisa = pembayaran yang belum ditandai lunas — utang dan giro yang jatuh temponya
  // belum tiba. Dihitung dari `paid`, bukan dari metodenya: giro yang sudah dicairkan
  // tetap giro.
  const sisa = (transaction.payments ?? []).reduce((n, p) => n + (p.paid ? 0 : +(p.payment_price ?? 0)), 0);

  const nama = `${transaction.pic?.employee?.first_name ?? ''} ${transaction.pic?.employee?.last_name ?? ''}`.trim();

  return (
    <Sheet
      open={open}
      onClose={onClose}
      onClosed={onClosed}
      width="w-[420px]"
      title={<span className="truncate font-mono text-lg font-semibold">{transaction.transaction_code}</span>}
      badge={<Badge variant={badge.variant}>{badge.label}</Badge>}
      subtitle={dayjs(transaction.created_at).format('DD MMM YYYY · HH:mm')}
      // SPEC-31: Download di kepala — ia tersedia pada SEMUA status, sementara pita di
      // bawahnya hanya berisi aksi yang mengubah status.
      actions={
        <Button size="icon-xs" variant="ghost" aria-label="Download" tooltip="Download">
          <Download strokeWidth={1.8} aria-hidden />
        </Button>
      }
      // SPEC-32/33: aksi mengikuti status — yang tidak mungkin dilakukan tidak
      // ditampilkan, bukan ditampilkan lalu dimatikan.
      toolbar={
        <>
          {/* Label tombolnya menyebut LANGKAH BERIKUTNYA, bukan kata umum "Konfirmasi":
              dari Menunggu ia menaikkan ke Ditinjau, dari Ditinjau ia menerima barangnya
              dan menambah stok. Dua akibat yang jauh berbeda tidak boleh satu nama —
              dan izinnya pun berbeda. */}
          {canConfirm && status === 'pending' && onConfirm && (
            <Button size="xs" onClick={onConfirm}>
              <Check strokeWidth={2.2} aria-hidden /> Konfirmasi
            </Button>
          )}
          {canAdjustPrice && status === 'on-review' && onReceive && (
            <Button size="xs" onClick={onReceive}>
              <Check strokeWidth={2.2} aria-hidden /> Terima barang
            </Button>
          )}
          {canReturn && status === 'accepted' && onReturn && (
            <Button size="xs" variant="outline" onClick={onReturn}>
              <Undo2 strokeWidth={1.9} aria-hidden /> Retur
            </Button>
          )}
          {canConfirm && status === 'pending' && onCancel && (
            <Button size="xs" variant="destructive-outline" onClick={onCancel}>
              <X strokeWidth={2} aria-hidden /> Batalkan
            </Button>
          )}
          <div className="flex-1" />
          {onOpenJournal ? (
            <Button size="xs" variant="outline" onClick={onOpenJournal}>
              <BookOpen strokeWidth={1.8} aria-hidden /> Ayat jurnal
            </Button>
          ) : (
            <span className="flex items-center gap-1.25 text-xs text-foreground-subtle">
              <Info size={12} strokeWidth={1.9} aria-hidden />
              Jurnal belum ditulis
            </span>
          )}
        </>
      }
      // SPEC-40
      footer={
        <div className="flex flex-shrink-0 items-center justify-between border-t border-border bg-surface-raised px-4 py-2 text-xs text-foreground-subtle">
          <span>Tanggal masuk</span>
          <span className="font-mono">{dayjs(transaction.purchase_date).format('DD/MM/YYYY')}</span>
        </div>
      }
    >
      {/* SPEC-34/35 */}
      <div className="border-b border-border-subtle px-4 py-3.25">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-xl font-bold tracking-[-0.02em] text-accent">Rp {formatNumber(total)}</span>
          {sisa <= 0 ? (
            <Badge variant="success">Lunas</Badge>
          ) : (
            <Badge variant="warning">
              Sisa <span className="font-mono font-semibold tabular-nums">{formatNumber(sisa)}</span>
            </Badge>
          )}
        </div>
        <div className="mt-px flex flex-col gap-0.75">
          <BarisNilai label="Subtotal" value={formatNumber(subtotal)} />
          <BarisNilai label="Ongkos kirim" value={formatNumber(ongkir)} />
        </div>
      </div>

      {/* SPEC-37 */}
      <Seksi title="Pembayaran ke supplier">
        <div className="flex flex-col gap-1.75">
          {(transaction.payments ?? []).map((p, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={`${p.payment_method}-${i}`} className="flex items-center gap-2">
              <PillMetode metode={p.payment_method} />
              <span className="min-w-0 flex-1 truncate text-xs text-foreground-subtle">{ketBayar(p)}</span>
              <span className="shrink-0 font-mono text-base font-semibold tabular-nums">
                {formatNumber(p.payment_price ?? 0)}
              </span>
            </div>
          ))}
        </div>
      </Seksi>

      {/* SPEC-38: efek stoknya ikut ditulis — itu yang diperiksa saat mengonfirmasi,
            dan justru itu yang tidak ada di modal lama. */}
      <Seksi title="Barang" count={items.length}>
        <div className="flex flex-col gap-2.25">
          {items.map((item) => {
            const qty = +(item.pivot?.quantity ?? 0);
            const stok = Number(item.quantity ?? 0);

            return (
              <div key={item.id} className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-medium">{item.pivot?.item_name ?? item.name}</div>
                  <div className="mt-px font-mono text-xs text-foreground-subtle">
                    {qty} {item.pivot?.item_unit ?? item.unit} × {formatNumber(item.pivot?.purchase_price ?? 0)}
                  </div>
                  {/* Stok yang tampil adalah posisi SEKARANG. Sebelum status Diterima,
                        angka kedua adalah perkiraan setelah barang ini masuk. */}
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-foreground-subtle">
                    Stok
                    <span className="font-mono">{stok}</span>
                    {status !== 'accepted' && (
                      <>
                        <ArrowRight size={11} strokeWidth={2} aria-hidden />
                        <span className="font-mono font-semibold text-foreground-muted">{stok + qty}</span>
                      </>
                    )}
                  </div>
                  {item.pivot?.note ? (
                    <div className="mt-0.5 text-xs text-foreground-muted">{item.pivot.note}</div>
                  ) : null}
                </div>
                <span className="whitespace-nowrap font-mono text-base font-semibold tabular-nums">
                  {formatNumber(item.pivot?.total_price ?? 0)}
                </span>
              </div>
            );
          })}
        </div>
      </Seksi>

      {/* Riwayat retur — hanya muncul kalau memang pernah ada. Ditempatkan tepat di
          bawah daftar barang: yang dibaca berurutan adalah "yang datang" lalu "yang
          dikembalikan lagi". */}
      {(transaction.returns ?? []).length > 0 && (
        <Seksi title="Retur" count={(transaction.returns ?? []).length}>
          <div className="flex flex-col gap-2.25">
            {(transaction.returns ?? []).map((retur) => (
              <div key={retur.id} className="flex flex-col gap-0.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-xs text-foreground-subtle">
                    {dayjs(retur.returned_at).format('DD MMM YYYY · HH:mm')}
                  </span>
                  <span className="whitespace-nowrap font-mono text-base font-semibold tabular-nums text-warning">
                    −{formatNumber(retur.total_price ?? 0)}
                  </span>
                </div>
                <div className="text-sm text-foreground-muted">
                  {(retur.items ?? [])
                    .map((baris) => `${baris.item_name} ${baris.quantity} ${baris.item_unit ?? ''}`.trim())
                    .join(' · ')}
                </div>
                <div className="text-xs text-foreground-subtle">{retur.reason}</div>
              </div>
            ))}
          </div>
        </Seksi>
      )}

      {/* SPEC-39 */}
      <Seksi title="Keterangan">
        <div className="flex flex-col gap-0.75">
          <BarisNilai label="Supplier" value={transaction.supplier?.name ?? '—'} />
          <BarisNilai label="Kasir" value={nama || '—'} />
          <BarisNilai label="Nomor faktur" value={transaction.invoice_number || '—'} />
        </div>
      </Seksi>

      {transaction.note ? (
        <Seksi title="Catatan">
          <p className="text-base text-foreground-muted">{transaction.note}</p>
        </Seksi>
      ) : null}
    </Sheet>
  );
}

export default StockInDetailSheet;
