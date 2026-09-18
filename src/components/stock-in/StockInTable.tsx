import dayjs from 'dayjs';
import { Check, ChevronDown, ChevronUp, Eye, Undo2, X } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { TransactionData } from '@/typings/stock-in';
import { formatPaymentMethod } from '@/utils/format';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

// Disalin PERSIS dari /transaction — dua tabel di alur yang sama tidak boleh punya ritme
// yang berbeda, sampai ke padding-atas 9px-nya.
const TH = 'border-b border-border px-2.5 pb-1.75 pt-2.25 text-xs font-bold text-foreground-subtle';
// Disalin PERSIS dari /transaction. Setiap sel SATU baris — begitu ada sel dua baris,
// tinggi barisnya naik ke 45-53px dan dua tabel di alur yang sama berhenti sejajar.
// Nomor faktur karena itu tidak lagi di tabel; ia ada di sheet rinciannya.
const TD = 'border-b border-border px-2.5 py-2 align-middle text-base';

export const STATUS = {
  pending: { label: 'Menunggu', variant: 'warning' },
  'on-review': { label: 'Ditinjau', variant: 'info' },
  accepted: { label: 'Diterima', variant: 'success' },
  declined: { label: 'Dibatalkan', variant: 'destructive' },
} as const;

export type StockInStatus = keyof typeof STATUS;

/** Jumlah transaksi = jumlah yang dibayarkan; backend tidak mengirim `total_price`. */
export const sumPayments = (payments?: { payment_price?: number }[]): number =>
  (payments ?? []).reduce((total, p) => total + +(p?.payment_price ?? 0), 0);

const waktu = (iso: string | Date) =>
  dayjs(iso).format(dayjs(iso).year() === dayjs().year() ? 'DD MMM HH:mm' : 'DD MMM YY HH:mm');

export type Kolom = { key: string; label: string; align?: 'right'; width?: string; className?: string };

/** `aria-sort` hanya boleh terpasang di kolom yang sedang disortir, bukan di semuanya. */
const ariaSort = (aktif: boolean, dir: 'asc' | 'desc'): 'ascending' | 'descending' | undefined => {
  if (!aktif) return undefined;
  return dir === 'asc' ? 'ascending' : 'descending';
};

