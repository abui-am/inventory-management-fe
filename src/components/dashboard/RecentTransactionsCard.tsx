import dayjs from 'dayjs';
import { Plus } from 'lucide-react';
import Link from 'next/link';

import EmptyState from '@/components/dashboard/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { SaleTransactionsData } from '@/typings/sale';
import { formatNumber } from '@/utils/format';

// SPEC-20: header kolom 11px/700 subtle, padding 0 10px 7px, garis bawah. `pt-0` bukan
// hiasan: preflight Tailwind tidak menyentuh padding th, jadi tanpa itu padding-atas
// jatuh ke bawaan browser (1px) dan garis header tidak sejajar dengan judul kartunya.
const TH = 'border-b border-border px-2.5 pb-1.75 pt-0 text-xs font-bold text-foreground-subtle';
// SPEC-21: 13px, padding 8px 10px, garis bawah di SETIAP baris termasuk yang terakhir.
const TD = 'border-b border-border px-2.5 py-2 align-middle text-base';

// SPEC-23: peta status sama persis dengan halaman /transaction — satu kata untuk satu
// keadaan, di mana pun ia muncul.
const STATUS = {
  pending: { label: 'Menunggu', variant: 'warning' },
  'on-review': { label: 'Ditinjau', variant: 'info' },
  accepted: { label: 'Diterima', variant: 'success' },
  declined: { label: 'Ditolak', variant: 'destructive' },
} as const;

/** SPEC-22: `14:32`. Tanggalnya ikut muncul kalau transaksinya bukan hari ini. */
const waktu = (iso: string | Date) =>
  dayjs(iso).isSame(dayjs(), 'day') ? dayjs(iso).format('HH:mm') : dayjs(iso).format('D MMM HH:mm');

const sumPayments = (payments: { payment_price?: number }[] = []) =>
  payments.reduce((t, p) => t + (p.payment_price ?? 0), 0);

/** SPEC-18..25. Lima transaksi terbaru — bukan lima teratas dalam rentang tanggal. */
export function RecentTransactionsCard({
  transactions,
  onSelect,
}: {
  transactions?: SaleTransactionsData[];
  onSelect: (transaction: SaleTransactionsData) => void;
}): JSX.Element {
  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-card border border-border bg-surface px-4 py-3.5 shadow-sm">
      {/* SPEC-19 */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-base font-semibold">Transaksi terakhir</span>
        <Link href="/transaction/add">
          <a>
            <Button size="xs">
              <Plus strokeWidth={2.2} aria-hidden /> Transaksi baru
            </Button>
          </a>
        </Link>
      </div>

      {transactions === undefined && (
        // Tinggi persis tabelnya: header 23.5px lalu lima baris 37.5px, tanpa jarak —
        // jaraknya sudah termasuk padding sel dan garis bawahnya. Sebelumnya lima balok
        // 32px berjarak 8px, dan tabelnya melompat 20px saat data datang.
        <div className="flex flex-col">
          <Skeleton className="h-[23.5px] w-full rounded-none" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[37.5px] w-full rounded-none" />
          ))}
        </div>
      )}

      {transactions?.length === 0 && (
        <EmptyState>Belum ada transaksi tercatat. Transaksi pertama akan muncul di sini.</EmptyState>
      )}

      {transactions && transactions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th scope="col" className={cn(TH, 'text-left')}>
                  Waktu
                </th>
                <th scope="col" className={cn(TH, 'text-left')}>
                  Kode
                </th>
                <th scope="col" className={cn(TH, 'text-left')}>
                  Customer
                </th>
                <th scope="col" className={cn(TH, 'text-right')}>
                  Jumlah
                </th>
                <th scope="col" className={cn(TH, 'text-right')}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((row) => {
                const badge = STATUS[row.status as keyof typeof STATUS] ?? {
                  label: row.status,
                  variant: 'neutral' as const,
                };
                const nama = row.customer?.full_name ?? 'Umum';
                return (
                  // SPEC-24: seluruh baris membuka rincian. Dibuat bisa difokus dan
                  // ditekan dengan papan ketik — baris tabel bukan tombol, jadi perannya
                  // harus dinyatakan, bukan hanya diberi onClick.
                  <tr
                    key={row.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Rincian transaksi ${row.transaction_code}`}
                    onClick={() => onSelect(row)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect(row);
                      }
                    }}
                    className="cursor-pointer transition-colors duration-fast hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <td className={cn(TD, 'whitespace-nowrap font-mono tabular-nums text-foreground-muted')}>
                      {waktu(row.created_at)}
                    </td>
                    <td className={cn(TD, 'whitespace-nowrap font-mono font-medium')}>{row.transaction_code}</td>
                    <td className={cn(TD, 'max-w-0 truncate')} title={nama}>
                      {nama}
                    </td>
                    <td className={cn(TD, 'whitespace-nowrap text-right font-mono font-semibold tabular-nums')}>
                      {formatNumber(sumPayments(row.payments))}
                    </td>
                    <td className={cn(TD, 'text-right')}>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RecentTransactionsCard;
