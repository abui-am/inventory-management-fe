import dayjs from 'dayjs';
import { Copy, Download, Printer, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ReactModal from 'react-modal';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import useFetchInvoice from '@/hooks/query/useFetchInvoice';
import { cn } from '@/lib/cn';
import { SaleTransactionsData } from '@/typings/sale';
import downloadInvoice from '@/utils/downloadInvoice';
import { formatPaymentMethod } from '@/utils/format';
import printInvoice from '@/utils/printInvoice';

type Payment = { payment_method?: string; payment_price?: number; due_date?: string };

const angka = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

const STATUS = {
  pending: { label: 'Menunggu', variant: 'warning' },
  'on-review': { label: 'Ditinjau', variant: 'info' },
  accepted: { label: 'Diterima', variant: 'success' },
  declined: { label: 'Ditolak', variant: 'destructive' },
} as const;

/**
 * Satu warna per metode bayar, dipakai sebagai titik kecil — bukan latar. Kalau
 * latarnya yang diwarnai, satu daftar dengan beberapa pembayaran berubah jadi papan
 * warna dan justru tidak ada yang menonjol.
 */
const WARNA_METODE: Record<string, string> = {
  Kas: 'bg-success',
  Bank: 'bg-info',
  Utang: 'bg-warning',
  Giro: 'bg-accent',
  Piutang: 'bg-accent',
};

// Judul seksi, bukan eyebrow: label dan title memakai Kapital di awal saja.
// Lihat aturan wording di CLAUDE.md.
function JudulSeksi({ children }: { children: React.ReactNode }) {
  return <div className="text-base font-semibold">{children}</div>;
}

function Section({
  title,
  children,
  first,
  tinted,
}: {
  title: string;
  children: React.ReactNode;
  first?: boolean;
  tinted?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 px-4 py-2.5',
        !first && 'border-t border-border',
        tinted && 'bg-accent-subtle'
      )}
    >
      <JudulSeksi>{title}</JudulSeksi>
      {children}
    </div>
  );
}

