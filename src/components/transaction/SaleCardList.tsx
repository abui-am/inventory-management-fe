import dayjs from 'dayjs';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { RecordCard, RecordCardList } from '@/components/ui/record-card';
import { SaleTransactionsData } from '@/typings/sale';
import { formatPaymentMethod } from '@/utils/format';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

const waktu = (iso: string | Date) =>
  dayjs(iso).format(dayjs(iso).year() === dayjs().year() ? 'DD MMM HH:mm' : 'DD MMM YY HH:mm');

/** Daftar transaksi penjualan di layar sempit. Peran tiap kolom dijelaskan di `RecordCard`. */
export function SaleCardList({
  rows,
  loading,
  perPage,
  empty,
  status,
  total,
  onOpen,
  aksi,
}: {
  rows: SaleTransactionsData[];
  loading: boolean;
  perPage: number;
  empty: { judul: string; pesan: string };
  /** Lencana status baris — dihitung pemanggil supaya kamusnya tetap satu. */
  status: (row: SaleTransactionsData) => { label: string; variant: 'warning' | 'info' | 'success' | 'destructive' };
  total: (row: SaleTransactionsData) => number;
  onOpen: (row: SaleTransactionsData) => void;
  aksi: (row: SaleTransactionsData) => React.ReactNode;
}): JSX.Element {
  return (
    <RecordCardList loading={loading} count={perPage} empty={empty} isEmpty={rows.length === 0}>
      {rows.map((row) => {
        const badge = status(row);
        // Unik tanpa Set: target tsconfig masih ES5.
        const metode = (row.payments ?? [])
          .map((p) => formatPaymentMethod(p.payment_method ?? ''))
          .filter((m, i, semua) => semua.indexOf(m) === i);

        return (
          <RecordCard
            key={row.id}
            ariaLabel={`Lihat ${row.transaction_code}`}
            onOpen={() => onOpen(row)}
            redup={row.status === 'declined'}
            utama={<span className="font-mono">{row.transaction_code}</span>}
            pendamping={[row.customer?.full_name ?? 'Umum', metode.join(' · ') || '—']}
            nilai={formatNumber(total(row))}
            status={<Badge variant={badge.variant}>{badge.label}</Badge>}
            meta={waktu(row.created_at)}
            aksi={aksi(row)}
          />
        );
      })}
    </RecordCardList>
  );
}

export default SaleCardList;
