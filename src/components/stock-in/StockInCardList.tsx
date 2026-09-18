import dayjs from 'dayjs';
import React from 'react';

import { STATUS, StockInStatus, sumPayments } from '@/components/stock-in/StockInTable';
import { Badge } from '@/components/ui/badge';
import { RecordCard, RecordCardList } from '@/components/ui/record-card';
import { TransactionData } from '@/typings/stock-in';
import { formatPaymentMethod } from '@/utils/format';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

const waktu = (iso: string | Date) =>
  dayjs(iso).format(dayjs(iso).year() === dayjs().year() ? 'DD MMM HH:mm' : 'DD MMM YY HH:mm');

/** Daftar barang masuk di layar sempit. Peran tiap kolom dijelaskan di `RecordCard`. */
export function StockInCardList({
  rows,
  loading,
  perPage,
  empty,
  onOpen,
  aksi,
}: {
  rows?: TransactionData[];
  loading: boolean;
  perPage: number;
  empty: { judul: string; pesan: string };
  onOpen: (row: TransactionData) => void;
  /** Tombol yang mengubah status — isinya sama persis dengan yang di tabel. */
  aksi: (row: TransactionData) => React.ReactNode;
}): JSX.Element {
  return (
    <RecordCardList loading={loading} count={perPage} empty={empty} isEmpty={rows?.length === 0}>
      {rows?.map((row) => {
        const status = (row.status ?? 'pending') as StockInStatus;
        const badge = STATUS[status] ?? STATUS.pending;
        // Unik tanpa Set: target tsconfig masih ES5.
        const metode = (row.payments ?? [])
          .map((p) => formatPaymentMethod(p.payment_method))
          .filter((m, i, semua) => semua.indexOf(m) === i);

        return (
          <RecordCard
            key={row.id}
            ariaLabel={`Lihat ${row.transaction_code}`}
            onOpen={() => onOpen(row)}
            redup={status === 'declined'}
            utama={<span className="font-mono">{row.transaction_code}</span>}
            pendamping={[row.supplier?.name ?? '—', metode.join(' · ') || '—']}
            nilai={formatNumber(sumPayments(row.payments))}
            status={<Badge variant={badge.variant}>{badge.label}</Badge>}
            meta={waktu(row.created_at)}
            aksi={aksi(row)}
          />
        );
      })}
    </RecordCardList>
  );
}

export default StockInCardList;