function Baris({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span className="text-foreground-muted">{label}</span>
      <span className="font-mono font-medium tabular-nums">{value}</span>
    </div>
  );
}

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
  const [aksi, setAksi] = useState<'print' | 'download' | null>(null);
  const { refetch } = useFetchInvoice(transaction.id, { enabled: false });

  const items = transaction.items ?? [];
  const payments: Payment[] = transaction.payments ?? [];
  const subtotal = items.reduce((a, i) => a + (i.pivot?.total_price ?? 0), 0);
  const diskon = +(transaction.discount ?? 0);
  const ongkir = +(transaction.shipping_cost ?? 0);
  const total = subtotal - diskon + ongkir;
  const dibayar = payments.reduce((a, p) => a + (p.payment_price ?? 0), 0);
  const sisa = total - dibayar;

  const badge = STATUS[(transaction.status ?? 'accepted') as keyof typeof STATUS] ?? STATUS.accepted;

  const jalankan = async (mode: 'print' | 'download') => {
    setAksi(mode);
    try {
      const { data } = await refetch();
      if (!data) {
        toast.error('Faktur gagal dimuat');
        return;
      }
      if (mode === 'print') printInvoice(data);
      else downloadInvoice(data, `${transaction.transaction_code}.pdf`);
    } finally {
      setAksi(null);
    }
  };

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(transaction.transaction_code);
      toast.success('Kode disalin');
    } catch {
      toast.error('Gagal menyalin kode');
    }
  };

  return (
    <ReactModal
      isOpen={open}
      onRequestClose={onClose}
      // Tanpa ini react-modal melepas node-nya seketika dan animasi keluar tidak pernah
      // sempat berjalan. Angkanya harus >= durasi transisi di globals.css.
      closeTimeoutMS={220}
      onAfterClose={onClosed}
      overlayClassName="modal-overlay"
      // Bentuk objek, bukan string: dengan string, react-modal menyusun nama kelas
      // penanda dari seluruh string kelas Tailwind di bawah — yang mustahil ditulis
      // di CSS. Objek memisahkan kelas tetap dari kelas penanda buka/tutup.
      //
      // Sheet kanan, bukan kotak di tengah: daftar transaksi tetap terlihat di
      // belakangnya, dan daftar barang sepanjang apa pun bergulir di dalam sheet
      // tanpa mengubah ukuran dialognya.
      className={{
        base: 'sheet fixed inset-y-0 right-0 z-50 flex w-[480px] max-w-full flex-col border-l border-border bg-surface shadow-md outline-none',
        afterOpen: 'sheet--open',
        beforeClose: 'sheet--closing',
      }}
    >
      <div className="flex h-12 flex-shrink-0 items-center justify-between gap-3 border-b border-border px-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-mono text-lg font-semibold">{transaction.transaction_code}</span>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <div className="text-xs text-foreground-subtle">
            {dayjs(transaction.created_at).format('DD MMM YYYY · HH:mm')}
          </div>
        </div>
        <Button size="icon-xs" variant="ghost" aria-label="Tutup" onClick={onClose}>
          <X strokeWidth={2} aria-hidden />
        </Button>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1.25 border-b border-border px-4 py-1.75">
        <Button size="xs" variant="outline" loading={aksi === 'print'} onClick={() => jalankan('print')}>
          {aksi !== 'print' && <Printer strokeWidth={1.8} aria-hidden />} Print
        </Button>
        <Button size="xs" variant="outline" loading={aksi === 'download'} onClick={() => jalankan('download')}>
          {aksi !== 'download' && <Download strokeWidth={1.8} aria-hidden />} Download
        </Button>
        <div className="flex-1" />
        <Button size="icon-xs" variant="ghost" aria-label="Copy kode transaksi" tooltip="Copy" onClick={salin}>
          <Copy strokeWidth={1.7} aria-hidden />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Section title="Total" first tinted>
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-mono text-xl font-bold tracking-[-0.02em] text-accent">Rp {angka(total)}</span>
            {sisa <= 0 ? <Badge variant="success">Lunas</Badge> : <Badge variant="warning">Sisa {angka(sisa)}</Badge>}
          </div>
          <div className="mt-px flex flex-col gap-0.75">
            <Baris label="Subtotal" value={angka(subtotal)} />
            <Baris label="Diskon" value={diskon ? `−${angka(diskon)}` : '0'} />
            <Baris label="Ongkos kirim" value={angka(ongkir)} />
          </div>
        </Section>

        <Section title="Dibayar">
          {payments.map((p, i) => {
            const metode = formatPaymentMethod(p.payment_method ?? '');
            return (
              // eslint-disable-next-line react/no-array-index-key
              <div key={i} className="flex items-baseline justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-base font-medium">
                    <span
                      className={cn('size-[7px] flex-shrink-0 rounded-full', WARNA_METODE[metode] ?? 'bg-accent')}
                    />
                    {metode}
                  </span>
                  {p.due_date && (
                    <div className="text-xs text-foreground-subtle">
                      Jatuh tempo {dayjs(p.due_date).format('D MMM YYYY')}
                    </div>
                  )}
                </div>
                <span className="font-mono text-base font-semibold tabular-nums">{angka(p.payment_price ?? 0)}</span>
              </div>
            );
          })}
        </Section>

        <Section title={`Barang · ${items.length}`}>
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-medium">{item.name}</div>
                  <div className="mt-px font-mono text-xs text-foreground-subtle">
                    {item.pivot.quantity} {item.unit} × {angka(item.pivot.purchase_price ?? 0)}
                  </div>
                </div>
                <span className="whitespace-nowrap font-mono text-base font-semibold tabular-nums">
                  {angka(item.pivot.total_price)}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Pihak">
          <div className="flex flex-col gap-1">
            <Baris2 label="Customer" value={transaction.customer?.full_name ?? 'Umum'} />
            <Baris2
              label="Kasir"
              value={`${transaction.pic?.employee?.first_name ?? ''} ${
                transaction.pic?.employee?.last_name ?? ''
              }`.trim()}
            />
            <Baris2
              label="Pengirim"
              value={`${transaction.sender?.first_name ?? ''} ${transaction.sender?.last_name ?? ''}`.trim()}
            />
          </div>
        </Section>

        {transaction.note ? (
          <Section title="Catatan">
            <p className="text-base text-foreground-muted">{transaction.note}</p>
          </Section>
        ) : null}
      </div>

      <div className="flex flex-shrink-0 items-center justify-between border-t border-border bg-surface-raised px-4 py-2 text-xs text-foreground-subtle">
        <span>Nomor faktur</span>
        <span className="font-mono">{transaction.invoice_number}</span>
      </div>
    </ReactModal>
  );
}

function Baris2({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-foreground-muted">{label}</span>
      <span className="truncate font-medium">{value || '—'}</span>
    </div>
  );
}

export default TransactionDetailSheet;
