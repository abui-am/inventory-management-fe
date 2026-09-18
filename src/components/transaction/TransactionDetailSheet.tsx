import dayjs from 'dayjs';
import { Copy, Download } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Sheet from '@/components/ui/sheet';
import { BarisNilai, ketBayar, PillMetode, Seksi } from '@/components/ui/sheet-section';
import { SaleTransactionsData } from '@/typings/sale';
import { downloadInvoice } from '@/utils/invoice';
import reportError from '@/utils/reportError';

type Payment = { payment_method?: string; payment_price?: number; due_date?: string };

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

const STATUS = {
  pending: { label: 'Menunggu', variant: 'warning' },
  'on-review': { label: 'Ditinjau', variant: 'info' },
  accepted: { label: 'Diterima', variant: 'success' },
  // "Dibatalkan", bukan "Ditolak": pada PENJUALAN status ini hanya lahir dari pembatalan
  // (PATCH /transactions/{id}/void). Barang masuk masih memakai kata "Ditolak" di
  // TableComponent, karena di sana `declined` memang berarti ditolak saat konfirmasi.
  declined: { label: 'Dibatalkan', variant: 'destructive' },
} as const;

export function TransactionDetailSheet({
  transaction,
  open,
  onClose,
  onClosed,
}: {
  transaction: SaleTransactionsData;
  open: boolean;
  /** Dipanggil saat pengguna menutup — sheet mulai menggeser keluar. */
  onClose: () => void;
  /** Dipanggil setelah animasi keluar selesai; di sinilah datanya baru boleh dibuang. */
  onClosed?: () => void;
}): JSX.Element {
  const [action, setAksi] = useState<'print' | 'download' | null>(null);

  const items = transaction.items ?? [];
  const payments: Payment[] = transaction.payments ?? [];
  const subtotal = items.reduce((a, i) => a + (i.pivot?.total_price ?? 0), 0);
  const diskon = +(transaction.discount ?? 0);
  const ongkir = +(transaction.shipping_cost ?? 0);
  const total = subtotal - diskon + ongkir;
  const dibayar = payments.reduce((a, p) => a + (p.payment_price ?? 0), 0);
  const sisa = total - dibayar;

  const badge = STATUS[(transaction.status ?? 'accepted') as keyof typeof STATUS] ?? STATUS.accepted;

  // Faktur dibangkitkan di browser dari transaksi yang sudah ada di tangan — tanpa
  // permintaan jaringan, dan isinya teks sungguhan yang bisa diseleksi.
  const run = async () => {
    setAksi('download');
    try {
      await downloadInvoice(transaction, `${transaction.transaction_code}.pdf`);
    } catch (e) {
      reportError(e, { action: 'download-faktur' });
      toast.error('Faktur gagal dibuat');
    } finally {
      setAksi(null);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(transaction.transaction_code);
      toast.success('Kode disalin');
    } catch {
      toast.error('Gagal menyalin kode');
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      onClosed={onClosed}
      width="w-[420px]"
      title={<span className="truncate font-mono text-lg font-semibold">{transaction.transaction_code}</span>}
      badge={<Badge variant={badge.variant}>{badge.label}</Badge>}
      subtitle={dayjs(transaction.created_at).format('DD MMM YYYY · HH:mm')}
      // Download dan Copy tersedia pada SEMUA keadaan, jadi tempatnya di kepala —
      // sama dengan sheet barang masuk. Pita aksi di bawah kepala khusus aksi yang
      // mengubah keadaan, dan penjualan tidak punya satu pun.
      actions={
        <>
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Download faktur"
            tooltip="Download"
            loading={action === 'download'}
            onClick={run}
          >
            <Download strokeWidth={1.8} aria-hidden />
          </Button>
          <Button size="icon-xs" variant="ghost" aria-label="Copy kode transaksi" tooltip="Copy" onClick={copy}>
            <Copy strokeWidth={1.7} aria-hidden />
          </Button>
        </>
      }
      footer={
        <div className="flex flex-shrink-0 items-center justify-between border-t border-border bg-surface-raised px-4 py-2 text-xs text-foreground-subtle">
          <span>Nomor faktur</span>
          <span className="font-mono">{transaction.invoice_number}</span>
        </div>
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
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
            <BarisNilai label="Diskon" value={diskon ? `−${formatNumber(diskon)}` : '0'} />
            <BarisNilai label="Ongkos kirim" value={formatNumber(ongkir)} />
          </div>
        </div>

        <Seksi title="Pembayaran">
          <div className="flex flex-col gap-1.75">
            {payments.map((p, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={i} className="flex items-center gap-2">
                <PillMetode metode={p.payment_method ?? ''} />
                <span className="min-w-0 flex-1 truncate text-xs text-foreground-subtle">{ketBayar(p)}</span>
                <span className="shrink-0 font-mono text-base font-semibold tabular-nums">
                  {formatNumber(p.payment_price ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </Seksi>

        <Seksi title="Barang" count={items.length}>
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-medium">{item.name}</div>
                  <div className="mt-px font-mono text-xs text-foreground-subtle">
                    {item.pivot.quantity} {item.unit} × {formatNumber(item.pivot.purchase_price ?? 0)}
                  </div>
                </div>
                <span className="whitespace-nowrap font-mono text-base font-semibold tabular-nums">
                  {formatNumber(item.pivot.total_price)}
                </span>
              </div>
            ))}
          </div>
        </Seksi>

        <Seksi title="Keterangan">
          <div className="flex flex-col gap-1">
            <BarisNilai label="Customer" value={transaction.customer?.full_name ?? 'Umum'} />
            <BarisNilai
              label="Kasir"
              value={`${transaction.pic?.employee?.first_name ?? ''} ${
                transaction.pic?.employee?.last_name ?? ''
              }`.trim()}
            />
            <BarisNilai
              label="Pengirim"
              value={`${transaction.sender?.first_name ?? ''} ${transaction.sender?.last_name ?? ''}`.trim()}
            />
          </div>
        </Seksi>

        {/* Alasan pembatalan berdiri sendiri di atas catatan: ia menjelaskan kenapa
            angka-angka di atasnya sudah tidak berlaku, jadi harus terbaca lebih dulu. */}
        {transaction.void_reason ? (
          <Seksi title="Alasan pembatalan">
            <p className="rounded-lg bg-destructive-subtle px-3 py-2 text-base text-destructive">
              {transaction.void_reason}
            </p>
            {transaction.voided_at ? (
              <p className="mt-1 text-xs text-foreground-subtle">
                Dibatalkan {dayjs(transaction.voided_at).format('DD MMM YYYY · HH:mm')}
              </p>
            ) : null}
          </Seksi>
        ) : null}

        {transaction.note ? (
          <Seksi title="Catatan">
            <p className="text-base text-foreground-muted">{transaction.note}</p>
          </Seksi>
        ) : null}
      </div>

      <div className="flex flex-shrink-0 items-center justify-between border-t border-border bg-surface-raised px-4 py-2 text-xs text-foreground-subtle">
        <span>Nomor faktur</span>
        <span className="font-mono">{transaction.invoice_number}</span>
      </div>
    </Sheet>
  );
}

export default TransactionDetailSheet;