export function StockInTable({
  rows,
  loading,
  perPage,
  columns,
  sort,
  onSort,
  aksi,
  isAdmin,
  onOpen,
  empty,
  signature,
  pagination,
}: {
  rows?: TransactionData[];
  loading: boolean;
  perPage: number;
  columns: Kolom[];
  sort: { key: string; dir: 'asc' | 'desc' };
  onSort: (key: string) => void;
  /** Tombol tambahan sesudah ikon mata — isinya ditentukan status dan izin. */
  aksi: (row: TransactionData) => React.ReactNode;
  isAdmin: boolean;
  onOpen: (row: TransactionData) => void;
  empty: { judul: string; pesan: string };
  /** Berubah hanya saat isi tabel benar-benar berganti — dipakai sebagai key tbody. */
  signature: string;
  pagination: React.ReactNode;
}): JSX.Element {
  // Kelas kolom harus mendarat di `th` DAN `td`. Dipasang hanya di header, kolom yang
  // disembunyikan pada layar sempit menghilang dari kepala tapi selnya tetap ada — dan
  // seluruh baris bergeser satu kolom.
  const kelas = (key: string) => columns.find((c) => c.key === key)?.className;

  return (
    // SPEC-09
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            {/* Latar kepala tabel — ini yang hilang dan membuatnya tidak sama dengan
                /transaction. */}
            <tr className="bg-surface-raised">
              {columns.map((col) => {
                const aktif = sort.key === col.key;
                const bisaUrut = SORTABLE[col.key];
                const Arrow = sort.dir === 'asc' ? ChevronUp : ChevronDown;

                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(TH, col.align === 'right' ? 'text-right' : 'text-left', col.className)}
                    // Hanya kolom yang SEDANG disortir yang boleh punya aria-sort.
                    aria-sort={ariaSort(aktif, sort.dir)}
                  >
                    {bisaUrut ? (
                      <button
                        type="button"
                        onClick={() => onSort(col.key)}
                        className={cn(
                          'group inline-flex items-center gap-1 transition-colors duration-fast hover:text-foreground',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25',
                          aktif && 'text-foreground'
                        )}
                      >
                        {col.label}
                        {aktif ? (
                          <Arrow size={11} aria-hidden />
                        ) : (
                          // Chevron hantu: memberi tahu kolomnya bisa disortir tanpa
                          // menambah tinggi baris kepala.
                          <ChevronDown
                            size={11}
                            aria-hidden
                            className="opacity-0 transition-opacity duration-fast group-hover:opacity-60"
                          />
                        )}
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* fade-in 200ms saat isi berganti. Hanya opacity — tidak ada properti yang
              memicu layout ulang. */}
          <tbody key={signature} className="animate-in fade-in duration-200">
            {loading &&
              Array.from({ length: perPage }, (_, i) => (
                // Satu sel per kolom, bukan `colSpan`: tanpa itu browser tidak punya apa
                // pun untuk melebarkan kolomnya dan baloknya berhenti di tengah kartu.
                // eslint-disable-next-line react/no-array-index-key
                <tr key={i}>
                  {columns.map((col) => (
                    // Tinggi isi dikunci 26px — setinggi tombol aksi, elemen tertinggi di
                    // baris asli. Dengan padding 8px dan garis bawah, barisnya jadi 43px
                    // persis seperti baris berisi data.
                    <td key={col.key} className={cn(TD, kelas(col.key))}>
                      <div className="flex h-[26px] items-center">
                        <Skeleton className="h-3.5 w-full" />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && rows?.length === 0 && (
              // Empty state DI DALAM tbody, seperti /transaction: di luar tabel ia
              // kehilangan lebar kolomnya dan menempel ke tepi kartu.
              <tr>
                <td colSpan={columns.length} className="px-2.5 py-12 text-center">
                  <p className="text-base font-medium">{empty.judul}</p>
                  <p className="mt-1 text-sm text-foreground-muted">{empty.pesan}</p>
                </td>
              </tr>
            )}

            {!loading &&
              rows?.map((row) => {
                const status = (row.status ?? 'pending') as StockInStatus;
                const badge = STATUS[status] ?? STATUS.pending;
                // Unik tanpa Set: target tsconfig masih ES5, jadi spread di atas Set
                // butuh downlevelIteration yang tidak dinyalakan di project ini.
                const metode = (row.payments ?? [])
                  .map((p) => formatPaymentMethod(p.payment_method))
                  .filter((m, i, semua) => semua.indexOf(m) === i);
                const nama = `${row.pic?.employee?.first_name ?? ''} ${row.pic?.employee?.last_name ?? ''}`.trim();

                return (
                  <tr
                    key={row.id}
                    className={cn(
                      'transition-colors duration-fast hover:bg-surface-raised',
                      // Yang dibatalkan diredupkan, bukan disembunyikan.
                      status === 'declined' && 'opacity-55'
                    )}
                  >
                    {/* SPEC-13 */}
                    <td
                      className={cn(
                        TD,
                        kelas('waktu'),
                        'whitespace-nowrap font-mono tabular-nums text-foreground-muted'
                      )}
                    >
                      {waktu(row.created_at)}
                    </td>

                    <td className={cn(TD, 'whitespace-nowrap font-mono font-medium')}>{row.transaction_code}</td>

                    <td className={cn(TD, 'max-w-0 truncate')} title={row.supplier?.name}>
                      {row.supplier?.name ?? '—'}
                    </td>

                    <td className={cn(TD, 'whitespace-nowrap text-foreground-muted')}>{metode.join(' · ') || '—'}</td>

                    {/* SPEC-16 */}
                    <td className={cn(TD, kelas('kasir'), 'max-w-0 truncate text-foreground-muted')} title={nama}>
                      {isAdmin && row.pic?.id ? (
                        <Link href={`/employee/${row.pic.id}`} className="hover:text-foreground hover:underline">
                          {nama || '—'}
                        </Link>
                      ) : (
                        nama || '—'
                      )}
                    </td>

                    {/* SPEC-17 */}
                    <td className={cn(TD, 'whitespace-nowrap text-right font-mono font-semibold tabular-nums')}>
                      {formatNumber(sumPayments(row.payments))}
                    </td>

                    {/* SPEC-18 */}
                    <td className={TD}>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>

                    {/* SPEC-22: mendatar, tiap ikon dalam kotak 26px yang sama. */}
                    <td className={TD}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          aria-label="Lihat detail barang masuk"
                          onClick={() => onOpen(row)}
                        >
                          <Eye strokeWidth={1.7} aria-hidden />
                        </Button>
                        {aksi(row)}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {pagination}
    </div>
  );
}

/**
 * Kolom yang benar-benar bisa disortir server.
 *
 * `supplier` dan `jumlah` sengaja TIDAK ada: supplier adalah relasi (query-nya melempar
 * 500), dan jumlah dihitung dari `payments[]` sehingga tidak punya kolom sama sekali.
 * Sama persis dengan pembatasan di /transaction.
 */
export const SORTABLE: Record<string, string> = {
  waktu: 'created_at',
  kode: 'transaction_code',
  status: 'status',
};

/**
 * Tombol aksi yang menaikkan status — bentuknya seragam, warnanya yang membedakan.
 *
 * Ikonnya centang polos, bukan centang berlencana: lencananya membawa arti "terverifikasi"
 * yang bukan urusan tombol ini, dan pada 14px sudut-sudutnya hanya jadi gerigi.
 */
export function AksiKonfirmasi({ onClick, label }: { onClick: () => void; label: string }): JSX.Element {
  return (
    <Button
      size="icon-xs"
      variant="ghost"
      aria-label={label}
      tooltip={label}
      className="hover:text-success"
      onClick={onClick}
    >
      <Check strokeWidth={2.2} aria-hidden />
    </Button>
  );
}

/** Retur: barangnya sudah diterima, sebagian dikembalikan ke supplier. */
export function AksiRetur({ onClick }: { onClick: () => void }): JSX.Element {
  return (
    <Button
      size="icon-xs"
      variant="ghost"
      aria-label="Retur barang ke supplier"
      tooltip="Retur barang ke supplier"
      className="hover:text-warning"
      onClick={onClick}
    >
      <Undo2 strokeWidth={1.9} aria-hidden />
    </Button>
  );
}

export function AksiBatal({ onClick }: { onClick: () => void }): JSX.Element {
  return (
    <Button
      size="icon-xs"
      variant="ghost"
      aria-label="Batalkan barang masuk"
      className="hover:text-destructive"
      onClick={onClick}
    >
      <X strokeWidth={2} aria-hidden />
    </Button>
  );
}

export default StockInTable;
